'use strict';

const sqlstring = require('sqlstring');

const MySQLDumpConstant = require('../constants/mysql-dump.constant');
const DataCheckerFunction = require('./data-checker.function');

let OFFSET = null;

/**
 * Used for resolving column type
 *
 * @param {*} columnType
 * @return {string}
 */
const resolveType = (columnType) => {
  if (MySQLDumpConstant.BIT_TYPES.includes(columnType)) {
    return 'BIT';
  } else if (MySQLDumpConstant.GEOMETRY_TYPES.includes(columnType)) {
    return 'GEOMETRY';
  } else if (MySQLDumpConstant.HEX_TYPES.includes(columnType)) {
    return 'HEX';
  } else if (MySQLDumpConstant.NUMBER_TYPES.includes(columnType)) {
    return 'NUMBER';
  } else if (MySQLDumpConstant.STRING_TYPES.includes(columnType)) {
    return 'STRING';
  } else {
    throw Error(`UNKNOWN TYPE "${columnType}"`);
  }
};

/**
 * Used for reading and processing byte order DoubleLE || DoubleBE
 *
 * @param {*} buffer
 * @param {*} byteOrder
 * @return {*}
 */
const readDouble_ = (buffer, byteOrder) => {
  const val = byteOrder
                ? buffer.readDoubleLE(OFFSET)
                : buffer.readDoubleBE(OFFSET);
  OFFSET += 8;

  return val;
};

/**
 * Used for reading and processing byte order UInt32LE || UInt32BE
 *
 * @param {*} buffer
 * @param {*} byteOrder
 * @return {*}
 */
const readUInt32_ = (buffer, byteOrder) => {
  const val = byteOrder
                ? buffer.readUInt32LE(OFFSET)
                : buffer.readUInt32BE(OFFSET);
  OFFSET += 4;

  return val;
};

/**
 * Used for parseing bugger geometry
 *
 * @param {*} buffer
 * @return {*}
 */
const parseGeometry_ = (buffer) => {
  let result = [];
  const byteOrder = buffer.readUInt8(OFFSET);
  OFFSET += 1;
  const wkbType = readUInt32_(byteOrder);
  switch (wkbType) {
    case 1: {
      // WKBPoint - POINT(1 1)
      const x = readDouble_(byteOrder);
      const y = readDouble_(byteOrder);
      result.push(`${x} ${y}`);
      break;
    }
    case 2: {
      // WKBLineString - LINESTRING(0 0,1 1,2 2)
      const numPoints = readUInt32_(byteOrder);
      result = [];
      for (let i = numPoints; i > 0; i -= 1) {
        const x = readDouble_(byteOrder);
        const y = readDouble_(byteOrder);
        result.push(`${x} ${y}`);
      }
      break;
    }
    case 3: {
      // WKBPolygon - POLYGON((0 0,10 0,10 10,0 10,0 0),(5 5,7 5,7 7,5 7, 5 5))
      const numRings = readUInt32_(byteOrder);
      result = [];
      for (let i = numRings; i > 0; i -= 1) {
        const numPoints = readUInt32_(byteOrder);
        const line = [];
        for (let j = numPoints; j > 0; j -= 1) {
          const x = readDouble_(byteOrder);
          const y = readDouble_(byteOrder);
          line.push(`${x} ${y}`);
        }
        result.push(`(${line.join(',')})`);
      }
      break;
    }
    case 4: // WKBMultiPoint
    case 5: // WKBMultiLineString
    case 6: // WKBMultiPolygon
    case 7: {
      // WKBGeometryCollection - GEOMETRYCOLLECTION(POINT(1 1),LINESTRING(0 0,1 1,2 2,3 3,4 4))
      const num = readUInt32_(byteOrder);
      result = [];
      for (let i = num; i > 0; i -= 1) {
        let geom = parseGeometry_();
        // remove the function name from the sub geometry declaration from the multi declaration
        // eslint-disable-next-line default-case
        switch (wkbType) {
          case 4: // WKBMultiPoint
            geom = geom.replace(/POINT\((.+)\)/, '$1');
            break;
          case 5: // WKBMultiLineString
            geom = geom.replace('LINESTRING', '');
            break;
          case 6: // WKBMultiPolygon
            geom = geom.replace('POLYGON', '');
            break;
        }
        result.push(geom);
      }
      break;
    } // this case shouldn't happen ever
    default: {
      throw Error(`Unexpected WKBGeometry Type: ${wkbType}`);
    }
  }

  return `${MySQLDumpConstant.GEOMETRY_CONSTRUCTORS[wkbType]}(${result.join(',')})`;
};

