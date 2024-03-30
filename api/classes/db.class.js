'use strict';

/**
 * mysqldump - v3.2.0
 * Create a DUMP from MySQL.
 * @author Brad Zacher
 * @website https://github.com/bradzacher/mysqldump
 * @license MIT
 */

const mysql2 = require('mysql2/promise');

const Logger = require('../utils/logger');

const pool = [];

class DBClass {
  /**
   * Creates an instance of DBClass.
   *
   * @param {object} connection
   * @memberof DBClass
   */
  constructor(connection) {
    this.connection = connection;
  }

  /**
   * Used for quering db connection
   *
   * @param {string} sql
   * @return {Promise}
   * @memberof DBClass
   */
  query(sql) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const response = await this.connection.query(sql)[0];
          resolve(response);
        } catch (error) {
          Logger.apiLogger.error(`>> ${error}`, { label: 'db.class - DBClass - query - Promise - catch - error' });
          reject(error);
        }
      })();
    });
  }

  /**
   * Used for handeling multi query sql
   *
   * @param {*} sql
   * @return {Promise}
   * @memberof DBClass
   */
  multiQuery(sql) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const isMulti = !(sql.split(';').length === 2);
          let response = (await this.connection.query(sql))[0];
          if (!isMulti) {
            // MySQL will return a non-array payload if there's only one statement in the query
            // so standardise the res..
            response = [response];
          } else {
            // do nothing
          }
          resolve(response);
        } catch (error) {
          Logger.apiLogger.error(`>> ${error}`, { label: 'db.class - DBClass - multiQuery - Promise - catch - error' });
          reject(error);
        }
      })();
    });
  }

  /**
   * Used to end connection
   *
   * @return {Promise(void)}
   * @memberof DBClass
   */
  end() {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await this.connection.end()
                               .catch(() => { });
          resolve();
        } catch (error) {
          Logger.apiLogger.error(`>> ${error}`, { label: 'db.class - DBClass - end - Promise - catch - error' });
          reject(error);
        }
      })();
    });
  }

  /**
   * Used to connect to db
   *
   * @static
   * @param {*} options
   * @return {Promise(DBClass)}
   * @memberof DBClass
   */
  static connect(options) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const instance = new DBClass(await mysql2.createConnection(options));
          pool.push(instance);
          resolve(instance);
        } catch (error) {
          Logger.apiLogger.error(`>> ${error}`, { label: 'db.class - DBClass - connect - Promise - catch - error' });
          reject(error);
        }
      })();
    });
  }

  /**
   * Used for ending all connections
   *
   * @static
   * @return {Promise(Promise.all)}
   * @memberof DBClass
   */
  static cleanup() {
    return new Promise((resolve, reject) => {
      try {
        const allEnd = Promise.all(pool.map((p) => p.end()));
        resolve(allEnd);
      } catch (error) {
        Logger.apiLogger.error(`>> ${error}`, { label: 'db.class - DBClass - cleanup - Promise - catch - error' });
        reject(error);
      }
    });
  }
}

module.exports = DBClass;
