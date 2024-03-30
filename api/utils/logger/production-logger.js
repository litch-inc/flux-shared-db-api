'use strict';

require('winston-daily-rotate-file');

const {
  createLogger,
  format,
  transports
} = require('winston');

const {
  combine,
  timestamp,
  printf
} = format;

const productionFormat = printf(({
                                   level,
                                   message,
                                   label,
                                   // eslint-disable-next-line no-shadow
                                   timestamp
                                 }) => `${timestamp} [${label}] ${level}: ${message}`);

// API
const productionFileRotate = new transports.DailyRotateFile({
  filename: './logs/combined/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true
});
const productionFileRotateError = new transports.DailyRotateFile({
  level: 'error',
  filename: './logs/error/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true
});
const productionFileRotateExceptions = new transports.DailyRotateFile({
  filename: './logs/combined-exceptions/combined-exceptions-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true,
  handleExceptions: true
});
const productionFileRotateRejections = new transports.DailyRotateFile({
  filename: './logs/combined-rejections/combined-rejections-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true,
  handleRejections: true
});

const productionLogger = () => createLogger({
                                              exitOnError: false,
                                              level: 'warn',
                                              format: combine(timestamp(), productionFormat),
                                              transports: [
                                                productionFileRotate,
                                                productionFileRotateError
                                              ],
                                              exceptionHandlers: [
                                                productionFileRotateExceptions
                                              ],
                                              rejectionHandlers: [
                                                productionFileRotateRejections
                                              ]
                                            });

module.exports = {
  productionLogger
};
