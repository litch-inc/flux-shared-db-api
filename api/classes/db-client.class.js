'use strict';

const mySql = require('mysql2/promise');
const net = require('net');

const SecurityClass = require('./security.class');
const DataCheckerFunction = require('../functions/data-checker.function');
const Logger = require('../utils/logger');

class DBClientClass {
  #connection;
  #connected;
  #dbName;
  #stream;
  #socketCallBack;
  #enableSocketWrite;

  /**
   * Creates an instance of DBClientClass.
   *
   * @memberof DBClientClass
   */
  constructor() {
    this.#connection = {};
    this.#connected = false;
    this.#dbName = '';
    this.#stream = null;
    this.#socketCallBack = null;
    this.#enableSocketWrite = false;
  }

  /**
   * Set for private variable #connection
   *
   * @memberof DBClientClass
   */
  set connection(value) {
    this.#connection = value;
  }

  /**
   * Get private variable #connection
   *
   * @memberof DBClientClass
   */
  get connection() {
    return this.#connection;
  }

  /**
   * Set for private variable #connected
   *
   * @memberof DBClientClass
   */
  set connected(value) {
    this.#connected = value;
  }

  /**
   * Get private variable #connected
   *
   * @memberof DBClientClass
   */
  get connected() {
    return this.#connected;
  }

  /**
   * Used for setting a db client connection socket
   *
   * @param {callback} func
   * @memberof DBClientClass
   */
  setSocket(func) {
    if (DataCheckerFunction.isUndefOrNull(func)) {
      Logger.apiLogger.warn('>> Socket set to null', { label: 'db-client.class - setSocket' });
    } else {
      // do nothing
    }

    this.#socketCallBack = func;
    this.#enableSocketWrite = true;
  }

  /**
   * Used for setting db client connection as disable socket write
   *
   * @memberof DBClientClass
   */
  disableSocketWrite() {
    this.#enableSocketWrite = false;
  }

