'use strict';

const lodash = require('lodash');

/**
 * Used for taking passed ip and splitting the ip at : to
 * generate array of of values and return the last section
 * or returns original ip because : not found
 *
 * @param {*} ip
 * @return {*} cloneDeepIP
 */
const convertIP = (ip) => {
  const cloneDeepIP = lodash.cloneDeep(ip);

  return cloneDeepIP.includes(':')
           ? cloneDeepIP.split(':')[3]
           : cloneDeepIP;
};

/**
 * Used for taking html and escaping sql special characters
 * and putting in html safe versions
 *
 * @param {*} text
 * @return {*} cloneDeepText
 */
const htmlEscape = (text) => {
  const cloneDeepText = lodash.escape(text);

  return cloneDeepText.replace(/\n/g, '</br>');
};

/**
 * Used for returning new array of items not exceeding max size limit
 *
 * @param {*} array
 * @param {*} maxSize
 * @return {*} newArray
 */
const trimArrayToSize = (array, maxSize) => {
  let currentSize = 0;

  return array.map((item, index) => {
    const serializedItem = JSON.stringify(item); // Serialize the item to estimate its size in bytes
    const itemSize = new TextEncoder().encode(serializedItem).length;

    if (currentSize + itemSize <= maxSize) {
      currentSize += itemSize;

      return item;
    } else if (index === 0) {
      return item;
    } else {
      // eslint-disable-next-line no-useless-return, consistent-return
      return; // Stop adding items if the size limit is exceeded
    }
  }).filter(Boolean); // removed or filters of falsy values created with the return;
};

/**
 * Used for returing cryptographic safe random number between 0 and 1
 *
 * @return {number}
 */
const cryptographicRandomNumber = () => {
  const uint32Array = new Uint32Array(1);
  const max = 2 ** 32;
  const randomValue = crypto.getRandomValues(uint32Array)[0] / max;

  return randomValue;
};

module.exports = {
  convertIP,
  htmlEscape,
  trimArrayToSize,
  cryptographicRandomNumber
};
