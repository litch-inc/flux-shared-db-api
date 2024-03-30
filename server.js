'use strict';

require('express-async-errors');
require('dotenv').config();

const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const cors = require('cors');
const { doubleCsrf } = require('csrf-csrf');
const express = require('express');
const expressRateLimit = require('express-rate-limit');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const lodash = require('lodash');
const memoryCache = require('memory-cache');
const { Server } = require('socket.io');

const BacklogClass = require('./api/classes/backlog.class');
const IdServiceClass = require('./api/classes/id-service.class');
const OperatorClass = require('./api/classes/operator.class');
const SecurityClass = require('./api/classes/security.class');
const AuthFunction = require('./api/functions/auth.function');
const SecurityFunction = require('./api/functions/security.function');
const UtilityFunction = require('./api/functions/utility.function');
const Logger = require('./api/utils/logger');

// deepcode ignore UseCsurfForExpress: <false positive csrf fixed with better doubleCsrf implemnted with csrf-csrf>
const api = express();
const cookieOptions = {
	maxAge: process.env.COOKIE_MAX_AGE,
	expires: new Date(Date.now() + Number(process.env.JWT_EXPIRATION_30_MIN)),
	httpOnly: false,
	domain: process.env.COOKIE_DOMAIN,
  secure: true,
	sameSite: 'strict'
};
const cookieOptionsJWT = lodash.cloneDeep(cookieOptions);
cookieOptionsJWT.httpOnly = true;
const {
	invalidCsrfTokenError,
	generateToken,
	doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: process.env.COOKIE_NAME,
  cookieOptions
});
// Error handling, validation error interception
const csrfErrorHandler = (error, request, response, next) => {
  if (error === invalidCsrfTokenError) {
		response.status(403).json({ message: 'CSRF validation unsuccessful!' });
  } else {
    next();
  }
};

// TODO: Configure helmet
api.use(helmet(),
        cookieParser(process.env.COOKIE_SECRET),
				cookieSession({
					name: process.env.JWT_NAME,
					secret: process.env.JWT_SECRET,
				  // deepcode ignore WebCookieSecureDisabledByDefault: <false positve variable cookieOptionsJWT contains secure: true>
          cookie: cookieOptionsJWT
				}),
        cors({
          credentials: true,
          exposedHeaders: '*',
          // Default angular serve
          origin: ['https://localhost:4200']
          // Replace with new ngrock url and comment out default if testing mock real url
          // origin: ["https://localhost:4200"]
        }),
        expressRateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100 // max 100 requests per windowMs
        }),
        // parse requests of content-type - application/json
        express.json(),
        // parse requests of content-type - application/x-www-form-urlencoded
        express.urlencoded({ extended: true }),
				(request, response, next) => {
					response.header('Access-Control-Allow-Origin', 'https://localhost:4200');
					response.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
					response.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Length, Content-Type, Origin, X-Requested-With, X-CSRF-TOKEN');
					// TODO: Permissions-Policy need to set once production app deployed
					response.header('Permissions-Policy', 'geolocation=(), interest-cohort=()');
					next();
				});

// Route only used for generating a token for the session
require('./api/routes/auth-csrf.route')(api, generateToken);

// Routes must be after cors and permission setup
require('./api/routes/auth.route')(api, doubleCsrfProtection, csrfErrorHandler);
require('./api/routes/db-actions.route')(api, doubleCsrfProtection, csrfErrorHandler);
require('./api/routes/log.route')(api, doubleCsrfProtection, csrfErrorHandler);

// simple route
api.get('/', (request, response) => {
  response.status(200).json({ message: '© InFlux Technologies' });
});

if (process.env.API_SSL) {
  const keys = SecurityFunction.generateRSAKey();
  const httpsOptions = {
    key: keys.pemPrivateKey,
    cert: keys.pemCertificate
  };
  https.createServer(httpsOptions, api).listen(process.env.DEBUG_UI_PORT, () => {
    Logger.apiLogger.info(`starting SSL interface on port ${process.env.DEBUG_UI_PORT}`);
  });
} else {
  // deepcode ignore HttpToHttps: <http should only be used by flux team for testing and debugging purposes>
  http.createServer(api).listen(process.env.DEBUG_UI_PORT, () => {
    Logger.apiLogger.info(`starting non SSL interface on port ${process.env.DEBUG_UI_PORT}`);
  });
}

async function validate(ip) {
  return OperatorClass.AppNodes.includes(ip);
}

