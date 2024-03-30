'use strict';

const axios = require('axios');
const { io } = require('socket.io-client');

const Logger = require('../utils/logger');

/**
 * Retrieves app specifications
 *
 * @param {string} appName
 * @return {[]}
 */
const getApplicationSpecs = async (appName) => {
  try {
    const fluxnodeList = await axios.get(`https://api.runonflux.io/apps/appspecifications/${appName}`, { timeout: 13456 });
    if (fluxnodeList.data.status === 'success') {
      return fluxnodeList.data.data || [];
    } else {
      return [];
    }
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getApplicationSpecs - catch - error' });
    return [];
  }
};

/**
 * Retrieves application owner
 *
 * @param {string} appName
 * @return {[]}
 */
const getApplicationOwner = async (appName) => {
  try {
    const fluxnodeList = await axios.get(`https://api.runonflux.io/apps/appspecifications/${appName}`, { timeout: 13456 });
    if (fluxnodeList.data.status === 'success') {
      return fluxnodeList.data.data.owner || [];
    } else {
      return [];
    }
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getApplicationOwner - catch - error' });
    return [];
  }
};

/**
 * Retrieves IP's that a given application is running on
 *
 * @param {string} appName
 * @return {[]}
 */
const getApplicationIP = async (appName) => {
  try {
    const fluxnodeList = await axios.get(`https://api.runonflux.io/apps/location/${appName}`, { timeout: 13456 });
    if (fluxnodeList.data.status === 'success') {
      return fluxnodeList.data.data || [];
    } else {
      return [];
    }
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getApplicationIP - catch - error' });
    return [];
  }
};

/**
 * Used to get master
 *
 * @param {string} ip
 * @param {string} port
 * @return {Promise} json
 */
const getMaster = async (ip, port) => {
  try {
    return new Promise((resolve) => {
      const client = io.connect(`http://${ip}:${port}`, { transports: ['websocket', 'polling'], reconnection: false, timeout: 2000 });
      const timeout = setTimeout(() => {
                                         client.disconnect();
                                         resolve(null);
                                       }, 2000);
      client.emit('getMaster',
                  (response) => {
                                  client.disconnect();
                                  clearTimeout(timeout);
                                  resolve(response.message);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getMaster - catch - error' });
    return new Promise((resolve) => { resolve([]); });
  }
};

/**
 * Used to get master ws
 *
 * @param {string} masterIP
 * @return {Promise} json
 */
const getMasterWS = async (masterIP) => {
  try {
    return new Promise((resolve) => {
      const client = io.connect(`http://${masterIP}:${process.env.CONTAINER_API_PORT}`, { transports: ['websocket'], reconnection: false, timeout: 2000 });
      resolve(client);
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getMasterWS - catch - error' });
    throw error;
  }
};

/**
 * Used for retrieving ip
 *
 * @param {string} ip
 * @param {string} port
 * @return {Promise} json
 */
const getMyIp = async (ip, port) => {
  try {
    return new Promise((resolve) => {
      const client = io.connect(`http://${ip}:${port}`, { transports: ['websocket', 'polling'], reconnection: false, timeout: 2000 });
      const timeout = setTimeout(() => {
                                         client.disconnect();
                                         resolve(null);
                                       }, 2000);
      client.on('connect_error',
                (reason) => {
                              Logger.apiLogger.error(`>> ${reason}`, { label: 'flux.function - getMyIp - client.on - connect_error - reason' });
                              clearTimeout(timeout);
                              resolve(null);
                            });
      client.emit('getMyIp',
                  (response) => {
                                  client.disconnect();
                                  clearTimeout(timeout);
                                  resolve(response.message);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getMyIp - catch - error' });
    return null;
  }
};

/**
 * Used to get status
 *
 * @param {string} ip
 * @param {string} port
 * @return {Promise} json
 */
const getStatus = async (ip, port) => {
  try {
    return new Promise((resolve) => {
      const client = io.connect(`http://${ip}:${port}`, { transports: ['websocket', 'polling'], reconnection: false, timeout: 2000 });
      const timeout = setTimeout(() => {
                                         client.disconnect();
                                         resolve(null);
                                       }, 2000);
      client.on('connect_error',
                (reason) => {
                              Logger.apiLogger.error(`>> ${reason}`, { label: 'flux.function - getStatus - client.on - connect_error - reason' });
                              clearTimeout(timeout);
                              resolve(null);
                            });
      client.emit('getStatus',
                  (response) => {
                                  client.disconnect();
                                  clearTimeout(timeout);
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getStatus - catch - error' });
    return null;
  }
};

/**
 * Used to get backlog for db
 *
 * @param {string} index
 * @param {socket} socket
 * @return {Promise} json
 */
const getBackLog = async (index, socket) => {
  try {
    return new Promise((resolve) => {
      socket.emit('getBackLog',
                  index,
                  (response) => {
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getBackLog - catch - error' });
    return null;
  }
};

/**
 * Used for retrieving keys
 *
 * @param {socket} socket
 * @return {Promise} json
 */
const getKeys = async (socket) => {
  try {
    return new Promise((resolve) => {
      socket.emit('getKeys',
                  (response) => {
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - getKeys - catch - error' });
    return null;
  }
};

/**
 * Used for retrieving shared keys
 *
 * @param {string} pubKey
 * @param {socket} socket
 * @return {Promise} json
 */
const shareKeys = async (pubKey, socket) => {
  try {
    return new Promise((resolve) => {
      socket.emit('shareKeys',
                  pubKey,
                  (response) => {
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - shareKeys - catch - error' });
    return null;
  }
};

/**
 * Used for update keys
 *
 * @param {string} key
 * @param {socket} socket
 * @return {Promise} json
 */
const updateKey = async (key, value, socket) => {
  try {
    return new Promise((resolve) => {
      socket.emit('updateKey',
                  key,
                  value,
                  (response) => {
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - updateKey - catch - error' });
    return null;
  }
};

/**
 * Used to reset master
 *
 * @param {string} ip
 * @param {string} port
 * @return {Promise} json
 */
const resetMaster = async (ip, port) => {
  try {
    return new Promise((resolve) => {
      const client = io.connect(`http://${ip}:${port}`, { transports: ['websocket', 'polling'], reconnection: false, timeout: 2000 });
      const timeout = setTimeout(() => {
                                         Logger.apiLogger.info('connection timed out');
                                         client.disconnect();
                                         resolve(null);
                                       }, 2000);
      client.on('connect_error',
                (reason) => {
                              Logger.apiLogger.error(`>> ${reason}`, { label: 'flux.function - resetMaster - client.on - connect_error - reason' });
                              clearTimeout(timeout);
                              resolve(null);
                            });
      client.emit('resetMaster',
                  (response) => {
                                  client.disconnect();
                                  clearTimeout(timeout);
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - resetMaster - catch - error' });
    return null;
  }
};

/**
 * Used to ask db query
 *
 * @param {string} index
 * @param {socket} socket
 * @return {Promise} json
 */
const askQuery = async (index, socket) => {
  try {
    return new Promise((resolve) => {
      socket.emit('askQuery',
                  index,
                  (response) => {
                                  Logger.apiLogger.info(JSON.stringify(response), 'magenta');
                                  resolve(response);
                                });
    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'flux.function - askQuery - catch - error' });
    return null;
  }
};

module.exports = {
  getApplicationSpecs,
  getApplicationOwner,
  getApplicationIP,
  getMaster,
  getMasterWS,
  getMyIp,
  getStatus,
  getBackLog,
  getKeys,
  shareKeys,
  updateKey,
  resetMaster,
  askQuery
};
