'use strict';

const lodash = require('lodash');

const DataCheckerFunction = require('./data-checker.function');

/**
 * Returns the write length for a coded string
 *
 * @param {Buffer} buffer
 * @param {number} pos
 * @param {string} str
 * @return {number}
 */
const writeLengthCodedString = (buffer, pos, str) => {
  let cloneDeepStr = lodash.cloneDeep(str);
  if (DataCheckerFunction.isUndefOrNull(cloneDeepStr)) {
    return buffer.writeUInt8(0, pos);
  } else {
    if (typeof cloneDeepStr !== 'string') {
      // Mangle it
      cloneDeepStr = cloneDeepStr.toString();
    } else {
      // do nothing
    }
    buffer.writeUInt8(253, pos);
    buffer.writeUIntLE(cloneDeepStr.length, pos + 1, 3);
    buffer.write(cloneDeepStr, pos + 4);

    return pos + cloneDeepStr.length + 4;
  }
};

/**
 * Returns the write length for a binary value
 *
 * @param {Buffer} buffer
 * @param {number} pos
 * @param {number} number
 * @return {number}
 */
const writeLengthCodedBinary = (buffer, pos, number) => {
  if (DataCheckerFunction.isUndefOrNull(number)) {
    return buffer.writeUInt8(251, pos);
  } else if (number < 251) {
    return buffer.writeUInt8(number, pos);
  } else if (number < 0x10000) {
    buffer.writeUInt8(252, pos);
    buffer.writeUInt16LE(number, pos + 1);

    return pos + 3;
  } else if (number < 0x1000000) {
    buffer.writeUInt8(253, pos);
    buffer.writeUIntLE(number, pos + 1, 3);

    return pos + 4;
  } else {
    buffer.writeUInt8(254, pos);
    buffer.writeUIntLE(number, pos + 1, 8);

    return pos + 9;
  }
};

module.exports = {
  writeLengthCodedString,
  writeLengthCodedBinary
};
