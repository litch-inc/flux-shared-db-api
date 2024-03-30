'use strict';

const path = require('path');
const sanitize = require('sanitize-filename');
const timer = require('timers/promises');

const BacklogClass = require('../classes/backlog.class');
const MySQLImporterClass = require('../classes/mysql-importer.class');
const OperatorClass = require('../classes/operator.class');
const BacklogFunction = require('../functions/backlog.function');
const DataCheckerFunction = require('../functions/data-checker.function');
const Logger = require('../utils/logger');

exports.status = (request, response) => {
  try {
    const status = {
      status: OperatorClass.status,
      sequenceNumber: BacklogClass.sequenceNumber,
      masterIP: OperatorClass.getMaster()
    };

    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Headers', 'X-Requested-With');
    response.status(200).send(status);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - status - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.getAllNodes = (request, response) => {
  try {
    const opNodes = OperatorClass.OpNodes;

    response.status(200).send(opNodes);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - getAllNodes - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.rollback = async (request, response) => {
  try {
    // deepcode ignore Sqli: <false positive middleware validation tests body values>
    await OperatorClass.rollBack(request.body.seqNo);

    response.status(200).send({ message: 'Success' });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - generatebackup - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.backupFileGenerate = async (request, response) => {
  try {
    await BacklogClass.dumpBackup();

    response.status(200).send();
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - backupFileGenerate - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

// deepcode ignore NoRateLimitingForExpensiveWebOperation: <false positive ratelimiting applied within server file>
exports.backupFileUpload = async (request, response) => {
  try {
    if (DataCheckerFunction.isUndefOrNull(request.files) || DataCheckerFunction.isUndefOrNull(request.files.sqlFile)) {
      response.status(400).send('No file uploaded.');
    }
    const uploadPath = path.join(__dirname, '../dumps/', request.files.sqlFile.sqlFile.name); // Adjust the destination folder as needed
    // Move the uploaded .sql file to the specified location
    request.files.sqlFile.mv(uploadPath,
                             (error) => {
                                          if (DataCheckerFunction.notUndefOrNull(error)) {
                                            Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - backupFileUpload - try - sqlFile.mv - error' });
                                            response.status(500).send('Error uploading file');
                                          } else {
                                            response.status(200).send({ message: 'Success' });
                                          }
                                        });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - backupFileUpload - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.backupFileExecute = async (request, response) => {
  try {
    // create a snapshot
    await BacklogClass.dumpBackup();
    // removing old db + resetting sequence numbers:
    await OperatorClass.rollBack(0);
    await timer.setTimeout(2000);
    const importer = new MySQLImporterClass({
                                              callback: OperatorClass.sendWriteQuery,
                                              serverSocket: OperatorClass.serverSocket
                                            });
    importer.onProgress((progress) => {
      const percent = Math.floor((progress.bytesProcessed / progress.totalBytes) * 10000) / 100;
      Logger.apiLogger.info(`${percent}% Completed`, 'cyan');
    });
    await importer.import(`./dumps/${sanitize(request.body.filename)}.sql`)
                  .then(async () => {
                                      const filesImported = importer.getImported();
                                      Logger.apiLogger.info(`${filesImported.length} SQL file(s) imported.`);
                                      response.status(200).send({ message: 'Success' });
                                    })
                  .catch((error) => {
                                      Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - backupFileExecute - try - importer.import - catch - error' });
                                      response.status(500).send(JSON.stringify(error));
                                    });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - backupFileExecute - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

// deepcode ignore NoRateLimitingForExpensiveWebOperation: <false positive ratelimiting applied within server file>
exports.getBackupFileByFilename = (request, response) => {
  try {
    const sanitizedFilename = sanitize(request.params.filename);

    response.download(path.join(__dirname, `../dumps/${sanitizedFilename}.sql`),
                      `${sanitize(request.params.filename)}.sql`,
                      (error) => {
                                   Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - executebackup - response.download - error' });
                                   // Handle errors, such as file not found
                                   response.status(500).send('File not found');
                                 });
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - getAllBackupFile - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.getAllBackupFile = (request, response) => {
  try {
    const backupFiles = BacklogFunction.getAllBackupFile();

    response.send(backupFiles);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - getAllBackupFile - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.deleteBackupFileByFilename = (request, response) => {
  try {
    const sanitizedFilename = sanitize(request.body.filename);
    const successful = BacklogFunction.deleteBackupFile(sanitizedFilename);

    if (successful) {
      response.status(200).send({ message: 'Success' });
    } else {
      response.status(500).send('Internal Server Error');
    }
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'db-actions.service - deleteBackupFileByFilename - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};
