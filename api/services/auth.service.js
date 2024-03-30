'use strict';

const IdServiceClass = require('../classes/id-service.class');
const OperatorClass = require('../classes/operator.class');
const DataCheckerFunction = require('../functions/data-checker.function');
const UtilityFunction = require('../functions/utility.function');
const Logger = require('../utils/logger');

exports.login = async (request, response) => {
  try {
    if (IdServiceClass.verifyLogin(request.body.loginPhrase, request.body.signature)) {
      const remoteIp = DataCheckerFunction.notUndefOrNull(request.ip)
                         ? UtilityFunction.convertIP(request.ip)
                         : request.socket.address().address;

      IdServiceClass.addNewSession(request.body.loginPhrase, remoteIp);
      OperatorClass.emitUserSession('add', request.body.loginPhrase, remoteIp);

      response.cookie('loginphrase', request.body.loginPhrase);
      response.status(200).send({ message: 'Success' });
    } else {
      response.status(400).send({ message: 'Signature is invalid' });
    }
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'auth.service - logout - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }

  // request.on('data', (data) => {
  //   request.body += data;
  // });

  // request.on('end', async () => {
  //   try {
  //     const processedBody = UtilityFunction.ensureObject(request.body);
  //     const signature = processedBody.signature;
  //     const loginPhrase = processedBody.loginPhrase;
  //     if (IdServiceClass.verifyLogin(loginPhrase, signature)) {
  //       let remoteIp = UtilityFunction.convertIP(request.ip);
  //       if (DataCheckerFunction.isUndefOrNull(remoteIp)) {
  //         remoteIp = request.socket.address().address;
  //       }
  //       IdServiceClass.addNewSession(loginPhrase, remoteIp);
  //       OperatorClass.emitUserSession('add', loginPhrase, remoteIp);
  //       response.cookie('loginphrase', message);
  //       response.send({ message: 'Success' });
  //     } else {
  //       response.send('SIGNATURE NOT VALID');
  //     }
  //   } catch (error) {
  //     Logger.apiLogger.error(error);
  //     response.send('Error');
  //   }
  // });
};

exports.logout = (request, response) => {
  try {
    IdServiceClass.removeSession(request.cookies.loginphrase);
    OperatorClass.emitUserSession('remove', request.cookies.loginphrase, '');

    response.status(200).send({ message: 'Success' });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'auth.service - logout - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.getLoginPhrase = async (request, response) => {
  try {
    const newLoginPhrase = IdServiceClass.generateLoginPhrase();

    response.status(200).send(newLoginPhrase);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'auth.service - getLoginPhrase - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.loggedInCheck = (request, response) => {
  try {
    response.cookie('loginphrase', request.headers.loginphrase);

    response.status(200).send({ message: 'Success' });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'auth.service - getLoginPhrase - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};
