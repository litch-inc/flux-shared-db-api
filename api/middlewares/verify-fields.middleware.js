'use strict';

const { body } = require('express-validator');

const {
  ALPHA_NUMERIC_REGEX,
  FIELD_ERROR_MESSAGE_BY_LOCALE,
  FILENAME_REGEX,
  NUMERIC_ONLY_REGEX,
  LOGINPHRASE_MAX_HOURS
} = require('../constants/validation.constant');

/**
 * Used for verifiying that filename passed as a body field is valid and meets proper filename structure
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const bodyFilename = body('filename')
                       .notEmpty().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.filename.notEmpty['en-US'])
                       // eslint-disable-next-line newline-per-chained-call
                       .isString().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.filename.isString['en-US'])
                       // eslint-disable-next-line newline-per-chained-call
                       .matches(FILENAME_REGEX['en-US']).withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.filename.matches['en-US'])
                       .escape();

/**
 * Used for verifiying that loginPhrase passed as a body field is valid and meets criteria
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const bodyLoginPhrase = body('loginPhrase')
                          .notEmpty().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.loginPhrase.notEmpty['en-US'])
                          // eslint-disable-next-line newline-per-chained-call
                          .isString().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.loginPhrase.isString['en-US'])
                          // eslint-disable-next-line newline-per-chained-call
                          .isLength({ min: 40, max: 70 }).withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.username.isLength['en-US'])
                          // eslint-disable-next-line newline-per-chained-call
                          .matches(ALPHA_NUMERIC_REGEX['en-US']).withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.loginPhrase.matches['en-US'])
                          .custom((value) => {
                            const timestamp = new Date().getTime();

                            if ((Number(value.substring(0, 13)) < (timestamp - LOGINPHRASE_MAX_HOURS))
                                || (Number(value.substring(0, 13)) > timestamp)) {
                              throw Error(FIELD_ERROR_MESSAGE_BY_LOCALE.loginPhrase.custom['en-US']);
                            } else {
                              // Indicates the success of this synchronous custom validator
                              return true;
                            }
                          });

/**
 * Used for verifiying a url query seqNo
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const bodySeqNo = body('seqNo')
                    .notEmpty().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.seqNo.notEmpty['en-US'])
                    // eslint-disable-next-line newline-per-chained-call
                    .isString().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.seqNo.isString['en-US'])
                    // eslint-disable-next-line newline-per-chained-call
                    .matches(NUMERIC_ONLY_REGEX['en-US']).withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.seqNo.numericOnly['en-US'])
                    .escape();

/**
 * Used for verifiying that signature passed as a body field is valid and meets criteria
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const bodySignature = body('signature')
                        .notEmpty().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.signature.notEmpty['en-US'])
                        // eslint-disable-next-line newline-per-chained-call
                        .isString().withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.signature.isString['en-US'])
                        // eslint-disable-next-line newline-per-chained-call
                        .matches(ALPHA_NUMERIC_REGEX['en-US']).withMessage(FIELD_ERROR_MESSAGE_BY_LOCALE.signature.matches['en-US']);

module.exports = {
  bodyFilename,
  bodyLoginPhrase,
  bodySeqNo,
  bodySignature
};
