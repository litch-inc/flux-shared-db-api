'use strict';

const memoryCache = require('memory-cache');

const ConnectionPoolClass = require('./connection-pool.class');
const DBClientClass = require('./db-client.class');
const SecurityClass = require('./security.class');
const BacklogConstant = require('../constants/backlog.constant');
const DataCheckerFunction = require('../functions/data-checker.function');
const UtilityFunction = require('../functions/utility.function');
const MySQLDumpFunction = require('../functions/mysql-dump.function');
const Logger = require('../utils/logger');

class BacklogClass {
  // TODO: ASK
  // static #buffer = [];
  static #sequenceNumber = 0;
  // static #bufferSequenceNumber = 0;
  static #bufferStartSequenceNumber = 0;
  static #instanceDBClient = null;
  static #userDBClient = null;
  // static #writeLock = false;
  static #executeLogs = true;
  static #instanceMemoryCache = memoryCache;

  /**
   * Set for private variable #sequenceNumber
   *
   * @static
   * @param {number} value
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set sequenceNumber(value) {
    BacklogClass.#sequenceNumber = value;
  }

  /**
   * Get private variable #sequenceNumber
   *
   * @static
   * @return {number}
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get sequenceNumber() {
    return BacklogClass.#sequenceNumber;
  }

  // eslint-disable-next-line class-methods-use-this
  /**
   * Set for private variable #bufferStartSequenceNumber
   *
   * @static
   * @param {number} value
   * @memberof BacklogClass
   */
  static set bufferStartSequenceNumber(value) {
    BacklogClass.#bufferStartSequenceNumber = value;
  }

  /**
   * Get private variable #bufferStartSequenceNumber
   *
   * @static
   * @return {number}
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get bufferStartSequenceNumber() {
    return BacklogClass.#bufferStartSequenceNumber;
  }

  /**
   * Set for private variable #userDBClient
   *
   * @static
   * @param {DBClientClass} value
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set userDBClient(value) {
    BacklogClass.#userDBClient = value;
  }

  /**
   * Get private variable #userDBClient
   *
   * @static
   * @return {DBClientClass}
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get userDBClient() {
    return BacklogClass.#userDBClient;
  }

  /**
   * Set for private variable #executeLogs
   *
   * @static
   * @param {boolean} value
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set executeLogs(value) {
    BacklogClass.#executeLogs = value;
  }

  /**
   * Get private variable #executeLogs
   *
   * @static
   * @return {boolean}
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get executeLogs() {
    return BacklogClass.#executeLogs;
  }

  /**
   * Set for private variable #instanceMemoryCache
   *
   * @static
   * @param {memoryCache} value
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static set instanceMemoryCache(value) {
    BacklogClass.#instanceMemoryCache = value;
  }

  /**
   * Get private variable #instanceMemoryCache
   *
   * @static
   * @return {memoryCache}
   * @memberof BacklogClass
   */
  // eslint-disable-next-line class-methods-use-this
  static get instanceMemoryCache() {
    return BacklogClass.#instanceMemoryCache;
  }

  /**
   * Used for creating the backlog
   *
   * @static
   * @memberof BacklogClass
   */
  static async createBacklog() {
    try {
      BacklogClass.#instanceDBClient = await DBClientClass.createDBClient();

      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await BacklogClass.#createBacklogDB();
          await BacklogClass.#createBacklogDBTable(process.env.DB_BACKLOG_COLLECTION);
          await BacklogClass.#createBacklogDBTable(process.env.DB_BACKLOG_BUFFER);
          await BacklogClass.#createBacklogDBTable(process.env.DB_OPTIONS, true);

          BacklogClass.#sequenceNumber = BacklogClass.getLastSequenceNumber();
          Logger.apiLogger.info(`Last Seq No: ${BacklogClass.#sequenceNumber}`, { label: 'backlog.class - BacklogClass - async createBacklog - catch - error' });
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async createBacklog - try - MySQL' });
    }
  }

