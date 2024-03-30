'use strict';

const deepmerge = require('deepmerge');
const fs = require('fs');
const lodash = require('lodash');
const mysql2 = require('mysql2');
const sqlFormatter = require('sql-formatter');

const DataCheckerFunction = require('./data-checker.function');
const MySQLDumpTypecastFunction = require('./mysql-dump-typecast.function');
const Logger = require('../utils/logger');

/**
 * Used for saving a chunk of the file stream to the current table lines
 *
 * @param {string} str
 * @param {*} outFileStream
 * @param {string[]} currentTableLines
 */
const saveChunk_ = (str, outFileStream, currentTableLines) => {
  let cloneDeepStr = lodash.cloneDeep(str);
  if (!Array.isArray(cloneDeepStr)) {
    cloneDeepStr = [cloneDeepStr];
  } else {
    // do nothing
  }

  // write to file if configured
  if (DataCheckerFunction.notUndefOrNull(outFileStream)) {
    cloneDeepStr.forEach((s) => outFileStream.write(`${s}\n`));
  } else {
    // do nothing
  }

  // write to memory if configured
  if (DataCheckerFunction.notUndefOrNull(currentTableLines)) {
    currentTableLines.push(...cloneDeepStr);
  } else {
    // do nothing
  }
};

/**
 * Used for executing sql query with connection
 *
 * @param {mysql2 connection} connection
 * @param {string} sql
 * @return {Promise}
 */
// eslint-disable-next-line arrow-body-style
const executeSQL_ = (connection, sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql,
                     (error) => {
                                  if (DataCheckerFunction.notUndefOrNull(error)) {
                                    Logger.apiLogger.info(`>> "${error}`, { label: 'mysql-dump-data.function - executeSQL_ - Promise - connection.query - error' });
                                    reject(error);
                                  } else {
                                    resolve();
                                  }
                                });
  });
};

/**
 * Used for building the table insert sql string
 *
 * @param {Table} table
 * @param {string[]} values
 * @param {(s) => string} format
 * @return {string}
 */
const buildInsert_ = (table, values, format) => {
  const sql = format([`INSERT INTO \`${table.name}\` (\`${table.columnsOrdered.join('`,`')}\`)`, `VALUES ${values.join(',')};`].join(' '));

  // sql-formatter lib doesn't support the X'aaff' or b'01010' literals, and it adds a space in and breaks them
  // this undoes the wrapping we did to get around the formatting
  return sql.replace(/NOFORMAT_WRAP\("##(.+?)##"\)/g, '$1');
};

/**
 * Used for building the insert value for sql
 *
 * @param {object} row
 * @param {Table} table
 */
const buildInsertValue_ = (row, table) => `(${table.columnsOrdered.map((c) => row[c]).join(',')})`;

/**
 * Used for getting table dump
 *
 * @param {*} connectionOptions
 * @param {*} options
 * @param {*} tables
 * @param {*} dumpToFile
 * @return {Promise}
 */
