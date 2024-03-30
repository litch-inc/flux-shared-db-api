'use strict';

const fs = require('fs');

const DataCheckerFunction = require('./data-checker.function');
const Logger = require('../utils/logger');

/**
 * Check if a file exists
 *
 * @param string filepath
 * @returns {Promise}
 */
// eslint-disable-next-line arrow-body-style
const fileExists = async (filepath) => {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.F_OK, (error) => {
      if (DataCheckerFunction.notUndefOrNull(error)) {
        Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-importer.- Importer - async fileExists - Promise - fs.access - error' });
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Get filetype information
 *
 * @param string filepath
 * @returns {Promise}
 */
// eslint-disable-next-line arrow-body-style
const statFile = async (filepath) => {
  return new Promise((resolve, reject) => {
    fs.lstat(filepath, (error, stat) => {
      if (DataCheckerFunction.notUndefOrNull(error)) {
        Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-importer.- Importer - async statFile - Promise - fs.lstat - error' });
        reject(error);
      } else {
        resolve(stat);
      }
    });
  });
};

/**
 * Read contents of a directory
 *
 * @param string filepath
 * @returns {Promise}
 */
// eslint-disable-next-line arrow-body-style
const readDir = async (filepath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(filepath, (error, files) => {
      if (error) {
        Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-importer.- Importer - async readDir - Promise - fs.readdir - error' });
        reject(DataCheckerFunction.notUndefOrNull(error));
      } else {
        resolve(files);
      }
    });
  });
};

module.exports = {
  fileExists,
  statFile,
  readDir
};