  /**
   * Used for pushing queries to db
   *
   * @static
   * @param {string} query
   * @param {number} [seq=0]
   * @param {number} [timestamp=Date.now()]
   * @param {boolean} [buffer=false]
   * @param {number} [connId=-1]
   * @param {string} [fullQuery='']
   * @return {Promise({ records: any[] | null, seq: number, timestamp: number })}
   * @memberof BacklogClass
   */
  static async pushQuery(query, seq = 0, timestamp = Date.now(), buffer = false, connId = -1, fullQuery = '') {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          return buffer
                   ? await BacklogClass.#pushQueryWithBuffer(query, seq, timestamp)
                   : await BacklogClass.#pushQueryWithoutBuffer(query, seq, timestamp, connId, fullQuery);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}, ${query}, ${seq}`, { label: 'backlog.class - BacklogClass - async pushQuery - catch - error' });
      // BacklogClass.#writeLock = false;
      return { records: null, seq, timestamp };
    }
  }

  /**
   * Used for retrieving DB log
   *
   * @static
   * @param {number} index
   * @return {Promise(object[])}
   * @memberof BacklogClass
   */
  static async getLog(index) {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          return await BacklogClass.#instanceDBClient.query(`SELECT * FROM ${process.env.DB_BACKLOG_COLLECTION} WHERE seq=${index}`);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getLog - catch - error' });
      return [];
    }
  }

  /**
   * Used for retrieving logs with start from and page size limit
   *
   * @static
   * @param {number} startFrom
   * @param {number} pageSize
   * @return {Promise(object[])}
   * @memberof BacklogClass
   */
  static async getLogs(startFrom, pageSize) {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const totalRecords = await BacklogClass.#instanceDBClient.query(`SELECT * FROM ${process.env.DB_BACKLOG_COLLECTION} WHERE seq >= ${startFrom} ORDER BY seq LIMIT ${pageSize}`);
          const trimedRecords = UtilityFunction.trimArrayToSize(totalRecords, 3 * 1024 * 1024);
          Logger.apiLogger.info(`sending backlog records ${startFrom}, ${pageSize}, records: ${trimedRecords.length}`);

          return trimedRecords;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getLogs - catch - error' });
      return [];
    }
  }

  /**
   * Used for retrieving logs with start from timestamp and end being from start time + logsLength
   *
   * @static
   * @param {string} startFrom
   * @param {string} logsLength
   * @return {Promise(object[])}
   * @memberof BacklogClass
   */
  static async getBacklogsByTime(startFrom, logsLength) {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          return await BacklogClass.#instanceDBClient.execute(`SELECT seq, LEFT(query,10) as query, timestamp FROM ${process.env.DB_BACKLOG_COLLECTION} WHERE timestamp >= ? AND timestamp < ? ORDER BY seq`,
                                                              [startFrom, Number(startFrom) + Number(logsLength)]);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getBacklogsByTime - catch - error' });
      return [];
    }
  }

  /**
   * Used for retrieving logs from date range
   *
   * @static
   * @return {Promise(object[])}
   * @memberof BacklogClass
   */
  static async getDateRange() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = await BacklogClass.#instanceDBClient.execute(`SELECT MIN(timestamp) AS min_timestamp, MAX(timestamp) AS max_timestamp FROM ${process.env.DB_BACKLOG_COLLECTION}`);

          return (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0))
                   ? records[0]
                   : [];
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getDateRange - catch - error' });
      return [];
    }
  }

  /**
   * Used for returning total logs count
   *
   * @static
   * @return {Promise(number)}
   * @memberof BacklogClass
   */
  static async getTotalLogsCount() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = await BacklogClass.#instanceDBClient.query(`SELECT count(*) as total FROM ${process.env.DB_BACKLOG_COLLECTION}`);

          return (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0))
                   ? records[0].total
                   : 0;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getTotalLogsCount - catch - error' });
      return 0;
    }
  }

  /**
   * Used for returning last seq number in logs
   *
   * @static
   * @param {boolean} [buffer=false]
   * @return {Promise(number)}
   * @memberof BacklogClass
   */
  static async getLastSequenceNumber(buffer = false) {
    try {
      BacklogClass.#recreateDBClient();
      let sequenceNumber = 0;
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = buffer
                            ? await BacklogClass.#instanceDBClient.query(`SELECT seq as seqNo FROM ${process.env.DB_BACKLOG_BUFFER} ORDER BY seq DESC LIMIT 1`)
                            : await BacklogClass.#instanceDBClient.query(`SELECT seq as seqNo FROM ${process.env.DB_BACKLOG_COLLECTION} ORDER BY seq DESC LIMIT 1`);
          if (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0)) {
            sequenceNumber = records[0].seqNo;
          } else {
            // do nothing
          }
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }

      return sequenceNumber;
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getLastSequenceNumber - catch - error' });
      return 0;
    }
  }

  /**
   * Used for clearing all logs from backlog
   *
   * @static
   * @memberof BacklogClass
   */
  static async clearLogs() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await BacklogClass.#instanceDBClient.query(`DELETE FROM ${process.env.DB_BACKLOG_COLLECTION}`);
          BacklogClass.#sequenceNumber = 0;
          Logger.apiLogger.info('All backlog data removed successfully on MySQL server.', { label: 'backlog.class - BacklogClass - async clearLogs - finally' });
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async clearLogs - catch - error' });
    }
  }

  /**
   * Used for setting dbname for instance db and user db
   *
   * @static
   * @memberof BacklogClass
   */
  static async keepConnections() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await BacklogClass.#instanceDBClient.setDBName(process.env.DB_BACKLOG);
          await BacklogClass.#userDBClient.setDBName(process.env.DB_NAME);
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async keepConnections - catch - error' });
    }
  }

  /**
   * Used for rebuilding the backlog db
   *
   * @static
   * @param {number} seqNo
   * @memberof BacklogClass
   */
  static async rebuildDatabase(seqNo) {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await BacklogClass.#instanceDBClient.query(`DROP DATABASE ${process.env.DB_NAME}`);
          await BacklogClass.#instanceDBClient.createDB(process.env.DB_NAME);
          await BacklogClass.#userDBClient.setDBName(process.env.DB_NAME);
          const records = await BacklogClass.#instanceDBClient.execute('SELECT * FROM backlog WHERE seq<=? ORDER BY seq', [seqNo]);
          records.forEach(async (record) => {
                                              Logger.apiLogger.info(`Executing seq(${record.seq})`, { label: 'backlog.class - BacklogClass - async rebuildDatabase - try - MySQL' });
                                              try {
                                                await BacklogClass.#userDBClient.query(record.query);
                                              } catch (error) {
                                                Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async rebuildDatabase - try - catch - error' });
                                              }
                                            });
          await BacklogClass.#instanceDBClient.execute('DELETE FROM backlog WHERE seq>?', [seqNo]);
          await BacklogClass.clearBuffer();
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
      // BacklogClass.#buffer = [];
      Logger.apiLogger.info(`DB and backlog rolled back to ${seqNo}`, { label: 'backlog.class - BacklogClass - async rebuildDatabase - try' });
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async rebuildDatabase - catch - error' });
    }
  }

  /**
   * Used for destroying backlog db
   *
   * @static
   * @memberof BacklogClass
   */
  static async destroyBacklog() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await BacklogClass.#instanceDBClient.query(`DROP DATABASE ${process.env.DB_BACKLOG}`);
          BacklogClass.#sequenceNumber = 0;
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
      Logger.apiLogger.info(`${process.env.DB_BACKLOG} database and all it's data erased successfully.`, { label: 'backlog.class - BacklogClass - async destroyBacklog - try' });
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async destroyBacklog - catch - error' });
    }
  }

  /**
   * Used for clearing the backlog buffer
   *
   * @static
   * @memberof BacklogClass
   */
  static async clearBuffer() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await BacklogClass.#instanceDBClient.query(`DELETE FROM ${process.env.DB_BACKLOG_BUFFER}`);
          // BacklogClass.#bufferSequenceNumber = 0;
          BacklogClass.#bufferStartSequenceNumber = 0;
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
      // BacklogClass.#buffer = [];
      Logger.apiLogger.info('All buffer data removed successfully.', { label: 'backlog.class - BacklogClass - async clearBuffer - try' });
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async clearBuffer - catch - error' });
    }
  }

  /**
   * Used for moving the current buffer to backlog
   *
   * @static
   * @memberof BacklogClass
   */
  static async moveBufferToBacklog() {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          let records = await BacklogClass.#instanceDBClient.query(`SELECT * FROM ${process.env.DB_BACKLOG_BUFFER} ORDER BY seq`);
          records.forEach(async (record) => {
                                              Logger.apiLogger.info(`Copying seq(${record.seq}) from buffer`, { label: 'backlog.class - BacklogClass - async clearBuffer - try - MySQL' });
                                              try {
                                                BacklogClass.pushQuery(record.query, record.seq, record.timestamp);
                                                await BacklogClass.#instanceDBClient.execute(`DELETE FROM ${process.env.DB_BACKLOG_BUFFER} WHERE seq=?`, [record.seq]);
                                              } catch (error) {
                                                Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async moveBufferToBacklog - catch - error' });
                                              }
                                            });

          records = await BacklogClass.#instanceDBClient.query(`SELECT * FROM ${process.env.DB_BACKLOG_BUFFER} ORDER BY seq`);
          BacklogClass.#bufferStartSequenceNumber = (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0))
                                                      ? records[0].seq
                                                      : 0;
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
      Logger.apiLogger.info('All buffer data moved to backlog successfully.', { label: 'backlog.class - BacklogClass - async clearBuffer - try' });
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async clearBuffer - catch - error' });
    }
  }

  /**
   * Used for pushing a key to the options db
   *
   * @static
   * @param {string} key
   * @param {string} value
   * @param {boolean} [encrypt=true]
   * @memberof BacklogClass
   */
  static async pushKey(key, value, encrypt = true) {
    try {
      BacklogClass.#recreateDBClient();
      const encryptedValue = encrypt
                               ? SecurityClass.encrypt(value)
                               : value;
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = await BacklogClass.#instanceDBClient.execute(`SELECT * FROM ${process.env.DB_OPTIONS} WHERE k=?`, [key]);
          if (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0)) {
            await BacklogClass.#instanceDBClient.execute(`UPDATE ${process.env.DB_OPTIONS} SET value=? WHERE k=?`, [encryptedValue, key]);
          } else {
            await BacklogClass.#instanceDBClient.execute(`INSERT INTO ${process.env.DB_OPTIONS} (k, value) VALUES (?,?)`, [key, encryptedValue]);
          }
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
      // BacklogClass.#buffer = [];
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async pushKey - catch - error' });
    }
  }

  /**
   * Used for retuning boolean if removing key value from options db was successful
   *
   * @static
   * @param {string} key
   * @return {Promise(boolean)}
   * @memberof BacklogClass
   */
  static async removeKey(key) {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = await BacklogClass.#instanceDBClient.execute(`DELETE FROM ${process.env.DB_OPTIONS} WHERE k=?`, [key]);

          return DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async removeKey - catch - error' });
      return false;
    }
  }

  /**
   * Used for returning key value from options db
   *
   * @static
   * @param {string} key
   * @param {boolean} [decrypt=true]
   * @return {Promise(string | null)}
   * @memberof BacklogClass
   */
  static async getKey(key, decrypt = true) {
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = await BacklogClass.#instanceDBClient.execute(`SELECT * FROM ${process.env.DB_OPTIONS} WHERE k=?`, [key]);
          if (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 0)) {
            return decrypt
                     ? SecurityClass.encryptComm(SecurityClass.decrypt(records[0].value))
                     : records[0].value;
          } else {
            return null;
          }
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getKey - catch - error' });
      return null;
    }
  }

  /**
   * Used for returning record of key values
   *
   * @static
   * @return {Promise(Record)}
   * @memberof BacklogClass
   */
  static async getAllKeys() {
    const keys = {};
    try {
      BacklogClass.#recreateDBClient();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const records = await BacklogClass.#instanceDBClient.execute(`SELECT * FROM ${process.env.DB_OPTIONS}`);
          records.forEach((record) => {
                                        keys[record.k] = SecurityClass.encryptComm(SecurityClass.decrypt(record.value));
                                      });
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }

      return keys;
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async getAllKeys - catch - error' });
      return keys;
    }
  }

  /**
   * Used for dumping the backup dbs
   *
   * @static
   * @memberof BacklogClass
   */
  static async dumpBackup() {
    try {
      BacklogClass.#recreateDBClient();
      const timestamp = new Date().getTime();
      const startTime = Date.now();
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await MySQLDumpFunction.dump({
            connection: {
              host: process.env.DB_COMPONENT_NAME,
              port: process.env.DB_PORT,
              user: process.env.DB_ROOT_USER,
              password: SecurityClass.getKey(),
              database: process.env.DB_NAME
            },
            dump: {
              schema: {
                table: {
                  dropIfExist: true
                }
              },
              data: {
                verbose: false
              }
            },
            dumpToFile: `./dumps/BU_${timestamp}.sql`
          });
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
      const endTime = Date.now();
      Logger.apiLogger.info(`Backup file created in (${endTime - startTime} ms): BU_${timestamp}.sql`, { label: 'backlog.class - BacklogClass - async dumpBackup - try' });
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async dumpBackup - catch - error' });
    }
  }

  /**
   * Used for creating back db
   *
   * @static
   * @memberof BacklogClass
   */
  static async #createBacklogDB() {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const dbList = await BacklogClass.#instanceDBClient.query(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${process.env.DB_BACKLOG}'`);
          if (dbList.length === 0) {
            Logger.apiLogger.info('Backlog DB not defined yet, creating backlog DB...');
            await BacklogClass.#instanceDBClient.createDB(process.env.DB_BACKLOG);
          } else {
            Logger.apiLogger.info('Backlog DB already exists, moving on...');
          }
          await BacklogClass.#instanceDBClient.setDBName(process.env.DB_BACKLOG);
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async #createBacklogDB - catch - error' });
    }
  }

  /**
   * Used for creating backlog db tables
   *
   * @static
   * @param {string} tableName
   * @param {boolean} [options=false]
   * @memberof BacklogClass
   */
  static async #createBacklogDBTable(tableName, options = false) {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          const tableList = options
                              ? await BacklogClass.#instanceDBClient.query(`SELECT * FROM INFORMATION_SCHEMA.tables WHERE table_schema = '${process.env.DB_BACKLOG}' and table_name = '${tableName}'`)
                              : await BacklogClass.#instanceDBClient.query(`SELECT * FROM INFORMATION_SCHEMA.tables WHERE table_schema = '${process.env.DB_BACKLOG}' and table_name = '${tableName}'`);
          if (DataCheckerFunction.notUndefOrNull(tableList) && Array.isArray(tableList) && (tableList.length === 0)) {
            Logger.apiLogger.info(`Backlog ${tableName} table not defined yet, creating backlog table...`);

            if (options) {
              await BacklogClass.#instanceDBClient.query(`CREATE TABLE ${tableName} (k varchar(64), value text, PRIMARY KEY (k)) ENGINE=InnoDB;`);
            } else {
              await BacklogClass.#instanceDBClient.query(`CREATE TABLE ${tableName} (seq bigint, query longtext, timestamp bigint) ENGINE=InnoDB;`);
              await BacklogClass.#instanceDBClient.query(`ALTER TABLE \`${process.env.DB_BACKLOG}\`.\`${tableName}\`
                                                          MODIFY COLUMN \`seq\` bigint(0) UNSIGNED NOT NULL FIRST,
                                                          ADD PRIMARY KEY (\`seq\`),
                                                          ADD UNIQUE INDEX \`seq\`(\`seq\`);`);
            }
          } else {
            Logger.apiLogger.info(`Backlog ${tableName} table already exists, moving on...`);
          }
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async #createBacklogDBTable - catch - error' });
    }
  }

  /**
   * Used for completing push query from MySQL with buffer true
   *
   * @static
   * @param {string} query
   * @param {number} seq
   * @param {number} timestamp
   * @return {Promise({ records: null, seq: number, timestamp: number })}
   * @memberof BacklogClass
   */
  static async #pushQueryWithBuffer(query, seq, timestamp) {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          if (BacklogClass.#bufferStartSequenceNumber === 0) {
            BacklogClass.#bufferStartSequenceNumber = seq;
          } else {
            // do nothing
          }
          // BacklogClass.#bufferSequenceNumber = seq;
          await BacklogClass.#instanceDBClient.execute(`INSERT INTO ${process.env.DB_BACKLOG_BUFFER} (seq, query, timestamp) VALUES (?,?,?)`,
                                                       [seq, query, timestamp]);

          return { records: null, seq, timestamp };
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async #pushQueryWithBuffer - catch - error' });
      return { records: null, seq, timestamp };
    }
  }

  /**
   * Used for completing push query from MySQL with buffer false
   *
   * @static
   * @param {string} query
   * @param {number} seq
   * @param {number} timestamp
   * @param {number} connId
   * @param {string} fullQuery
   * @return {Promise({ records: any[] | null, seq: number, timestamp: number })}
   * @memberof BacklogClass
   */
  static async #pushQueryWithoutBuffer(query, seq, timestamp, connId, fullQuery) {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          // BacklogClass.#writeLock = true;
          BacklogClass.#sequenceNumber = (seq === 0) ? BacklogClass.#sequenceNumber + 1 : seq;
          const seqForThis = BacklogClass.#sequenceNumber;
          let records = await BacklogClass.#instanceDBClient.execute(`INSERT INTO ${process.env.DB_BACKLOG_COLLECTION} (seq, query, timestamp) VALUES (?,?,?)`,
                                                                     [seqForThis, query, timestamp]);
          if (BacklogClass.#executeLogs) {
            Logger.apiLogger.info(`Executed ${seqForThis}`, { label: 'backlog.class - BacklogClass - async pushQuery - try - MySQL - error' });
          } else {
            // do nothing
          }
          BacklogClass.#instanceMemoryCache.put(seqForThis,
                                                // eslint-disable-next-line object-curly-newline
                                                { query, seq: seqForThis, timestamp, connId, ip: false },
                                                BacklogConstant.MEMORY_CACHE_EXPIRE_TIME);
          // BacklogClass.#writeLock = false;

          // Abort query execution if there is an error in backlog insert
          if (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 2) && records[2]) {
            Logger.apiLogger.error(`Error in SQL: ${JSON.stringify(records[2])}`, { label: 'backlog.class - BacklogClass - async pushQuery - try - MySQL - error' });
          } else {
            records = null;
            if (connId === -1) {
              // TODO: ASK
              // most beckup softwares generate wrong sql statements for MySQL v8, BacklogClass prevents sql_mode related sql errors on v8.
              if (!query.toLowerCase().startsWith('SET SESSION')) {
                await BacklogClass.#userDBClient.query("SET SESSION sql_mode='IGNORE_SPACE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'", false, fullQuery);
              } else {
                // do nothing
              }
              records = await BacklogClass.#userDBClient.query(query, false, fullQuery);
            } else if (connId >= 0) {
              const connectionById = ConnectionPoolClass.getConnectionById(connId);
              records = await connectionById.query(query, false, fullQuery);
            } else {
              // do nothing
            }

            if (DataCheckerFunction.notUndefOrNull(records) && Array.isArray(records) && (records.length > 2) && records[2]) {
              Logger.apiLogger.error(`Error in SQL: ${JSON.stringify(records[2])}`, { label: 'backlog.class - BacklogClass - async pushQuery - try - MySQL - error' });
            } else {
              // do nothing
            }
          }

          return { records, seq: seqForThis, timestamp };
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async #pushQueryWithoutBuffer - catch - error' });
      return { records: null, seq, timestamp };
    }
  }

  /**
   * Used for recreating backlog db if none found
   *
   * @static
   * @memberof BacklogClass
   */
  static async #recreateDBClient() {
    try {
      if (DataCheckerFunction.is(BacklogClass.#instanceDBClient)) {
        await BacklogClass.createBacklog();
      } else {
        // do nothing
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.class - BacklogClass - async #recreateDBClient - catch - error' });
    }
  }
}

module.exports = BacklogClass;