async function initServer() {
  await SecurityClass.init();
  await OperatorClass.init();
  const socketIOServer = new Server(process.env.API_PORT, { transports: ['websocket', 'polling'], maxHttpBufferSize: 4 * 1024 * 1024 });
  OperatorClass.serverSocket = socketIOServer;

  socketIOServer.on('connection', async (socket) => {
    const ip = UtilityFunction.convertIP(socket.handshake.address);
    Logger.apiLogger.debug(`connection from ${ip}`, 'red');
    if (AuthFunction.ipCheck(ip, OperatorClass.OpNodes)) {
      socket.on('disconnect', () => {
        Logger.apiLogger.info(`disconnected from ${ip}`, 'red');
      });

      socket.on('getStatus', async (callback) => {
        callback({
          status: OperatorClass.status,
          sequenceNumber: BacklogClass.sequenceNumber,
          remoteIP: UtilityFunction.convertIP(socket.handshake.address),
          masterIP: OperatorClass.getMaster()
        });
      });

      socket.on('getMaster', async (callback) => {
        callback({ status: 'success', message: OperatorClass.getMaster() });
      });

      socket.on('getMyIp', async (callback) => {
        callback({ status: 'success', message: UtilityFunction.convertIP(socket.handshake.address) });
      });

      socket.on('getBackLog', async (start, callback) => {
        const records = BacklogClass.getLogs(start, 200);
        callback({ status: OperatorClass.status, sequenceNumber: BacklogClass.sequenceNumber, records });
      });

      socket.on('writeQuery', async (query, connId, callback) => {
        Logger.apiLogger.info(`writeQuery from ${UtilityFunction.convertIP(socket.handshake.address)}:${connId}`);
        const result = BacklogClass.pushQuery(query);
        socket.broadcast.emit('query', query, result.seq, result.timestamp, false);
        socket.emit('query', query, result.seq, result.timestamp, connId);
        // cache write queries for 20 seconds
        memoryCache.put(result.seq,
                        // eslint-disable-next-line object-curly-newline
                        { query, seq: result.seq, timestamp: result.timestamp, connId, ip },
                        1000 * 60);
        callback({ status: OperatorClass.status, result: result.records });
      });

      socket.on('askQuery', async (index, callback) => {
        Logger.apiLogger.info(`${ip} asking for seqNo: ${index}`, 'magenta');
        const record = memoryCache.get(index);
        let connId = -1;
        if (record) {
          if (record.ip === ip && record.connId) {
            connId = record.connId;
          }
          Logger.apiLogger.info(`sending query: ${index}`, 'magenta');
          socket.emit('query', record.query, record.seq, record.timestamp, connId);
        } else {
          Logger.apiLogger.warn(`query ${index} not in query cache`, 'red');
          let BLRecord = BacklogClass.instanceMemoryCache.get(index);
          Logger.apiLogger.info(JSON.stringify(BLRecord), 'red');
          if (!BLRecord) {
            BLRecord = BacklogClass.getLog(index);
            Logger.apiLogger.info(`from DB : ${JSON.stringify(BLRecord)}`, 'red');
            try {
              socket.emit('query', BLRecord[0].query, BLRecord[0].seq, BLRecord[0].timestamp, connId);
            } catch (error) {
              Logger.apiLogger.error(`>> ${error}`, { label: 'server - async function initServer - socket.on - askQuery - catch - error' });
            }
          }
        }
        callback({ status: OperatorClass.status });
      });

      socket.on('shareKeys', async (pubKey, callback) => {
        const nodeip = UtilityFunction.convertIP(socket.handshake.address);
        let nodeKey = null;
        if (!(`N${nodeip}` in OperatorClass.keys)) {
          OperatorClass.keys = await BacklogClass.getAllKeys();
          if (`N${nodeip}` in OperatorClass.keys) {
            nodeKey = OperatorClass.keys[`N${nodeip}`];
          }
          if (nodeKey) {
            nodeKey = SecurityClass.publicEncrypt(pubKey, Buffer.from(nodeKey, 'hex'));
          }
        }
        callback({
          status: OperatorClass.status,
          commAESKey: SecurityClass.publicEncrypt(pubKey, SecurityClass.getCommAESKey()),
          commAESIV: SecurityClass.publicEncrypt(pubKey, SecurityClass.getCommAESIv()),
          key: nodeKey
        });
      });

      socket.on('updateKey', async (key, value, callback) => {
        const decKey = SecurityClass.decryptComm(key);
        Logger.apiLogger.info(`updateKey from ${decKey}`);
        await BacklogClass.pushKey(decKey, value);
        OperatorClass.keys[decKey] = value;
        socket.broadcast.emit('updateKey', key, value);
        callback({ status: OperatorClass.status });
      });

      socket.on('getKeys', async (callback) => {
        const keysToSend = {};
        const nodeip = UtilityFunction.convertIP(socket.handshake.address);
        OperatorClass.keys.forEach((key) => {
          if ((key.startsWith('N') || key.startsWith('_')) && key !== `N${nodeip}`) {
            keysToSend[key] = OperatorClass.keys[key];
          }
        });
        keysToSend[`N${OperatorClass.myIP}`] = SecurityClass.encryptComm(`${SecurityClass.getKey()}:${SecurityClass.getIV()}`);
        callback({ status: OperatorClass.status, keys: SecurityClass.encryptComm(JSON.stringify(keysToSend)) });
      });

      socket.on('resetMaster', async (callback) => {
        if (OperatorClass.IamMaster) {
          Object.keys(socketIOServer.sockets.sockets).forEach((s) => {
            socketIOServer.sockets.sockets[s].disconnect(true);
          });
          OperatorClass.findMaster();
        }
        callback({ status: OperatorClass.status });
      });

      socket.on('rollBack', async (seqNo, callback) => {
        if (OperatorClass.IamMaster) {
          OperatorClass.rollBack(seqNo);
        }
        callback({ status: OperatorClass.status });
      });

      socket.on('userSession', async (op, key, value, callback) => {
        if (op === 'add') {
          IdServiceClass.addNewSession(key, value);
        } else {
          IdServiceClass.removeSession(key);
        }
        socket.broadcast.emit('userSession', op, key, value);
        callback({ status: OperatorClass.status });
      });
    } else {
      Logger.apiLogger.warn(`rejected from ${ip}`);
      socket.disconnect();
    }
    if (await validate(ip)) {
      // log.info(`auth: ${ip} is validated`);
    } else {
      Logger.apiLogger.warn(`validation failed for ${ip}`, 'red');
      socket.disconnect();
    }
  });
  IdServiceClass.init();
  Logger.apiLogger.info(`Api Server started on port ${process.env.API_PORT}`);
  await OperatorClass.findMaster();
  Logger.apiLogger.info(`find master finished, master is ${OperatorClass.masterNode}`);
  if (!OperatorClass.IamMaster) {
    OperatorClass.initMasterConnection();
  }
  setInterval(async () => {
    OperatorClass.doHealthCheck();
  }, 120000);
}

initServer();
