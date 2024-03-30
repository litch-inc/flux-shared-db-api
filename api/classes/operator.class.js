'use strict';

const lodash = require('lodash');
const memoryCache = require('memory-cache');
const net = require('net');
const timer = require('timers/promises');

const BacklogClass = require('./backlog.class');
const ConnectionPoolClass = require('./connection-pool.class');
const DBClientClass = require('./db-client.class');
const IdServiceClass = require('./id-service.class');
const MySQLServerClass = require('./mysql-server.class');
const SecurityClass = require('./security.class');
const MySQLConstant = require('../constants/mysql.contant');
const DataCheckerFunction = require('../functions/data-checker.function');
const FluxFunction = require('../functions/flux.function');
const MySQLAnalyzerFunction = require('../functions/mysql-analyzer.function');
const Logger = require('../utils/logger');

class OperatorClass {
  static #dbClient = null;
  static #OpNodes = [];
  static #masterCandidates = [];
  static #AppNodes = [];
  // static clientNodes = [];
  static #nodeInstances = 0;
  static #authorizedApp = null;
  static #masterNode = null;
  static #IamMaster = false;
  // static apiKey = null;
  static #myIP = null;
  static #masterWSConn;
  static #status = 'INIT';
  static #dbConnStatus = 'NOT_CONNECTED';
  static #serverSocket;
  static #keys = {};
  // static authorized = {};
  static #lastBufferSeqNo = 0;
  // static firstBufferSeqNo = 0;
  // static prevWriteQuery = '';
  static #connectionDrops = 0;
  static #ghosted = false;
  // static masterQueue = [];
  // static ticket = 0;
  static #sessionQueries = {};
  static #buffer = {};

  // static getTicket() {
  //   OperatorClass.ticket++;

  //   return OperatorClass.ticket;
  // }

