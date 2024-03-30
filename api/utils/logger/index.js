'use strict';

const { productionLogger } = require('./production-logger');
const { nonProductionLogger } = require('./non-production-logger');
const { applicationLogger } = require('./app-logger');

const apiLogger = (process.env.DEBUG_MODE === false) ? productionLogger() : nonProductionLogger();
const appLogger = applicationLogger();

module.exports = {
  apiLogger,
  appLogger
};
