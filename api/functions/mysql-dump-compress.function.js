'use strict';

const fs = require('fs');
const zlib = require('zlib');

const Logger = require('../utils/logger');

/**
 * Used for deleting a file
 *
 * @param {file} file
 */
const deleteFile_ = (file) => {
  try {
    fs.unlinkSync(file);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-compress.function - deleteFile_ - catch - error' });
  }
};

/**
 * Used to compress a file
 *
 * @param {string} filename
 * @return {Promise}
 */
const compressFile = (filename) => {
  const tempFilename = `${filename}.temp`;
  fs.renameSync(filename, tempFilename);
  try {
    const read = fs.createReadStream(tempFilename);
    const zip = zlib.createGzip();
    const write = fs.createWriteStream(filename);
    read.pipe(zip).pipe(write);

    return new Promise((resolve, reject) => {
      write.on('error',
               (error) => {
                            Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-dump-compress - compressFile - try - Promise - write.on - error' });
                            // close the write stream and propagate the error
                            write.end();
                            reject(error);
                          });
      write.on('finish',
               () => {
                       resolve();
                     });
    });
  } catch (error) {
    // in case of an error: remove the output file and propagate the error
    deleteFile_(filename);
    throw error;
  } finally {
    // in any case: remove the temp file
    deleteFile_(tempFilename);
  }
};

module.exports = {
  compressFile
};
