'use strict';

/**
 * Used for checking object is not null and or undefined
 *
 * @param {*} data
 * @return {boolean}
 */
const notUndefOrNull = (data) => (typeof data !== 'undefined') && (data != null);

/**
 * Used for checking object is null and or undefined
 *
 * @param {*} data
 * @return {boolean}
 */
const isUndefOrNull = (data) => (typeof data === 'undefined') || (data == null);

module.exports = {
  notUndefOrNull,
  isUndefOrNull
};
