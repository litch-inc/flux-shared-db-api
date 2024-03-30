'use strict';

const bcrypt = require('bcryptjs');

const Logger = require('../utils/logger');

/**
 * Used for verifiying that log request from app contains hash key
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const hashChecker = async (request, response, next) => {
  const clientApiHash = bcrypt.compareSync(request.get('x-custom-header'), process.env.API_KEY);

  if (!clientApiHash) {
    Logger.apiLogger.warn('>> Someone trying to send log without proper client key', { label: 'log-api-verify.middleware - hashChecker' });
    response.status(401).json({ message: 'Invalid route headers' });
  } else {
    next();
  }
};

module.exports = {
  hashChecker
};
