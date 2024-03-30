'use strict';

const IdServiceClass = require('../classes/id-service.class');
const DataCheckerFunction = require('../functions/data-checker.function');
const HeaderFunction = require('../functions/header.function');
const UtilityFunction = require('../functions/utility.function');
const Logger = require('../utils/logger');

const authUser = (request, response, next) => {
  let remoteIp = UtilityFunction.convertIP(request.ip);
  if (DataCheckerFunction.isUndefOrNull(remoteIp)) {
    remoteIp = request.socket.address().address;
  } else {
    // do nothing
  }

  const loginPhraseHeader = HeaderFunction.getHeader(request, 'loginphrase');
  const loginPhraseCookie = request.cookies.loginphrase;

  if (!(DataCheckerFunction.notUndefOrNull(loginPhraseHeader) && IdServiceClass.verifySession(loginPhraseHeader, remoteIp))) {
    Logger.apiLogger.warn('>> Unable to authenticate user', { label: 'verify.middleware - authUser' });
    response.status(404).json({ message: 'Unable to authenticate user!' });
  } else if (!(DataCheckerFunction.notUndefOrNull(loginPhraseCookie) && IdServiceClass.verifySession(loginPhraseCookie, remoteIp))) {
    Logger.apiLogger.warn('>> Unable to authenticate user', { label: 'verify.middleware - authUser' });
    response.status(404).json({ message: 'Unable to authenticate user!' });
  } else {
    // do nothing
  }

  next();
};

module.exports = {
  authUser
};
