'use strict';

const { validationResult } = require('express-validator');

const Logger = require('../utils/logger');

/**
 * Used for checking if express validator has found errors
 *
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
const validationResultCheck = (request, response, next) => {
  try {
    const errors = validationResult(request);

    // if there is error then return Error
    if (!errors.isEmpty()) {
      response.status(400).json({ validationErrors: errors.array() });
    } else {
      next();
    }
  } catch (error) {
    Logger.apiLogger.error(`>> Unable to process validation errors: ${error}`, { label: 'validation-result-check.middleware - validationResultCheck' });
    response.status(500).send({ message: 'Unable to process validation results.' });
  }
};

module.exports = {
  validationResultCheck
};
