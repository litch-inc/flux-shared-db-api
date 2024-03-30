'use strict';

/**
 * Used for returning header key value
 *
 * @param {*} request
 * @param {string} headerKey
 * @return {string | undefined} value
 */
const getHeader = (request, headerKey) => request.get(headerKey);

/**
 * Used for setting a key value into response headers
 *
 * @param {*} response
 * @param {string} headerKey
 * @param {string} value
 */
const setHeader = (response, headerKey, value) => {
  response.setHeader(headerKey, value);
};

module.exports = {
  getHeader,
  setHeader
};
