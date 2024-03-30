'use strict';

/**
 * mysql-import - v5.0.26
 * Import .sql into a MySQL database with Node.
 * @author Rob Parham
 * @website https://github.com/pamblam/mysql-import
 * @license MIT
 */

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const MySQLQueryParserClass = require('./mysql-query-parser.class');
const MySQLConstant = require('../constants/mysql.contant');
const DataCheckerFunction = require('../functions/data-checker.function');
const MySQLImporterFunction = require('../functions/mysql-importer.function');
const Logger = require('../utils/logger');

class MySQLImporterClass {
  #connectionSettings;
  #connection;
  #encoding;
  #imported;
  #totalFiles;
  #currentFileNumber;
  #progressCB;
  #dumpCompletedCB;

  /**
   * Creates an instance of MySQLImporterClass.
   *
   * @param {{ callback, serverSocket }} settings
   *    settings.callback: function
   *    settings.serverSocket: OperatorClass.serverSocket
   * @memberof MySQLImporterClass
   */
  constructor(settings) {
    this.callback = (DataCheckerFunction.notUndefOrNull(settings.callback))
                      ? settings.callback
                      : null;
    this.serverSocket = (DataCheckerFunction.notUndefOrNull(settings.serverSocket))
                          ? settings.serverSocket
                          : null;
    this.#connectionSettings = settings;
    this.#connection = null;
    this.#encoding = MySQLConstant.DEFAULT_IMPORTER_ENCODING;
    this.#imported = [];
    this.#totalFiles = 0;
    this.#currentFileNumber = 0;
    this.#progressCB = () => {};
    this.#dumpCompletedCB = () => {};
  }

  /**
   * Get an array of the imported files
   *
   * @return {file[]}
   * @memberof MySQLImporterClass
   */
  getImported() {
    return this.#imported.slice(0);
  }

  /**
   * Set the encoding to be used for reading the dump files.
   *
   * @param {string} encoding
   * @memberof MySQLImporterClass
   */
  setEncoding(encoding) {
    if (MySQLConstant.IMPORTER_SUPPORTED_ENCODINGS.includes(encoding)) {
      this.#encoding = encoding;
    } else {
      throw Error(`Unsupported encoding: ${encoding}`);
    }
  }

  /**
   * Set a progress callback
   *
   * @param {{ totalFiles, currentFileNumber, bytesProcessed, totalBytes, filePath }} cb
   *    cb.totalFiles: The total files in the queue.
   *    cb.currentFileNumber: The number of the current dump file in the queue.
   *    cb.bytesProcessed: The number of bytes of the file processed.
   *    cb.totalBytes: The size of the dump file.
   *    cb.filePath: The full path to the dump file.
   * @memberof MySQLImporterClass
   */
  onProgress(cb) {
    if (typeof cb === 'function') {
      this.#progressCB = cb;
    } else {
      // do nothing
    }
  }

  /**
   * Set a progress callback
   *
   * @param {{ totalFiles, currentFileNumber, filePath }} cb
   *   cb.totalFiles: The total files in the queue.
   *   cb.currentFileNumber: The number of the current dump file in the queue.
   *   cb.filePath: The full path to the dump file.
   * @memberof MySQLImporterClass
   */
  onDumpCompleted(cb) {
    if (typeof cb === 'function') {
      this.#dumpCompletedCB = cb;
    } else {
      // do nothing
    }
  }

  /**
   * Import (an) .sql file(s).
   *
   * @param {file[]} input
   * @return {Promise}
   * @memberof MySQLImporterClass
   */
  import(...input) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await this.connect();
          const files = await this.getSQLFilePaths(...input);
          this.#totalFiles = files.length;
          this.#currentFileNumber = 0;
          let errorCopy = null;

          files.forEach(async (file) => {
                                          let errorCopyClone = errorCopy;
                                          await new Promise((next) => {
                                              this.#currentFileNumber++;
                                              if (DataCheckerFunction.notUndefOrNull(errorCopyClone)) {
                                                next();
                                                return;
                                              } else {
                                                // do nothing
                                              }

                                              this.#importSingleFile(file, this.callback, this.serverSocket)
                                                  .then(() => {
                                                                next();
                                                              })
                                                  .catch((error) => {
                                                                      errorCopyClone = error;
                                                                      next();
                                                                    });
                                            });
                                          errorCopy = errorCopyClone;
                                        });

