'use strict';

const DBClientClass = require('./db-client.class');
const DataCheckerFunction = require('../functions/data-checker.function');
const Logger = require('../utils/logger');

class ConnectionPoolClass {
  static #connections = new Map();
  static #freeConnections = [];
  static #maxConnections;

  /**
   * Used for returning dbClient from pool
   *
   * @static
   * @param {number} connId
   * @return {DBClientClass}
   * @memberof ConnectionPoolClass
   */
  static getConnectionById(connId) {
    return ConnectionPoolClass.#connections.get(connId).dbClient;
  }

  /**
   * Used for releasing dbclient back to free connections
   *
   * @static
   * @param {string} connId
   * @memberof ConnectionPoolClass
   */
  static releaseConnection(connId) {
    if (DataCheckerFunction.notUndefOrNull(connId)
        && DataCheckerFunction.notUndefOrNull(ConnectionPoolClass.#connections.get(connId).socket)) {
      ConnectionPoolClass.#connections.get(connId).socket = null;
      ConnectionPoolClass.#connections.get(connId).dbClient.disableSocketWrite();
      ConnectionPoolClass.#freeConnections.push(connId);
    } else {
      // do nothing
    }
  }

  /**
   * Used for setting up original number of connections
   *
   * @static
   * @param {object} [params={ numberOfConnections: 10, maxConnections: 100 }]
   * @memberof ConnectionPoolClass
   */
  static async init(params = { numberOfConnections: 10, maxConnections: 100 }) {
    ConnectionPoolClass.#maxConnections = params.maxConnections;
    for (let id = 0; id < params.numberOfConnections; id++) {
      // eslint-disable-next-line no-await-in-loop
      await ConnectionPoolClass.getNewConnection();
    }
  }

  /**
   * Used for connecting free connections back to pool
   *
   * @static
   * @memberof ConnectionPoolClass
   */
  static async keepFreeConnections() {
    for (let id = 0; id < ConnectionPoolClass.#freeConnections.length; id++) {
      // eslint-disable-next-line no-await-in-loop
      await ConnectionPoolClass.#connections.get(ConnectionPoolClass.#freeConnections[id]).dbClient.setDB(process.env.DB_NAME);
    }
  }

  /**
   * Used for returning a new connection
   *
   * @static
   * @param {boolean} [returnSocket=false]
   * @param {boolean} [force=false]
   * @return {Promise(object)} connection
   *    connection.connId - string
   *    connection.dbClient - DBClientClass
   *    connection.socket - null
   * @memberof ConnectionPoolClass
   */
  static async getNewConnection(returnSocket = false, force = false) {
    if ((ConnectionPoolClass.#connections.size > ConnectionPoolClass.#maxConnections) && !force) {
      Logger.apiLogger.error('>> Max connections reached in connection pool.', { label: 'connection-pool.class - ConnectionPoolClass - async getNewConnection - error' });
      throw Error('Max connections reached in connection pool.');
    } else {
      const dbClient = await DBClientClass.createDBClient();
      await dbClient.setDB(process.env.DB_NAME);
      const connId = ConnectionPoolClass.#connections.length;
      const connection = { connId, dbClient, socket: null };
      ConnectionPoolClass.#connections.set(connId, connection);
      if (!returnSocket) {
        ConnectionPoolClass.#freeConnections.push(connId);
      } else {
        // do nothing
      }

      return connection;
    }
  }

  /**
   * Used for retrieving next available free connection id or creating a new connection to return the id
   *
   * @static
   * @param {object} socket
   * @param {boolean} [force=false]
   * @return {Promise(number)} connId
   * @memberof ConnectionPoolClass
   */
  static async getFreeConnection(socket, force = false) {
    if (ConnectionPoolClass.#freeConnections.length > 0) {
      const connId = ConnectionPoolClass.#freeConnections.shift();
      ConnectionPoolClass.#connections.get(connId).socket = socket;
      ConnectionPoolClass.#connections.get(connId).dbClient.setSocket(socket);

      return connId;
    } else {
      const connection = await ConnectionPoolClass.getNewConnection(true, force);
      connection.socket = socket;
      connection.dbClient.setSocket(socket);

      return connection.connId;
    }
  }
}

module.exports = ConnectionPoolClass;
