'use strict';

const {
  validationCheck,
  verifyFields,
  verifyParams,
  verifyQuery,
  verify
} = require('../middlewares');
const DBActionsService = require('../services/db-actions.service');

module.exports = (app) => {
  app.get('/api/status',
          [],
          DBActionsService.status);

  app.get('/api/node',
          [
            verify.authUser
          ],
          DBActionsService.getAllNodes);

  app.post('/api/server/rollback',
           [
             verifyQuery.querySeqNo,
             validationCheck.validationResultCheck,
             verify.authUser
           ],
           DBActionsService.rollback);

  app.post('/api/backup-file/generate',
           [
             verify.authUser
           ],
           DBActionsService.backupFileGenerate);

  app.post('/api/backup-file/upload',
           [
             verify
           ],
           DBActionsService.backupFileUpload);

  app.post('/api/backup-file/execute',
           [
             verifyFields.bodyFilename,
             validationCheck.validationResultCheck,
             verify.authUser
           ],
           DBActionsService.backupFileExecute);

  app.get('/api/backup-file/:filename',
          [
            verifyParams.paramFilename,
            validationCheck.validationResultCheck,
            verify.authUser
          ],
          DBActionsService.getBackupFileByFilename);

  app.get('/api/backup-file',
          [
            verify.authUser
          ],
          DBActionsService.getAllBackupFile);

  app.delete('/api/backup-file/:filename',
             [
               verifyParams.paramFilename,
               validationCheck.validationResultCheck,
               verify.authUser
             ],
             DBActionsService.deleteBackupFileByFilename);
};
