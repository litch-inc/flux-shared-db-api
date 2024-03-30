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
const productionFileRotate = new transports.DailyRotateFile({
  filename: './logs/combined-app/combined-app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true
});
const productionErrorFileRotate = new transports.DailyRotateFile({
  level: 'error',
  filename: './logs/error-app/error-app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true
});

const applicationLogger = () => createLogger({
                                               exitOnError: false,
                                               level: 'info',
                                               format: combine(timestamp(), productionFormat),
                                               transports: [
                                                 productionFileRotate,
                                                 productionErrorFileRotate
                                               ]
                                             });

module.exports = {
  applicationLogger
};