          if (DataCheckerFunction.notUndefOrNull(errorCopy)) {
            throw errorCopy;
          } else {
            resolve();
          }
        } catch (error) {
          Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - Importer - import - Promise - catch - error' });
          reject(error);
        }
      })();
    });
  }

  /**
   * Set or change the database to be used
   *
   * @param {*} database
   * @return {Promise}
   * @memberof MySQLImporterClass
   */
  use(database) {
    return new Promise((resolve, reject) => {
      if (DataCheckerFunction.isUndefOrNull(this.#connection)) {
        this.#connectionSettings.database = database;
        resolve();
      } else {
		    this.#connection.changeUser({ database }, (error) => {
          if (DataCheckerFunction.notUndefOrNull(error)) {
			      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - Importer - use - Promise - #connection.changeUser - error' });
			      reject(error);
          } else {
			      resolve();
          }
		    });
      }
    });
  }

  /**
   * Connect to the mysql server
   *
   * @return {Promise}
   * @memberof MySQLImporterClass
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (DataCheckerFunction.notUndefOrNull(this.#connection)) {
        resolve(this.#connection);
      } else {
        this.#connection = mysql.createConnection(this.#connectionSettings);
        this.#connection.connect((error) => {
                                              if (DataCheckerFunction.notUndefOrNull(error)) {
                                                Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - Importer - #connect - Promise - connection.connect - error' });
                                                reject(error);
                                              } else {
                                                resolve();
                                              }
                                            });
      }
    });
  }

  /**
   * Disconnect mysql. This is done automatically, so shouldn't need to be manually called.
   *
   * @param {boolean} [graceful=true]
   * @return {Promise}
   * @memberof MySQLImporterClass
   */
  disconnect(graceful = true) {
    return new Promise((resolve, reject) => {
      if (DataCheckerFunction.isUndefOrNull(this.#connection)) {
        resolve();
      } else if (graceful) {
        this.#connection.end((error) => {
                                          if (DataCheckerFunction.notUndefOrNull(error)) {
                                            Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - Importer - disconnect - Promise - #connection.end - error' });
                                            reject(error);
                                          } else {
                                            this.#connection = null;
                                            resolve();
                                          }
                                        });
      } else {
        this.#connection.destroy();
        resolve();
      }
    });
  }

  /**
   * Parses the input argument(s) for Importer.import into an array sql files.
   *
   * @param {string[]} filePaths
   * @return {Promise}
   * @memberof MySQLImporterClass
   */
  getSQLFilePaths(...filePaths) {
    return new Promise((resolve, reject) => {
      (async () => {
        const fullPaths = [];
        let errorCopy = null;
        const newFilePaths = [].concat([], ...filePaths); // flatten array of filePaths

        newFilePaths.forEach(async (filepath) => {
                                                   let errorCopyClone = errorCopy;
                                                   await new Promise((next) => {
                                                     (async () => {
                                                       if (DataCheckerFunction.notUndefOrNull(errorCopyClone)) {
                                                         next();
                                                         return;
                                                       } else {
                                                         // do nothing
                                                       }

                                                       try {
                                                         await MySQLImporterFunction.fileExists(filepath);
                                                         const statFile = await MySQLImporterFunction.statFile(filepath);
                                                         if (statFile.isFile()) {
                                                           if (filepath.extname(statFile) === '.sql') {
                                                             fullPaths.push({
                                                                              file: path.resolve(filepath),
                                                                              size: statFile.size
                                                                            });
                                                           } else {
                                                             // do nothing
                                                           }

                                                           next();
                                                         } else if (statFile.isDirectory()) {
                                                           let morePaths = await MySQLImporterFunction.readDir(filepath);
                                                           morePaths = morePaths.map((p) => path.join(filepath, p));
                                                           const sqlFiles = await this.getSQLFilePaths(...morePaths);
                                                           fullPaths.push(...sqlFiles);
                                                           next();
                                                         } else {
                                                           next();
                                                         }
                                                       } catch (error) {
                                                         errorCopyClone = error;
                                                         next();
                                                       }
                                                     })();
                                                   });
                                                   errorCopy = errorCopyClone;
                                                 });

        if (DataCheckerFunction.notUndefOrNull(errorCopy)) {
          Logger.apiLogger.error(`>> ${errorCopy}`, { label: 'mysql-import - Importer - async getSQLFilePaths - Promise - error' });
          reject(errorCopy);
        } else {
          resolve(fullPaths);
        }
      })();
    });
  }

  /**
   * Import a single .sql file into the database
   *
   * @param {{ file, size }} fileObj
   *    fileObj.file: The full path to the file
   *    fileObj.size: The size of the file in bytes
   * @param {function} callback
   * @param {OperatorClass.serverSocket} serverSocket
   * @return {Promise}
   * @memberof MySQLImporterClass
   */
  #importSingleFile(fileObj, callback, serverSocket) {
    return new Promise((resolve, reject) => {
      const parser = new MySQLQueryParserClass({
                                                 callback,
                                                 serverSocket,
                                                 connection: this.#connection,
                                                 encoding: this.#encoding,
                                                 onProgress: (progress) => {
                                                                             this.#progressCB({
                                                                                                totalFiles: this.#totalFiles,
                                                                                                currentFileNumber: this.#currentFileNumber,
                                                                                                bytesProcessed: progress,
                                                                                                totalBytes: fileObj.size,
                                                                                                filePath: fileObj.file
                                                                                              });
                                                                           }
                                               });
      const dumpCompletedCB = (error) => this.#dumpCompletedCB({
                                                                 totalFiles: this.#totalFiles,
                                                                 currentFileNumber: this.#currentFileNumber,
                                                                 filePath: fileObj.file,
                                                                 error
                                                               });
      parser.on('finish', () => {
                                  this.#imported.push(fileObj.file);
                                  dumpCompletedCB(null);
                                  resolve();
                                });

      parser.on('error', (error) => {
                                      Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - Importer - #importSingleFile - Promise - parser.on - error' });
                                      dumpCompletedCB(error);
                                      reject(error);
                                    });

      const readerStream = fs.createReadStream(fileObj.file);
      readerStream.setEncoding(this.#encoding);

      readerStream.on('error', (error) => {
                                            Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - Importer - #importSingleFile - Promise - readerStream.on - error' });
                                            dumpCompletedCB(error);
                                            reject(error);
                                          });
      readerStream.pipe(parser);
    });
  }
}

module.exports = MySQLImporterClass;