  /**
   * Used for creating a db client connection and stream
   *
   * @memberof DBClientClass
   */
  async init() {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          await this.#createStream();
          this.#stream.on('data', (data) => this.#rawCallback(data));
          this.#connection = await mySql.createConnection({
                                                            password: SecurityClass.getKey(),
                                                            user: process.env.DB_ROOT_USER,
                                                            stream: this.#stream
                                                          })
                                        .then(() => {
                                                      this.#connected = true;
                                                    })
                                        .catch((error) => {
                                                            Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async init - try - mySql.createConnection - catch - error' });
                                                          });

          this.#connection.once('error',
                                () => {
                                        this.#connected = false;
                                        Logger.apiLogger.info(`Connecten to ${this.#dbName} DB was lost`);
                                      });

          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async init - try - catch - error' });
    }
  }

  /**
   * Used for performing db client sql queries
   *
   * @param {string} query
   * @param {boolean} [rawResult=false]
   * @param {string} [fullQuery='']
   * @return {*}
   * @memberof DBClientClass
   */
  async query(query, rawResult = false, fullQuery = '') {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          return await this.#actionMySQL(query, rawResult, fullQuery);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async query - try - catch - error' });
      return null;
    }
  }

  /**
   * Used for performing db client sql execute statements
   *
   * @param {string} query
   * @param {*} params
   * @param {boolean} [rawResult=false]
   * @param {string} [fullQuery='']
   * @return {*}
   * @memberof DBClientClass
   */
  async execute(query, params, rawResult = false, fullQuery = '') {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          return await this.#actionMySQL(query, rawResult, fullQuery, params);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async execute - try - catch - error' });
      return null;
    }
  }

  /**
   * Used for creating db if one doesnt exist
   *
   * @param {string} dbName
   * @return {*}
   * @memberof DBClientClass
   */
  async createDB(dbName) {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          return await this.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async createDB - try - catch - error' });
      return null;
    }
  }

  /**
   * Used for setting the db connection name
   *
   * @param {string} dbName
   * @memberof DBClientClass
   */
  async setDBName(dbName) {
    try {
      switch (process.env.DB_TYPE) {
        case 'MySQL': {
          this.#dbName = dbName;
          this.#connection.changeUser({ database: dbName },
                                      (error) => {
                                                   Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async setDBName - this.#connection.changeUser - error' });
                                                 });
          break;
        }
        case 'PostgreSQL':
        case 'MongoDB':
        default: {
          throw Error(`${process.env.DB_TYPE} not supported`);
        }
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async setDBName - try - catch - error' });
    }
  }

  // /**
  // * [setPassword]
  // * @param {string} key [description]
  // */
  // async setPassword(key) {
  //   try {
  //     switch (process.env.DB_TYPE) {
  //       case 'MySQL': {
  //         await this.query(`SET PASSWORD FOR 'root'@'localhost' = PASSWORD('${key}');SET PASSWORD FOR 'root'@'%' = PASSWORD('${key}');FLUSH PRIVILEGES;`);
  //         break;
  //       }
  //       case 'PostgreSQL':
  //       case 'MongoDB':
  //       default: {
  //         throw Error(`${process.env.DB_TYPE} not supported`);
  //       }
  //     }
  //   } catch (error) {
  //     Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async setPassword - try - catch - error' });
  //   }
  // }

  /**
   * Used as call back for socket write
   *
   * @memberof DBClientClass
   */
  #rawCallback(data) {
    if (DataCheckerFunction.notUndefOrNull(this.#socketCallBack) && this.#enableSocketWrite) {
      this.#socketCallBack.write(data);
    } else {
      // do nothing
    }
  }

  /**
   * Used for creating a stream
   *
   * @return {*} Promise
   * @memberof DBClientClass
   */
  async #createStream() {
    this.#stream = net.connect({
                                 host: process.env.DB_COMPONENT_NAME,
                                 port: process.env.DB_PORT
                               });

    return new Promise((resolve, reject) => {
      this.#stream.once('connect', () => {
                                           this.#stream.removeListener('error', reject);
                                           resolve(this.#stream);
                                         });
      this.#stream.once('error', (error) => {
                                              Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async #createStream - #stream.once - error' });
                                              this.#stream.removeListener('connection', resolve);
                                              this.#stream.removeListener('data', resolve);
                                              reject(error);
                                            });
    });
  }

  /**
   * Used for perming action for MySQL
   *
   * @param {*} query
   * @param {*} rawResult
   * @param {*} fullQuery
   * @param {*} params
   * @return {*}
   * @memberof DBClientClass
   */
  async #actionMySQL(query, rawResult, fullQuery, params) {
    try {
      if (DataCheckerFunction.isUndefOrNull(this.#connected)) {
        await this.#reconnectDB();
      } else {
        // do nothing
      }

      const [rows, fields, error] = DataCheckerFunction.isUndefOrNull(params)
                                      ? this.#connection.query(query)
                                      : await this.#connection.execute(query, params);

      if (rawResult) {
        if (error) {
          if (fullQuery !== '') {
            Logger.apiLogger.error(`>> ${error}, ${fullQuery}`, { label: `db-client.class - async #actionMySQL - try - rawResult - await this.#connection.${DataCheckerFunction.isUndefOrNull(params) ? 'query' : 'execute'} - error` });
          } else {
            Logger.apiLogger.error(`>> ${error}`, { label: `db-client.class - async #actionMySQL - try - rawResult - await this.#connection.${DataCheckerFunction.isUndefOrNull(params) ? 'query' : 'execute'} - error` });
          }
        } else {
          // do nothing
        }

        return [rows, fields, error];
      } else {
        if (error) {
          if (fullQuery !== '') {
            Logger.apiLogger.error(`>> ${error}, ${fullQuery}`, { label: `db-client.class - async #actionMySQL - try - await this.#connection.${DataCheckerFunction.isUndefOrNull(params) ? 'query' : 'execute'} - error` });
          } else {
            Logger.apiLogger.error(`>> ${error}`, { label: `db-client.class - async #actionMySQL - try - await this.#connection.${DataCheckerFunction.isUndefOrNull(params) ? 'query' : 'execute'} - error` });
          }
        } else {
          // do nothing
        }

        return rows;
      }
    } catch (error) {
      if (fullQuery !== '') {
        Logger.apiLogger.error(`>> ${error}, ${fullQuery}`, { label: 'db-client.class - async #actionMySQL - catch - error' });
      } else {
        Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async #actionMySQL - catch - error' });
      }

      return [null, null, error];
    }
  }

  /**
   * Used for reconnecting a db
   *
   * @memberof DBClientClass
   */
  async #reconnectDB() {
    try {
      Logger.apiLogger.info(`Connection to ${this.#dbName} DB was lost, reconnecting...`, { label: 'db-client.class - async #reconnectDB - try' });
      await this.init();
      await this.setDBName(this.#dbName);
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'db-client.class - async #reconnectDB - catch - error' });
    }
  }
}

exports.createDBClient = async () => {
  const dbClientClass = new DBClientClass();
  await dbClientClass.init();

  return dbClientClass;
};
