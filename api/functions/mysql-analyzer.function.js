'use strict';

const lodash = require('lodash');

/**
 * Analyzes a single query and returns r or w for query type
 *
 * @param {string} sql
 * @return {string}
 */
const getQueryType = (sql) => {
  // default write query
  let returnFlag = 'w';
  const readFlags = ['select', 'show', 'describe', 'set names', 'kill', 'set profiling', '`wp_options`', '_transient_'];

  readFlags.forEach((flag) => {
    returnFlag = sql.toLowerCase().startsWith(flag)
                 || sql.includes(flag)
                   ? 'r'
                   : returnFlag;
  });

  if ((returnFlag === 'w')
      && sql.toLowerCase().startsWith('set session')) {
    returnFlag = 's';
  } else {
    // do nothing
  }

  return returnFlag;
};

/**
 * Used for removing the first line
 *
 * @param {string} str
 * @return {string}
 */
const removeFirstLine = (str) => {
  const lines = str.split('\n');
  lines.splice(0, 1);

  return lines.join('\n');
};

/**
 * [c]
 * @param {string} sql sql query
 */
/**
 * Clean up linebreaks
 *
 * @param {string} sql
 * @return {string}
 */
const cleanUP = (sql) => {
  let cloneDeepSQL = lodash.cloneDeep(sql);
  if (cloneDeepSQL.startsWith('/*!40101 SET character_set_client = utf8 */')) {
    cloneDeepSQL = '/*!40101 SET character_set_client = utf8mb4 */';
  } else {
    // do nothing
  }

  if (cloneDeepSQL.startsWith('/*!40101 SET NAMES utf8 */')) {
    cloneDeepSQL = '/*!40101 SET NAMES utf8mb4 */';
  } else {
    // do nothing
  }

  if (cloneDeepSQL.startsWith('--')) {
    while (cloneDeepSQL.startsWith('--') || cloneDeepSQL.startsWith('\r\n') || cloneDeepSQL.startsWith('\n')) {
      cloneDeepSQL = removeFirstLine(cloneDeepSQL);
    }
  } else {
    // do nothing
  }

  return cloneDeepSQL;
};

/**
 * Analyzes the sql and marks them as read/write
 *
 * @param {string} sql
 * @param {string} options
 * @return {queries[]}
 *    queries.sql - cleanup sql
 *    queries.type - w, r, s
 */
const analyzeSQL = (sql, options) => {
  // TODO: ASK
  switch (options) {
    case 'mysql':
    case 'mssql':
    case 'postgre': {
      break;
    }
    default: {
      return [];
    }
  }
  const analyzedArray = [];
  const tempSql = cleanUP(sql.trim());
  const queries = { sql: tempSql, type: getQueryType(tempSql) };
  analyzedArray.push([queries]);

  return analyzedArray;
};

module.exports = {
  analyzeSQL
};
