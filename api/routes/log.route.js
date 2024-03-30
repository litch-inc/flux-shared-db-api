'use strict';

const {
  validationCheck,
  verifyLogApi,
  verifyQuery,
  verify
} = require('../middlewares');
const LogService = require('../services/log.service');

module.exports = (app) => {
  app.post('/api/log',
           [
             verifyLogApi.hashChecker
           ],
           LogService.post);

  app.get('/api/log/backlog/date-range',
          [
            verify.authUser
          ],
          LogService.getBacklogsByDateRange);

  app.get('/api/log/backlog/time',
          [
            verifyQuery.queryStartTime,
            verifyQuery.queryLogsLength,
            validationCheck.validationResultCheck,
            verify.authUser
          ],
          LogService.getBacklogsByTime);
};
