'use strict';

const lodash = require('lodash');
const sqlFormatter = require('sql-formatter');

const Logger = require('../utils/logger');

/**
 * Used for returning View in v
 *
 * @param {*} v
 * @return {boolean}
 */
const isCreateView_ = (v) => 'View' in v;

/**
 * Used for retrieving db schema dump
 *
 * @param {*} connection
 * @param {*} options
 * @param {*} tables
 * @return {Promise}
 */
// eslint-disable-next-line arrow-body-style
const getSchemaDump = async (connection, options, tables) => {
  return new Promise((resolve, reject) => {
    try {
      const format = options.format
                       ? (sql) => sqlFormatter.format(sql)
                       : (sql) => sql;

      // we create a multi query here so we can query all at once rather than in individual connections
      const getSchemaMultiQuery = tables.map((table) => `SHOW CREATE TABLE \`${table.name}\`;`)
                                        .join('\n');

      // mysql2 returns an array of arrays which will all have our one row
      (async () => {
        const createStatements = (await connection.multiQuery(getSchemaMultiQuery)).map((r) => r[0])
                                                                                   .map((res, i) => {
                                                                                     const table = tables[i];
                                                                                     if (isCreateView_(res)) {
                                                                                       return {
                                                                                         ...table,
                                                                                         name: res.View,
                                                                                         schema: format(res['Create View']),
                                                                                         data: null,
                                                                                         isView: true
                                                                                       };
                                                                                     } else {
                                                                                       return {
                                                                                         ...table,
                                                                                         name: res.Table,
                                                                                         schema: format(res['Create Table']),
                                                                                         data: null,
                                                                                         isView: false
                                                                                       };
                                                                                     }
                                                                                   })
                                                                                   .map((s) => {
                                                                                     const cloneDeepS = lodash.cloneDeep(s);
                                                                                     // clean up the generated SQL as per the options

                                                                                     if (!options.autoIncrement) {
                                                                                       cloneDeepS.schema = cloneDeepS.schema.replace(/AUTO_INCREMENT\s*=\s*\d+ /g, '');
                                                                                     } else {
                                                                                       // do nothing
                                                                                     }
                                                                                     if (!options.engine) {
                                                                                       cloneDeepS.schema = cloneDeepS.schema.replace(/ENGINE\s*=\s*\w+ /, '');
                                                                                     } else {
                                                                                       // do nothing
                                                                                     }
                                                                                     if (cloneDeepS.isView) {
                                                                                       if (options.view.createOrReplace) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/^CREATE/, 'CREATE OR REPLACE');
                                                                                       } else {
                                                                                         // do nothing
                                                                                       }
                                                                                       if (!options.view.algorithm) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/^CREATE( OR REPLACE)? ALGORITHM[ ]?=[ ]?\w+/, 'CREATE$1');
                                                                                       } else {
                                                                                         // do nothing
                                                                                       }
                                                                                       if (!options.view.definer) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/^CREATE( OR REPLACE)?( ALGORITHM[ ]?=[ ]?\w+)? DEFINER[ ]?=[ ]?.+?@.+?( )/, 'CREATE$1$2$3');
                                                                                       } else {
                                                                                         // do nothing
                                                                                       }
                                                                                       if (!options.view.sqlSecurity) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/^CREATE( OR REPLACE)?( ALGORITHM[ ]?=[ ]?\w+)?( DEFINER[ ]?=[ ]?.+?@.+)? SQL SECURITY (?:DEFINER|INVOKER)/, 'CREATE$1$2$3');
                                                                                       } else {
                                                                                         // do nothing
                                                                                       }
                                                                                     } else {
                                                                                       if (options.table.dropIfExist) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/^CREATE TABLE/, `DROP TABLE IF EXISTS \`${cloneDeepS.name}\`;\nCREATE TABLE`);
                                                                                       } else if (options.table.ifNotExist) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/^CREATE TABLE/, 'CREATE TABLE IF NOT EXISTS');
                                                                                       } else {
                                                                                         // do nothing
                                                                                       }
                                                                                       if (options.table.charset === false) {
                                                                                         cloneDeepS.schema = cloneDeepS.schema.replace(/( )?(DEFAULT )?(CHARSET|CHARACTER SET) = \w+/, '');
                                                                                       } else {
                                                                                         // do nothing
                                                                                       }
                                                                                     }

                                                                                     // fix up binary/hex default values if formatted
                                                                                     if (options.format) {
                                                                                       cloneDeepS.schema = cloneDeepS.schema.replace(/DEFAULT b '(\d+)'/g, "DEFAULT b'$1'")
                                                                                                                            .replace(/DEFAULT X '(\d+)'/g, "DEFAULT X'$1'")
                                                                                                                            // fix up set defs which get split over two lines and then cause next lines to be extra indented
                                                                                                                            .replace(/\n {2}set/g, ' set')
                                                                                                                            .replace(/ {4}/g, '  ');
                                                                                     } else {
                                                                                       // do nothing
                                                                                     }

                                                                                     // add a semicolon to separate schemas
                                                                                     cloneDeepS.schema += ';';

                                                                                     // pad the sql with a header
                                                                                     cloneDeepS.schema = [
                                                                                       '',
                                                                                       cloneDeepS.schema,
                                                                                       ''
                                                                                     ].join('\n');

                                                                                     return cloneDeepS;
                                                                                   })
                                                                                   .sort((a, b) => {
                                                                                                     // sort the views to be last
                                                                                                     if (a.isView && !b.isView) {
                                                                                                       return 1;
                                                                                                     } else if (!a.isView && b.isView) {
                                                                                                       return -1;
                                                                                                     } else {
                                                                                                       return 0;
                                                                                                     }
                                                                                                   });

        resolve(createStatements);
      })();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-schema.function - getSchemaDump - Promise - catch - error' });
      reject(error);
    }
  });
};

module.exports = {
  getSchemaDump
};