/**
 * Used for parsing geometry value
 *
 * @param {*} buffer
 * @return {*}
 */
const parseGeometryValue_ = (buffer) => {
  OFFSET = 4;

  return `GeomFromText('${parseGeometry_(buffer)}')`;
};

/**
 * Used for tranforming integer to bit
 *
 * @param {*} int
 * @return {*}
 */
const intToBit_ = (int) => {
  let bits = int.toString(2);
  while (bits.length < 8) {
    bits = `0${bits}`;
  }

  return bits;
};

/**
 * sql-formatter doesn't support hex/binary literals
 * so we wrap them in this fake function call which gets removed later
 *
 * @param {string} str
 */
const noformatWrap_ = (str) => `NOFORMAT_WRAP("##${str}##")`;

/**
 * Used for typecast table values
 *
 * @param {*} tables
 * @return {string}
 */
const typeCast = (tables) => {
  const tablesByName = tables.reduce((acc, t) => {
                                                   acc.set(t.name, t);

                                                   return acc;
                                                 }, new Map());

  return (field) => {
    const table = tablesByName.get(field.table);
    const columnType = resolveType(table.columns[field.name].type);
    let value = ''; // the else case shouldn't happen ever
    if (columnType === MySQLDumpConstant.COLUMN_TYPE_GEOMETRY) {
      // parse and convert the binary representation to a nice string
      const buf = field.buffer();
      value = DataCheckerFunction.isUndefOrNull(buf)
                ? null
                : parseGeometryValue_(buf);
    } else if (columnType === MySQLDumpConstant.COLUMN_TYPE_STRING) {
      // sanitize the string types
      value = sqlstring.escape(field.string());
    } else if (columnType === MySQLDumpConstant.COLUMN_TYPE_BIT) {
      // bit fields have a binary representation we have to deal with
      const buf = field.buffer();
      if (DataCheckerFunction.isUndefOrNull(buf)) {
        value = null;
      } else {
        // represent a binary literal (b'010101')
        const numBytes = buf.length;
        let bitString = '';
        for (let i = 0; i < numBytes; i++) {
          const int8 = buf.readUInt8(i);
          bitString += intToBit_(int8);
        }
        // truncate the bit string to the field length
        bitString = bitString.substr(-field.length);
        value = noformatWrap_(`b'${bitString}'`);
      }
    } else if (columnType === MySQLDumpConstant.COLUMN_TYPE_HEX) {
      // binary blobs
      const buf = field.buffer();
      if (DataCheckerFunction.isUndefOrNull(buf)) {
        value = null;
      } else {
        // represent a hex literal (X'AF12')
        const numBytes = buf.length;
        let hexString = '';
        for (let i = 0; i < numBytes; i++) {
          const int8 = buf.readUInt8(i);
          const hex = int8.toString(16);
          if (hex.length < 2) {
            hexString += '0';
          } else {
            // do nothing
          }
          hexString += hex;
        }
        value = noformatWrap_(`X'${hexString}'`);
      }
    } else if (columnType === MySQLDumpConstant.COLUMN_TYPE_NUMBER) {
      value = field.string();
    } else {
      throw Error(`Unknown column type detected: ${columnType}`);
    }
    // handle nulls
    if (DataCheckerFunction.isUndefOrNull(value)) {
      value = MySQLDumpConstant.DB_NULL;
    } else {
      // do nothing
    }

    return value;
  };
};

module.exports = {
  typeCast
};
