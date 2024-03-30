'use strict';

const { param } = require('express-validator');

const { FILENAME_REGEX, PARAMS_ERROR_MESSAGE_BY_LOCALE } = require('../constants/validation.constant');

/**
 * Used for verifiying that filename passed as a param is valid and meets proper filename structure
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const paramFilename = param('filename')
                        .notEmpty().withMessage(PARAMS_ERROR_MESSAGE_BY_LOCALE.filename.notEmpty['en-US'])
                        // eslint-disable-next-line newline-per-chained-call
                        .isString().withMessage(PARAMS_ERROR_MESSAGE_BY_LOCALE.filename.isString['en-US'])
                        // eslint-disable-next-line newline-per-chained-call
                        .matches(FILENAME_REGEX['en-US']).withMessage(PARAMS_ERROR_MESSAGE_BY_LOCALE.filename.matches['en-US'])
                        .escape();

module.exports = {
  paramFilename
};
