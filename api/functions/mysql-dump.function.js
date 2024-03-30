'use strict';

const deepmerge = require('deepmerge');
const fs = require('fs');

const DBClass = require('../classes/db.class');
const DataCheckerFunction = require('./data-checker.function');
const MySQLDumpConstant = require('../constants/mysql-dump.constant');
const MySQLDumpCompressFunction = require('./mysql-dump-compress.function');
const MySQLDumpDataFunction = require('./mysql-dump-data.function');
const MySQLDumpSchemaFunction = require('./mysql-dump-schema.function');
const MySQLDumpTablesFunction = require('./mysql-dump-tables.function');
const MySQLDumpTriggerFunction = require('./mysql-dump-trigger.function');
const Logger = require('../utils/logger');

/**
 * Used for conditionally checking if option is not defined and throwing error message passed in from parent
 *
 * @param {*} condition
 * @param {*} message
 */
const assert = (condition, message) => {
  if (DataCheckerFunction.isUndefOrNull(condition)) {
    throw Error(message);
  } else {
    // do nothing
  }
};

/**
 * Used for retrieving mysql db dump
 *
 * @param {*} inputOptions
 * @return {Promise}
 */
// eslint-disable-next-line arrow-body-style
const dump = (inputOptions) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        // assert the given options have all the required properties
        assert(inputOptions.connection, MySQLDumpConstant.MISSING_CONNECTION_CONFIG);
        assert(inputOptions.connection.host, MySQLDumpConstant.MISSING_CONNECTION_HOST);
        assert(inputOptions.connection.database, MySQLDumpConstant.MISSING_CONNECTION_DATABASE);
        assert(inputOptions.connection.user, MySQLDumpConstant.MISSING_CONNECTION_USER);
        // note that you can have empty string passwords, hence the type assertion
        assert(typeof inputOptions.connection.password === 'string', MySQLDumpConstant.MISSING_CONNECTION_PASSWORD);
        const options = deepmerge.all([MySQLDumpConstant.DEFAULT_OPTIONS, inputOptions]);
        // if not dumping to file and not otherwise configured, set returnFromFunction to true.
        if (!options.dumpToFile) {
          const hasValue = inputOptions.dump
                           && inputOptions.dump.data
                           && inputOptions.dump.data.returnFromFunction !== undefined;
          if (options.dump.data && !hasValue) {
            options.dump.data.returnFromFunction = true;
          } else {
            // do nothing
          }
        } else {
          // do nothing
        }
        // make sure the port is a number
        options.connection.port = parseInt(`${options.connection.port}`, 10);
        // write to the destination file (i.e. clear it)
        if (options.dumpToFile) {
          fs.writeFileSync(options.dumpToFile, '');
        } else {
          // do nothing
        }
        // write the initial headers
        if (options.dumpToFile) {
          fs.appendFileSync(options.dumpToFile, `${MySQLDumpConstant.HEADER_VARIABLES}\n`);
        } else {
          // do nothing
        }
        const connection = await DBClass.connect(deepmerge.all([options.connection, { multipleStatements: true }]));
        // list the tables
        const res = {
          dump: {
            schema: null,
            data: null,
            trigger: null
          },
          tables: await MySQLDumpTablesFunction.getTables(connection, options.connection.database, options.dump.tables, options.dump.excludeTables)
        };
        // dump the schema if requested
        if (options.dump.schema !== false) {
          const tables = res.tables;
          res.tables = await MySQLDumpSchemaFunction.getSchemaDump(connection, options.dump.schema, tables);
          res.dump.schema = res.tables.map((t) => t.schema)
                                      .filter((t) => t)
                                      .join('\n')
                                      .trim();
        } else {
          // do nothing
        }
        // write the schema to the file
        if (options.dumpToFile && res.dump.schema) {
          fs.appendFileSync(options.dumpToFile, `${res.dump.schema}\n\n`);
        } else {
          // do nothing
        }
        // dump the triggers if requested
        if (options.dump.trigger !== false) {
          const tables = res.tables;
          res.tables = await MySQLDumpTriggerFunction.getTriggerDump(connection, options.connection.database, options.dump.trigger, tables);
          res.dump.trigger = res.tables.map((t) => t.triggers.join('\n'))
                                       .filter((t) => t)
                                       .join('\n')
                                       .trim();
        } else {
          // do nothing
        }
        // data dump uses its own connection so kill ours
        await connection.end();
        // dump data if requested
        if (options.dump.data !== false) {
          // don't even try to run the data dump
          const tables = res.tables;
          // deepcode ignore Sqli: <user triggers a dump but does not control sql queries, queries created within api>
          res.tables = await MySQLDumpDataFunction.getDataDump(options.connection, options.dump.data, tables, options.dumpToFile);
          res.dump.data = res.tables.map((t) => t.data)
                                    .filter((t) => t)
                                    .join('\n')
                                    .trim();
        } else {
          // do nothing
        }
        // write the triggers to the file
        if (options.dumpToFile && res.dump.trigger) {
          fs.appendFileSync(options.dumpToFile, `${res.dump.trigger}\n\n`);
        } else {
          // do nothing
        }
        // reset all of the variables
        if (options.dumpToFile) {
          fs.appendFileSync(options.dumpToFile, MySQLDumpConstant.FOOTER_VARIABLES);
        } else {
          // do nothing
        }
        // compress output file
        if (options.dumpToFile && options.compressFile) {
          await MySQLDumpCompressFunction.compressFile(options.dumpToFile);
        } else {
          // do nothing
        }
        resolve(res);
      })();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-tigger.function - getTriggerDump - Promise - catch - error' });
      reject(error);
    } finally {
      DBClass.cleanup();
    }
  });
};

module.exports = {
  dump
};
