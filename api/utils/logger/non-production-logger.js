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
  printf,
  colorize
} = format;

const nonProductionFormat = printf(({
                                      level,
                                      message,
                                      label,
                                      // eslint-disable-next-line no-shadow
                                      timestamp
                                    }) => `${timestamp} [${label}] ${level}: ${message}`);

// API
const nonProductionFileRotate = new transports.DailyRotateFile({
  filename: './logs/combined/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true,
  colorize: colorize()
});
const nonProductionFileRotateExceptions = new transports.DailyRotateFile({
  filename: './logs/combined-exceptions/combined-exceptions-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true,
  colorize: colorize(),
  handleExceptions: true
});
const nonProductionFileRotateRejections = new transports.DailyRotateFile({
  filename: './logs/combined-rejections/combined-rejections-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  utc: true,
  colorize: colorize(),
  handleRejections: true
});

const nonProductionLogger = () => createLogger({
                                                 exitOnError: false,
                                                 level: 'debug',
                                                 format: combine(timestamp(), nonProductionFormat),
                                                 transports: [
                                                   new transports.Console({
                                                     format: combine(colorize({ all: true }))
                                                   }),
                                                   nonProductionFileRotate
                                                 ],
                                                 exceptionHandlers: [
                                                   nonProductionFileRotateExceptions
                                                 ],
                                                 rejectionHandlers: [
                                                   nonProductionFileRotateRejections
                                                 ]
                                               });

module.exports = {
  nonProductionLogger
};