// eslint-disable-next-line arrow-body-style
const getDataDump = async (connectionOptions, options, tables, dumpToFile) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        // ensure we have a non-zero max row option
        // eslint-disable-next-line no-param-reassign
        options.maxRowsPerInsertStatement = Math.max(options.maxRowsPerInsertStatement, 0);
        const cloneDeepTables = lodash.cloneDeep(tables);
        // build the format function if requested
        const format = options.format
                         ? (sql) => sqlFormatter.format(sql)
                         : (sql) => sql;

        let newDeepmerge = deepmerge([connectionOptions, { multipleStatements: true, typeCast: MySQLDumpTypecastFunction.typeCast(cloneDeepTables) }]);
        // we open a new connection with a special typecast function for dumping data
        const connection = mysql2.createConnection(newDeepmerge);
        const retTables = [];
        let currentTableLines = null;
        // open the write stream (if configured to)
        const outFileStream = DataCheckerFunction.notUndefOrNull(dumpToFile)
                                ? fs.createWriteStream(dumpToFile, { flags: 'a', encoding: 'utf8' }) // append to the file
                                : null;

        try {
          if (options.lockTables) {
            // see: https://dev.const .com/doc/refman/5.7/en/replication-solutions-backups-read-only.html
            await executeSQL_(connection, 'FLUSH TABLES WITH READ LOCK');
            await executeSQL_(connection, 'SET GLOBAL read_only = ON');
          } else {
            // do nothing
          }

          // to avoid having to load an entire DB's worth of data at once, we select from each table individually
          // note that we use async/await within this loop to only process one table at a time (to reduce memory footprint)
          while (cloneDeepTables.length > 0) {
            const table = cloneDeepTables.shift();
            if (table.isView && !options.includeViewData) {
              newDeepmerge = deepmerge([table, { data: null }]);
              // don't dump data for views
              retTables.push(newDeepmerge);
              // eslint-disable-next-line no-continue
              continue;
            } else {
              // do nothing
            }

            currentTableLines = options.returnFromFunction ? [] : null;
            if (retTables.length > 0) {
              // add a newline before the next header to pad the dumps
              saveChunk_('', outFileStream, currentTableLines);
            } else {
              // do nothing
            }

            if (options.verbose) {
              // write the table header to the file
              const header = [
                '# ------------------------------------------------------------',
                `# DATA DUMP FOR TABLE: ${table.name}${options.lockTables ? ' (locked)' : ''}`,
                '# ------------------------------------------------------------',
                ''
              ];
              saveChunk_(header, outFileStream, currentTableLines);
            } else {
              // do nothing
            }

            // eslint-disable-next-line no-loop-func, no-await-in-loop
            await new Promise((resolve2, reject2) => {
              // send the query
              const where = options.where[table.name]
                              ? ` WHERE ${options.where[table.name]}`
                              : '';
              const query = connection.query(`SELECT * FROM \`${table.name}\`${where}`);
              let rowQueue = [];

              // stream the data to the file
              query.on('result',
                       (row) => {
                                  // build the values list
                                  rowQueue.push(buildInsertValue_(row, table));
                                  // if we've got a full queue
                                  if (rowQueue.length === options.maxRowsPerInsertStatement) {
                                    // create and write a fresh statement
                                    const insert = buildInsert_(table, rowQueue, format);
                                    saveChunk_(insert, outFileStream, currentTableLines);
                                    rowQueue = [];
                                  } else {
                                    // do nothing
                                  }
                                });
              query.on('end',
                       () => {
                               // write the remaining rows to disk
                               if (rowQueue.length > 0) {
                                 const insert = buildInsert_(table, rowQueue, format);
                                 saveChunk_(insert, outFileStream, currentTableLines);
                                 rowQueue = [];
                               } else {
                                 // do nothing
                               }
                               resolve2();
                             });
              query.on('error',
                        (error) => {
                                     reject2(error);
                                     throw error;
                                   });
            });

            const data = currentTableLines
                           ? currentTableLines.join('\n')
                           : null;
            newDeepmerge = deepmerge([table, { data }]);
            // update the table definition
            retTables.push(newDeepmerge);
          }

          saveChunk_('', outFileStream, currentTableLines);
        } catch (error) {
          Logger.apiLogger.info(`>> "${error}`, { label: 'mysql-dump-data.function - getDataDump - catch - error' });
        } finally {
          if (options.lockTables) {
            // see: https://dev.const .com/doc/refman/5.7/en/replication-solutions-backups-read-only.html
            await executeSQL_(connection, 'SET GLOBAL read_only = OFF');
            await executeSQL_(connection, 'UNLOCK TABLES');
          } else {
            // do nothing
          }
        }

        // clean up our connections
        await new Promise((resolve3, reject3) => {
          try {
            connection.end();
            resolve3();
          } catch (error) {
            Logger.apiLogger.info(`>> "${error}`, { label: 'mysql-dump-data.function - getDataDump - Promise - catch - error' });
            reject3();
            throw error;
          }
        });

        if (outFileStream) {
          // tidy up the file stream, making sure writes are 100% flushed before continuing
          await new Promise((resolve4) => {
            outFileStream.once('finish',
                               () => {
                                       resolve4();
                                     });
            outFileStream.end();
          });
        } else {
          // do nothing
        }

        resolve(retTables);
      })();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-data.function - getDataDump - Promise - catch - error' });
      reject(error);
    }
  });
};

module.exports = {
  getDataDump
};
