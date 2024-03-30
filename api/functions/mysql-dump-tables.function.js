'use strict';

const Logger = require('../utils/logger');

/**
 * Used for retrieving db tables for dump
 *
 * @param {*} connection
 * @param {*} dbName
 * @param {*} restrictedTables
 * @param {*} restrictedTablesIsBlacklist
 * @return {Promise}
 */
// eslint-disable-next-line arrow-body-style
const getTables = (connection, dbName, restrictedTables, restrictedTablesIsBlacklist) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        // list the tables
        const showTablesKey = `Tables_in_${dbName}`;
        const tablesRes = await connection.query(`SHOW FULL TABLES FROM \`${dbName}\``);
        const actualTables = tablesRes.map((r) => ({
                                                     name: r[showTablesKey].replace(/'/g, ''),
                                                     schema: null,
                                                     data: null,
                                                     isView: r.Table_type === 'VIEW',
                                                     columns: {},
                                                     columnsOrdered: [],
                                                     triggers: []
                                                   }));
        let tables = actualTables;
        if (restrictedTables.length > 0) {
          if (restrictedTablesIsBlacklist) {
            // exclude the tables from the options that actually exist in the db
            tables = tables.filter((t) => restrictedTables.indexOf(t.name) === -1);
          } else {
            // only include the tables from the options that actually exist in the db
            // keeping the order of the passed-in whitelist and filtering out non-existing tables
            tables = restrictedTables.map((tableName) => actualTables.find((t) => t.name === tableName))
                                     .filter((t) => t !== undefined);
          }
        } else {
          // do nothing
        }
        // get the column definitions
        const columnsMultiQuery = tables.map((t) => `SHOW COLUMNS FROM \`${t.name}\` FROM \`${dbName}\`;`)
                                        .join('\n');
        const columns = await connection.multiQuery(columnsMultiQuery);
        columns.forEach((cols, i) => {
                                       tables[i].columns = cols.reduce((acc, c) => {
                                                                                     acc[c.Field] = {
                                                                                       type: c.Type
                                                                                              // split to remove things like 'unsigned' from the string
                                                                                              .split(' ')[0]
                                                                                              // split to remove the lengths
                                                                                              .split('(')[0]
                                                                                              .toLowerCase(),
                                                                                       nullable: c.Null === 'YES'
                                                                                     };
                                                                                     return acc;
                                                                                   }, {});
                                       tables[i].columnsOrdered = cols.map((c) => c.Field);
                                     });
        resolve(tables);
      })();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-tables.function - getTables - Promise - catch - error' });
      reject(error);
    }
  });
};

module.exports = {
  getTables
};
