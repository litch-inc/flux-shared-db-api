'use strict';

const Logger = require('../utils/logger');

/**
 * Used for returning trigger for dump
 *
 * @param {*} connection
 * @param {*} dbName
 * @param {*} options
 * @param {*} tables
 * @return {Promise}
 */
// eslint-disable-next-line arrow-body-style
const getTriggerDump = (connection, dbName, options, tables) => {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line consistent-return
      (async () => {
        const triggers = (await connection.query(`SHOW TRIGGERS FROM \`${dbName}\``))
                           // only include triggers from the tables that we have
                           .filter((trig) => tables.some((t) => t.name === trig.Table))
                           // convert to a trigger name => table index map for easy lookup
                           .reduce((acc, trig) => {
                             tables.some((t, i) => {
                                                     if (t.name === trig.Table) {
                                                       acc.set(trig.Trigger, i);
                                                       return true;
                                                     } else {
                                                       return false;
                                                     }
                                                   });
                             return acc;
                           }, new Map());
        if (triggers.size === 0) {
          // no triggers to process
          return tables;
        } else {
          // do nothing
        }
        // we create a multi query here so we can query all at once rather than in individual connections
        const getSchemaMultiQuery = [];
        triggers.forEach((_, t) => getSchemaMultiQuery.push(`SHOW CREATE TRIGGER \`${t}\`;`));
        const result = await connection.multiQuery(getSchemaMultiQuery.join('\n'));
        // mysql2 returns an array of arrays which will all have our one row
        result.map((r) => r[0])
              .forEach((res) => {
                const table = tables[triggers.get(res.Trigger)];
                // clean up the generated SQL
                let sql = `${res['SQL Original Statement']}`;
                if (!options.definer) {
                  sql = sql.replace(/CREATE DEFINER=.+?@.+? /, 'CREATE ');
                } else {
                  // do nothing
                }
                // add the delimiter in case it's a multi statement trigger
                if (options.delimiter) {
                  sql = `DELIMITER ${options.delimiter}\n${sql}${options.delimiter}\nDELIMITER ;`;
                } else {
                  // else just add a semicolon
                  sql = `${sql};`;
                }
                // drop trigger statement should go outside the delimiter mods
                if (options.dropIfExist) {
                  sql = `DROP TRIGGER IF EXISTS ${res.Trigger};\n${sql}`;
                } else {
                  // do nothing
                }
                // add a header to the trigger
                sql = [
                  '# ------------------------------------------------------------',
                  `# TRIGGER DUMP FOR: ${res.Trigger}`,
                  '# ------------------------------------------------------------',
                  '',
                  sql,
                  ''
                ].join('\n');
                table.triggers.push(sql);

                return table;
              });
        resolve(tables);
      })();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-tigger.function - getTriggerDump - Promise - catch - error' });
      reject(error);
    }
  });
};

module.exports = {
  getTriggerDump
};