  /**
   * Set for private variable #OpNodes
   *
   * @static
   * @param {string[]} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set OpNodes(value) {
    OperatorClass.#OpNodes = value;
  }

  /**
   * Get private variable #OpNodes
   *
   * @static
   * @return {string[]}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get OpNodes() {
    return OperatorClass.#OpNodes;
  }

  /**
   * Set for private variable #AppNodes
   *
   * @static
   * @param {string[]} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set AppNodes(value) {
    OperatorClass.#AppNodes = value;
  }

  /**
   * Get private variable #AppNodes
   *
   * @static
   * @return {string[]}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get AppNodes() {
    return OperatorClass.#AppNodes;
  }

  /**
   * Set for private variable #masterNode
   *
   * @static
   * @param {string} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set masterNode(value) {
    OperatorClass.#masterNode = value;
  }

  /**
   * Get private variable #masterNode
   *
   * @static
   * @return {string}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get masterNode() {
    return OperatorClass.#masterNode;
  }

  /**
   * Set for private variable #IamMaster
   *
   * @static
   * @param {boolean} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set IamMaster(value) {
    OperatorClass.#IamMaster = value;
  }

  /**
   * Get private variable #IamMaster
   *
   * @static
   * @return {boolean}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get IamMaster() {
    return OperatorClass.#IamMaster;
  }

  /**
   * Set for private variable #myIP
   *
   * @static
   * @param {string} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set myIP(value) {
    OperatorClass.#myIP = value;
  }

  /**
   * Get private variable #myIP
   *
   * @static
   * @return {string}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get myIP() {
    return OperatorClass.#myIP;
  }

  /**
   * Set for private variable #status
   *
   * @static
   * @param {string} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set status(value) {
    OperatorClass.#status = value;
  }

  /**
   * Get private variable #status
   *
   * @static
   * @return {string}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get status() {
    return OperatorClass.#status;
  }

  /**
   * Set for private variable #serverSocket
   *
   * @static
   * @param {socket.io.Server} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set serverSocket(value) {
    OperatorClass.#serverSocket = value;
  }

  /**
   * Get private variable #serverSocket
   *
   * @static
   * @return {socket.io.Server}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get serverSocket() {
    return OperatorClass.#serverSocket;
  }

  /**
   * Set for private variable #keys
   *
   * @static
   * @param {Record} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set keys(value) {
    OperatorClass.#keys = value;
  }

  /**
   * Get private variable #keys
   *
   * @static
   * @return {Record}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get keys() {
    return OperatorClass.#keys;
  }

  /**
   * Set for private variable #sessionQueries
   *
   * @static
   * @param {Record} value
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set sessionQueries(value) {
    OperatorClass.#sessionQueries = value;
  }

  /**
   * Get private variable #sessionQueries
   *
   * @static
   * @return {Record}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get sessionQueries() {
    return OperatorClass.#sessionQueries;
  }

  static initMasterConnection() {
    if (OperatorClass.#masterWSConn) {
      try {
        OperatorClass.#masterWSConn.removeAllListeners();
        OperatorClass.#masterWSConn.disconnect();
      } catch (error) {
        Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static initMasterConnection - catch - error' });
      }
    } else {
      // do nothing
    }

    if (OperatorClass.#masterNode && !OperatorClass.#IamMaster) {
      OperatorClass.#setupMasterWS();
    } else {
      // do nothing
    }
  }

  // TODO: ASK
  static handleAuthorize(param) {
    try {
      if (OperatorClass.#status !== 'OK' || OperatorClass.#ghosted) {
        return false;
      // wait untill there are incomming connections
      // deepcode ignore DuplicateIfBody: <false positive one is if else inside initial else>
      } else if (OperatorClass.#IamMaster && (OperatorClass.#serverSocket.engine.clientsCount < 1)) {
        return false;
      } else {
        const remoteIp = param.remoteIP;
        if (DataCheckerFunction.isUndefOrNull(OperatorClass.#authorizedApp)) {
          OperatorClass.#authorizedApp = remoteIp;
        } else {
          // do nothing
        }

        const whiteList = process.env.WHITELIST_IPS.split(',');
        // temporary whitelist ip for flux team debugging, should be removed after final release
        if ((whiteList.length && whiteList.includes(remoteIp)) || remoteIp === '167.235.234.45') {
          return true;
        // apps only can connect to the master node
        } else if (!OperatorClass.#IamMaster && (process.env.CLIENT_APPLICATION_NAME.includes('wordpress') || process.env.AUTH_MASTER_ONLY)) {
          return false;
        } else if (remoteIp === OperatorClass.#authorizedApp) {
          return true;
        // deepcode ignore DuplicateIfBody: <false positive one is if else inside initial else>
        } else if (OperatorClass.appIPList.includes(remoteIp)) {
          return true;
        } else {
          return false;
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static handleAuthorize - catch - error' });
      return false;
    }
  }

  static getMaster() {
    if (DataCheckerFunction.isUndefOrNull(OperatorClass.#masterNode)) {
      return (DataCheckerFunction.notUndefOrNull(OperatorClass.#masterCandidates)
             && Array.isArray(OperatorClass.#masterCandidates)
             && (OperatorClass.#masterCandidates.length > 0))
               ? OperatorClass.#masterCandidates[0]
               : null;
    } else {
      return OperatorClass.#masterNode;
    }
  }

  static async sendWriteQuery(query, connId = -1, fullQuery = null, masterSocket = null) {
    if (DataCheckerFunction.notUndefOrNull(OperatorClass.#masterNode)) {
      if (!OperatorClass.#IamMaster && DataCheckerFunction.notUndefOrNull(OperatorClass.#masterWSConn)) {
        return new Promise((resolve) => {
          OperatorClass.#masterWSConn.emit('writeQuery',
                                           query,
                                           connId,
                                           (response) => {
                                                           resolve(response.result);
                                                         });
        });
      } else {
        // do nothing
      }

      const result = BacklogClass.pushQuery(query, 0, Date.now(), false, connId, fullQuery || query);
      if (DataCheckerFunction.notUndefOrNull(OperatorClass.#serverSocket)) {
        OperatorClass.#serverSocket.emit('query', query, result.seq, result.timestamp, false);
      } else if (DataCheckerFunction.notUndefOrNull(masterSocket)) {
        masterSocket.emit('query', query, result.seq, result.timestamp, false);
      } else {
        // do nothing
      }

      return result;
    } else {
      // do nothing
    }

    return null;
  }

  static async rollBack(seqNo) {
    try {
      if (OperatorClass.#status !== 'ROLLBACK') {
        if (OperatorClass.#IamMaster) {
          OperatorClass.#status = 'ROLLBACK';
          OperatorClass.#serverSocket.emit('rollBack', seqNo);
          await BacklogClass.rebuildDatabase(seqNo);
          OperatorClass.#status = 'OK';
        } else if (DataCheckerFunction.notUndefOrNull(OperatorClass.#masterWSConn)) {
          return new Promise((resolve) => {
            OperatorClass.#masterWSConn.emit('rollBack',
                                             seqNo,
                                             (response) => {
                                                             resolve(response.result);
                                                           });
          });
        } else {
          // do nothing
        }
      } else {
        // do nothing
      }

      return null;
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async rollBack - catch - error' });
      return null;
    }
  }

  static async emitUserSession(op, key, value) {
    if (OperatorClass.#IamMaster && OperatorClass.#serverSocket) {
      OperatorClass.#serverSocket.emit('userSession', op, key, value);
    } else if (DataCheckerFunction.notUndefOrNull(OperatorClass.#masterWSConn)) {
      return new Promise((resolve) => {
        OperatorClass.#masterWSConn.emit('userSession',
                                         op,
                                         key,
                                         value,
                                         (response) => {
                                                         resolve(response.result);
                                                       });
      });
    } else {
      // do nothing
    }

    return null;
  }

  /**
   *
   *
   * @static
   * @param {{ command: string, extra: any, id: string, instanceMySQLServerClass: MySQLServerClass }}
   * @memberof OperatorClass
   */
  // eslint-disable-next-line object-curly-newline
  static async handleCommand({ command, extra, id, instanceMySQLServerClass }) {
    try {
      // command is a numeric ID, extra is a Buffer
      switch (command) {
        case MySQLConstant.COM_QUERY: {
          const query = extra.toString();
          const analyzedQueries = MySQLAnalyzerFunction.analyzeSQL(query, 'mysql');
          analyzedQueries.forEach(async (analyzedQuery) => {
            if (analyzedQuery.type === 'w' && analyzedQuery.sql.includes(process.env.DB_BACKLOG)) {
              // forward it to the master node
              if (DataCheckerFunction.notUndefOrNull(OperatorClass.#sessionQueries[id])) {
                await OperatorClass.sendWriteQuery(OperatorClass.#sessionQueries[id]);
                OperatorClass.#sessionQueries[id] = undefined;
              } else {
                await OperatorClass.sendWriteQuery(analyzedQuery.sql, id, query);
              }
            } else {
              if (analyzedQuery.type === 's') {
                OperatorClass.#sessionQueries[id] = analyzedQuery.sql;
              } else {
                // do nothing
              }
              const connectionById = ConnectionPoolClass.getConnectionById(id);
              await connectionById.query(analyzedQuery.sql, true);
            }
          });

          break;
        }
        case MySQLConstant.COM_PING: {
          instanceMySQLServerClass.sendOK({ message: 'OK' });
          break;
        }
        case null:
        case undefined:
        case MySQLConstant.COM_QUIT: {
          instanceMySQLServerClass.end();
          break;
        }
        case MySQLConstant.COM_INIT_DB: {
          const connectionById = ConnectionPoolClass.getConnectionById(id);
          await connectionById.query(`use ${extra}`);
          break;
        }
        default: {
          Logger.apiLogger.warn(`>> Unknown Command: ${command}`, { label: 'operator.class - OperatorClass - static async handleCommand - try - switch - default' });
          instanceMySQLServerClass.sendError({ message: 'Unknown Command' });
          break;
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async handleCommand - catch - error' });
    }
  }

  static async doHealthCheck() {
    try {
      ConnectionPoolClass.keepFreeConnections();
      BacklogClass.keepConnections();
      // update node list
      const ipList = FluxFunction.getApplicationIP(process.env.APPLICATION_NAME);
      const appIPList = process.env.APPLICATION_NAME === process.env.CLIENT_APPLICATION_NAME
                          ? ipList
                          : FluxFunction.getApplicationIP(process.env.CLIENT_APPLICATION_NAME);
      if (appIPList.length > 0) {
        let checkMasterIp = false;
        OperatorClass.#OpNodes = ipList.map((listItem) => {
                                                            const cloneDeepListItem = OperatorClass.#cloneDeepListItem(listItem);
                                                            if (DataCheckerFunction.notUndefOrNull(OperatorClass.#masterNode)
                                                                && cloneDeepListItem.ip === OperatorClass.#masterNode) {
                                                              checkMasterIp = true;
                                                            } else {
                                                              // do nothing
                                                            }

                                                            return { ip: cloneDeepListItem.ip, active: null };
                                                          });

        OperatorClass.#AppNodes = appIPList.map((listItem) => {
                                                                const cloneDeepListItem = OperatorClass.#cloneDeepListItem(listItem);

                                                                return cloneDeepListItem.ip;
                                                              });

        if (DataCheckerFunction.notUndefOrNull(OperatorClass.#masterNode) && !checkMasterIp) {
          OperatorClass.#masterNode = null;
          OperatorClass.#IamMaster = false;
          await OperatorClass.findMaster();
          OperatorClass.initMasterConnection();
        } else {
          // do nothing
        }

        if (OperatorClass.#IamMaster
            && DataCheckerFunction.notUndefOrNull(OperatorClass.#serverSocket)
            && (OperatorClass.#serverSocket.engine.clientsCount < 1)) {
          await OperatorClass.findMaster();
          OperatorClass.initMasterConnection();
        } else {
          // do nothing
        }
      } else {
        // do nothing
      }

      // check connection stability
      if (OperatorClass.#connectionDrops > 3) {
        OperatorClass.#ghosted = true;
      } else if (OperatorClass.#ghosted) {
        OperatorClass.#ghosted = false;
      } else {
        // do nothing
      }
      OperatorClass.#connectionDrops = 0;
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async doHealthCheck - catch - error' });
    }
  }

  static async findMaster() {
    try {
      OperatorClass.#status = 'INIT';
      OperatorClass.#masterNode = null;
      OperatorClass.#IamMaster = false;
      // get dbappspecs
      if (process.env.APPLICATION_NAME) {
        await OperatorClass.#updateAppInfo();
        // find master candidate
        OperatorClass.#masterCandidates = [];
        OperatorClass.#OpNodes = OperatorClass.#OpNodes.map((opNode) => {
                                                                          const cloneDeepOpNode = lodash.cloneDeep(opNode);
                                                                          if (cloneDeepOpNode.ip === OperatorClass.#myIP) {
                                                                            cloneDeepOpNode.active = true;
                                                                            cloneDeepOpNode.seqNo = BacklogClass.sequenceNumber;
                                                                          } else {
                                                                            // do nothing
                                                                          }

                                                                          return cloneDeepOpNode;
                                                                        })
                                                       .sort((a, b) => {
                                                                         if (a.seqNo < b.seqNo) {
                                                                           return 1;
                                                                         } else if (b.seqNo < a.seqNo) {
                                                                           return -1;
                                                                         } else {
                                                                           return 0;
                                                                         }
                                                                       });
        const masterSeqNo = OperatorClass.#OpNodes[0].seqNo;

        OperatorClass.#OpNodes.forEach((opNode) => {
          if (opNode.active && (opNode.seqNo === masterSeqNo)) {
            if (opNode.upnp) {
              OperatorClass.#masterCandidates.push(opNode.ip);
            } else {
              OperatorClass.#masterCandidates.unshift(opNode.ip);
            }
          } else {
            // do nothing
          }
        });

        // if first candidate is me i'm the master
        if (OperatorClass.#masterCandidates[0] === OperatorClass.#myIP) {
          const MasterIP = OperatorClass.#masterCandidates.length > 1
                               // ask second candidate for confirmation
                             ? await FluxFunction.getMaster(OperatorClass.#masterCandidates[1], process.env.CONTAINER_API_PORT)
                             : OperatorClass.#myIP;

          if (MasterIP === OperatorClass.#myIP) {
            OperatorClass.#IamMaster = true;
            OperatorClass.#masterNode = OperatorClass.#myIP;
            OperatorClass.#status = 'OK';
          } else if (DataCheckerFunction.isUndefOrNull(MasterIP)) {
            return OperatorClass.findMaster();
          } else {
            OperatorClass.#masterNode = MasterIP;
          }
        } else {
          // ask first candidate who the master is
          const MasterIP = await FluxFunction.getMaster(OperatorClass.#masterCandidates[0], process.env.CONTAINER_API_PORT);
          if (DataCheckerFunction.isUndefOrNull(MasterIP)) {
            return OperatorClass.findMaster();
          } else {
            // do nothing
          }

          if (MasterIP === OperatorClass.#myIP) {
            OperatorClass.#IamMaster = true;
            OperatorClass.#masterNode = OperatorClass.#myIP;
            OperatorClass.#status = 'OK';
            BacklogClass.pushKey('masterIP', OperatorClass.#masterNode, false);
            return OperatorClass.#masterNode;
          } else {
            // do nothing
          }

          const MasterIP2 = await FluxFunction.getMaster(MasterIP, process.env.CONTAINER_API_PORT);
          if (MasterIP2 === MasterIP) {
            OperatorClass.#masterNode = MasterIP;
          } else {
            return OperatorClass.findMaster();
          }
        }
        BacklogClass.pushKey('masterIP', OperatorClass.#masterNode, false);

        return OperatorClass.#masterNode;
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async findMaster - catch - error' });
      return OperatorClass.findMaster();
    }

    return null;
  }

  static async init() {
    try {
      if (await OperatorClass.#initDBClient()) {
        await BacklogClass.createBacklog();
        await OperatorClass.#dbClient.createDB(process.env.DB_NAME);
        BacklogClass.userDBClient = OperatorClass.#dbClient;
        await BacklogClass.userDBClient.setDBName(process.env.DB_NAME);
        await ConnectionPoolClass.init({ numberOfConnections: 10, maxConnections: 100 });
        OperatorClass.#initInBoundConnections();
        OperatorClass.#dbConnStatus = 'CONNECTED';
        // TODO: RESET DB PASS
      } else {
        OperatorClass.#dbConnStatus = 'CONNECTION_ERROR';
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async initLocalDB - catch - error' });
    }
  }

  static #cloneDeepListItem(listItem) {
    const cloneDeepListItem = lodash.cloneDeep(listItem.ip);
    cloneDeepListItem.ip = cloneDeepListItem.ip.includes(':')
                             ? cloneDeepListItem.ip.split(':')[0]
                             : cloneDeepListItem.ip;

    return cloneDeepListItem;
  }

  static #setupMasterWS() {
    try {
      OperatorClass.#masterWSConn = FluxFunction.getMasterWS(OperatorClass.#masterNode);

      OperatorClass.#masterWSConn.on('connect',
                                     async () => {
                                                   const engine = OperatorClass.#masterWSConn.io.engine;
                                                   try {
                                                     const keys = await FluxFunction.shareKeys(SecurityClass.publicKey, OperatorClass.#masterWSConn);
                                                     SecurityClass.setCommKeys(SecurityClass.privateDecrypt(keys.commAESKey), SecurityClass.privateDecrypt(keys.commAESIV));
                                                     if (OperatorClass.#dbConnStatus === 'CONNECTION_ERROR'
                                                         && DataCheckerFunction.notUndefOrNull(keys.key)) {
                                                       const myKeys = SecurityClass.privateDecrypt(keys.key).split(':');
                                                       SecurityClass.setIV(myKeys[1]);
                                                       await OperatorClass.init();
                                                     } else {
                                                       await FluxFunction.updateKey(SecurityClass.encryptComm(`N${OperatorClass.#myIP}`), SecurityClass.encryptComm(`${SecurityClass.getKey()}:${SecurityClass.getIV()}`), OperatorClass.#masterWSConn);
                                                     }
                                                   } catch (error) {
                                                     Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static initMasterConnection - try - catch - error' });
                                                   }

                                                   OperatorClass.#syncLocalDB();

                                                   engine.once('upgrade', () => {
                                                                                  Logger.apiLogger.info(`transport protocol: ${engine.transport.name}`); // in most cases, prints "websocket"
                                                                                });
                                                 });

      OperatorClass.#masterWSConn.on('connect_error',
                                     async (reason) => {
                                                         Logger.apiLogger.error(`>> ${reason}`, { label: 'operator.class - OperatorClass - static #setupMasterWS - try - #masterWSConn.on - connect_error' });
                                                         OperatorClass.#masterWSConn.removeAllListeners();
                                                         await OperatorClass.findMaster();
                                                         OperatorClass.initMasterConnection();
                                                       });

      OperatorClass.#masterWSConn.on('disconnect',
                                     async () => {
                                                   OperatorClass.#connectionDrops++;
                                                   OperatorClass.#masterWSConn.removeAllListeners();
                                                   await OperatorClass.findMaster();
                                                   OperatorClass.initMasterConnection();
                                                 });

      OperatorClass.#masterWSConn.on('query',
                                     async (query, sequenceNumber, timestamp, connId) => {
                                                                                           if (OperatorClass.#status === 'OK') {
                                                                                             // if it's the next sequnce number in line push it to the BacklogClass, else put it in buffer
                                                                                             if (sequenceNumber === (BacklogClass.sequenceNumber + 1)) {
                                                                                               BacklogClass.pushQuery(query, sequenceNumber, timestamp, false, connId);
                                                                                               // push queries from buffer until there is a gap or the buffer is empty
                                                                                               while (DataCheckerFunction.notUndefOrNull(OperatorClass.#buffer[BacklogClass.sequenceNumber + 1])) {
                                                                                                 const nextQuery = OperatorClass.#buffer[BacklogClass.sequenceNumber + 1];
                                                                                                 if (DataCheckerFunction.notUndefOrNull(nextQuery)) {
                                                                                                   BacklogClass.pushQuery(nextQuery.query, nextQuery.sequenceNumber, nextQuery.timestamp, false, nextQuery.connId);
                                                                                                   OperatorClass.#buffer[nextQuery.sequenceNumber] = undefined;
                                                                                                 } else {
                                                                                                   // do nothing
                                                                                                 }
                                                                                               }

                                                                                               if (OperatorClass.#lastBufferSeqNo > (BacklogClass.sequenceNumber + 1)) {
                                                                                                 let i = 1;
                                                                                                 while ((DataCheckerFunction.isUndefOrNull(OperatorClass.#buffer[BacklogClass.sequenceNumber + 1])) && (i < 5)) {
                                                                                                   if (memoryCache.get(BacklogClass.sequenceNumber + i) !== true) {
                                                                                                     memoryCache.put(BacklogClass.sequenceNumber + i, true, 10000);
                                                                                                     // eslint-disable-next-line no-await-in-loop
                                                                                                     await FluxFunction.askQuery(BacklogClass.sequenceNumber + i, OperatorClass.#masterWSConn);
                                                                                                   } else {
                                                                                                     // do nothing
                                                                                                   }
                                                                                                   i++;
                                                                                                 }
                                                                                               } else {
                                                                                                 // do nothing
                                                                                               }
                                                                                             } else if (sequenceNumber > (BacklogClass.sequenceNumber + 1)) {
                                                                                               if (DataCheckerFunction.isUndefOrNull(OperatorClass.#buffer[sequenceNumber])) {
                                                                                                 OperatorClass.#buffer[sequenceNumber] = {
                                                                                                                                           query,
                                                                                                                                           sequenceNumber,
                                                                                                                                           timestamp,
                                                                                                                                           connId
                                                                                                                                         };
                                                                                                 OperatorClass.#lastBufferSeqNo = sequenceNumber;
                                                                                                 if (DataCheckerFunction.isUndefOrNull(OperatorClass.#buffer[BacklogClass.sequenceNumber + 1]) && memoryCache.get(BacklogClass.sequenceNumber + 1) !== true) {
                                                                                                   let i = 1;
                                                                                                   while ((DataCheckerFunction.isUndefOrNull(OperatorClass.#buffer[BacklogClass.sequenceNumber + 1])) && (i < 5)) {
                                                                                                     if (memoryCache.get(BacklogClass.sequenceNumber + i) !== true) {
                                                                                                       memoryCache.put(BacklogClass.sequenceNumber + i, true, 10000);
                                                                                                       // eslint-disable-next-line no-await-in-loop
                                                                                                       await FluxFunction.askQuery(BacklogClass.sequenceNumber + i, OperatorClass.#masterWSConn);
                                                                                                     } else {
                                                                                                       // do nothing
                                                                                                     }
                                                                                                     i++;
                                                                                                   }
                                                                                                 } else {
                                                                                                   // do nothing
                                                                                                 }
                                                                                               } else {
                                                                                                 // do nothing
                                                                                               }
                                                                                             }
                                                                                           } else if (OperatorClass.#status === 'SYNC') {
                                                                                             BacklogClass.pushQuery(query, sequenceNumber, timestamp, true, connId);
                                                                                           } else {
                                                                                             Logger.apiLogger.info(`omitted query status: ${OperatorClass.#status}`);
                                                                                           }
                                                                                         });

      OperatorClass.#masterWSConn.on('updateKey',
                                     async (key, value) => {
                                                             const decKey = SecurityClass.decryptComm(key);
                                                             await BacklogClass.pushKey(decKey, value);
                                                             OperatorClass.#keys[decKey] = value;
                                                           });

      OperatorClass.#masterWSConn.on('userSession',
                                     (op, key, value) => {
                                                           if (op === 'add') {
                                                             IdServiceClass.addNewSession(key, value);
                                                           } else {
                                                             IdServiceClass.removeSession(key);
                                                           }
                                                         });

      OperatorClass.#masterWSConn.on('rollBack',
                                     async (seqNo) => {
                                                        if (OperatorClass.#status === 'SYNC') {
                                                          OperatorClass.#status = 'ROLLBACK';
                                                          await BacklogClass.rebuildDatabase(seqNo);
                                                          OperatorClass.#syncLocalDB();
                                                        } else {
                                                          const tempStatus = OperatorClass.#status;
                                                          OperatorClass.#status = 'ROLLBACK';
                                                          await BacklogClass.rebuildDatabase(seqNo);
                                                          OperatorClass.#status = tempStatus;
                                                        }
                                                      });
    } catch (error) {
      OperatorClass.#masterWSConn.removeAllListeners();
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static initMasterConnection - catch - error' });
    }
  }

  static #initInBoundConnections() {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL':
          net.createServer((netSocket) => {
                                            MySQLServerClass.createServer({
                                                                            socket: netSocket,
                                                                            onAuthorize: OperatorClass.handleAuthorize,
                                                                            onCommand: OperatorClass.handleCommand,
                                                                            operator: this
                                                                          });
                                          })
             .listen(process.env.DB_EXTERNAL_PORT);

          Logger.apiLogger.info(`Started ${process.env.DB_TYPE} server on port ${process.env.DB_EXTERNAL_PORT}`);
          break;
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static initInBoundConnections - catch - error' });
    }
  }

  static async #initDBClient() {
    // wait for local db to boot up
    OperatorClass.#dbClient = await DBClientClass.createDBClient();

    while (DataCheckerFunction.isUndefOrNull(OperatorClass.#dbClient)) {
      Logger.apiLogger.info('Waiting for local DB to boot up...');
      // eslint-disable-next-line no-await-in-loop
      await timer.setTimeout(2000);
    }

    Logger.apiLogger.info('Connected to local DB.');

    return true;
  }

  static async #syncLocalDB() {
    if (OperatorClass.#masterWSConn && OperatorClass.#masterWSConn.connected) {
      OperatorClass.#status = 'SYNC';
      try {
        const response = await FluxFunction.getKeys(OperatorClass.#masterWSConn);
        const keys = JSON.parse(SecurityClass.decryptComm(Buffer.from(response.keys, 'hex')));
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const key in keys) {
          // eslint-disable-next-line no-await-in-loop
          await BacklogClass.pushKey(key, keys[key]);
          OperatorClass.keys[key] = keys[key];
        }
      } catch (error) {
        Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async #syncLocalDB - catch - error' });
      }

      let masterSequenceNumber = BacklogClass.sequenceNumber + 1;
      let copyBuffer = false;
      while ((BacklogClass.sequenceNumber < masterSequenceNumber) && !copyBuffer) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const response = await FluxFunction.getBackLog(BacklogClass.sequenceNumber + 1, OperatorClass.#masterWSConn);
          masterSequenceNumber = response.sequenceNumber;
          BacklogClass.executeLogs = false;
          // eslint-disable-next-line no-restricted-syntax
          for (const record of response.records) {
            if (OperatorClass.#status !== 'SYNC') {
              Logger.apiLogger.warn('Sync proccess halted.', 'red');
              return;
            } else {
              BacklogClass.pushQuery(record.query, record.seq, record.timestamp);
            }
          }
          copyBuffer = (BacklogClass.bufferStartSequenceNumber > 0)
                       && (BacklogClass.bufferStartSequenceNumber <= BacklogClass.sequenceNumber);
          BacklogClass.executeLogs = true;
          const percent = masterSequenceNumber === 0
                            ? 0
                            : Math.round(((BacklogClass.sequenceNumber + response.records.length) / masterSequenceNumber) * 1000);
          Logger.apiLogger.info(`sync backlog from ${BacklogClass.sequenceNumber} to ${BacklogClass.sequenceNumber + response.records.length} - [${'='.repeat(Math.floor(percent / 50))}>${'-'.repeat(Math.floor((1000 - percent) / 50))}] %${percent / 10}`, 'cyan');
        } catch (error) {
          Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async #syncLocalDB - while - catch - error' });
        }
      }

      if (copyBuffer) {
        await BacklogClass.moveBufferToBacklog();
      } else {
        // do nothing
      }

      OperatorClass.#status = 'OK';
    } else {
      // do nothing
    }
  }

  static async #updateAppInfo() {
    try {
      const Specifications = FluxFunction.getApplicationSpecs(process.env.APPLICATION_NAME);
      OperatorClass.#nodeInstances = Specifications.instances;
      // wait for all nodes to spawn
      let ipList = FluxFunction.getApplicationIP(process.env.APPLICATION_NAME);
      const prevMasterIP = BacklogClass.getKey('masterIP', false);
      if (DataCheckerFunction.notUndefOrNull(prevMasterIP)) {
        if (ipList.some((listItem) => listItem.ip.includes(prevMasterIP))) {
          Logger.apiLogger.info('previous master is in the node list. continue...');
        } else {
          while (ipList.length < (OperatorClass.#nodeInstances / 2)) {
            // eslint-disable-next-line no-await-in-loop
            await timer.setTimeout(10000);
            ipList = FluxFunction.getApplicationIP(process.env.APPLICATION_NAME);
          }
        }
      } else {
        while (ipList.length < (OperatorClass.#nodeInstances / 2)) {
          // eslint-disable-next-line no-await-in-loop
          await timer.setTimeout(10000);
          ipList = FluxFunction.getApplicationIP(process.env.APPLICATION_NAME);
        }
      }

      let activeNodes = 1;
      OperatorClass.#OpNodes = ipList.map(async (listItem) => {
                                                                const cloneDeepListItem = OperatorClass.#cloneDeepListItem(listItem);
                                                                // extract ip from upnp nodes
                                                                const upnp = cloneDeepListItem.ip.includes(':');
                                                                // extract ip from upnp nodes
                                                                const status = await FluxFunction.getStatus(cloneDeepListItem.ip, process.env.CONTAINER_API_PORT);

                                                                const returnValue = {
                                                                  ip: cloneDeepListItem.ip,
                                                                  active: DataCheckerFunction.notUndefOrNull(status),
                                                                  seqNo: DataCheckerFunction.notUndefOrNull(status) ? status.sequenceNumber : 0,
                                                                  upnp
                                                                };

                                                                if (DataCheckerFunction.notUndefOrNull(status)) {
                                                                  activeNodes++;
                                                                  OperatorClass.#myIP = status.remoteIP;
                                                                } else {
                                                                  // do nothing
                                                                }

                                                                return returnValue;
                                                              });

      const appIPList = process.env.APPLICATION_NAME === process.env.CLIENT_APPLICATION_NAME
                          ? ipList
                          : FluxFunction.getApplicationIP(process.env.CLIENT_APPLICATION_NAME);

      OperatorClass.#AppNodes = appIPList.map((listItem) => {
        const cloneDeepListItem = OperatorClass.#cloneDeepListItem(listItem);

        return cloneDeepListItem.ip;
      });

      const activeNodePer = 100 * (activeNodes / ipList.length);
      if (DataCheckerFunction.notUndefOrNull(OperatorClass.#myIP) && activeNodePer >= 50) {
        Logger.apiLogger.info(`My ip is ${OperatorClass.#myIP}`);
      } else {
        Logger.apiLogger.info('Not enough active nodes, retriying again...');
        await timer.setTimeout(15000);
        await OperatorClass.#updateAppInfo();
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'operator.class - OperatorClass - static async #updateAppInfo - catch - error' });
    }
  }
}

module.exports = OperatorClass;
