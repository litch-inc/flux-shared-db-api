'use strict';

const fs = require('fs');
const path = require('path');

const Logger = require('../utils/logger');

/**
 * Returns list of sql file objects
 *
 * @return {object} { fileName, fileSize, createdDateTime }
 */
const getAllBackupFile = () => {
  try {
    const folderPath = './dumps/';
    const files = fs.readdirSync(folderPath);

    return files.filter((file) => path.extname(file) === '.sql')
                .map((file) => {
                  const filePath = path.join(folderPath, file);
                  const fileStats = fs.statSync(filePath);

                  return {
                    fileName: file,
                    fileSize: fileStats.size, // in bytes
                    createdDateTime: fileStats.birthtime // creation date/time
                  };
                });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.function - getAllBackupFile - catch - error' });
    return [];
  }
};

/**
 * Deletes a backup file and returns boolean true is successful
 *
 * @param {string} fileName
 * @return {boolean}
 */
const deleteBackupFile = (fileName) => {
  try {
    fs.unlinkSync(`./dumps/${fileName}.sql`);
    Logger.apiLogger.info(`File "${fileName}.sql" has been deleted.`, { label: 'backlog.function - deleteBackupFile - try' });

    return true;
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'backlog.function - deleteBackupFile - catch - error' });

    return false;
  }
};

module.exports = {
  getAllBackupFile,
  deleteBackupFile
};
