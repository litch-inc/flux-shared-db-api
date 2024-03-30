'use strict';

const { query } = require('express-validator');

const { NUMERIC_ONLY_REGEX, QUERY_ERROR_MESSAGE_BY_LOCALE } = require('../constants/validation.constant');

/**
 * Used for verifiying a url query logsLength
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const queryLogsLength = query('logsLength')
                          .notEmpty().withMessage(QUERY_ERROR_MESSAGE_BY_LOCALE.logsLength.notEmpty['en-US'])
                          // eslint-disable-next-line newline-per-chained-call
                          .isString().withMessage(QUERY_ERROR_MESSAGE_BY_LOCALE.logsLength.isString['en-US'])
                          // eslint-disable-next-line newline-per-chained-call
                          .matches(NUMERIC_ONLY_REGEX['en-US']).withMessage(QUERY_ERROR_MESSAGE_BY_LOCALE.logsLength.numericOnly['en-US'])
                          .escape();

/**
 * Used for verifiying a url query startTime
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const queryStartTime = query('startTime')
                         .notEmpty().withMessage(QUERY_ERROR_MESSAGE_BY_LOCALE.startTime.notEmpty['en-US'])
                         // eslint-disable-next-line newline-per-chained-call
                         .isString().withMessage(QUERY_ERROR_MESSAGE_BY_LOCALE.startTime.isString['en-US'])
                         // eslint-disable-next-line newline-per-chained-call
                         .matches(NUMERIC_ONLY_REGEX['en-US']).withMessage(QUERY_ERROR_MESSAGE_BY_LOCALE.startTime.numericOnly['en-US'])
                         .escape();

module.exports = {
  queryLogsLength,
  queryStartTime
};
