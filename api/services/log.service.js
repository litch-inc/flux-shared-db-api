'use strict';

const BacklogClass = require('../classes/backlog.class');
const AppLogLevelEnum = require('../enums/app-log-level.enum');
const DataCheckerFunction = require('../functions/data-checker.function');
const Logger = require('../utils/logger');

exports.post = async (request, response) => {
  try {
    if (DataCheckerFunction.notUndefOrNull(request.body.message)
        && DataCheckerFunction.notUndefOrNull(request.body.timestamp)
        && DataCheckerFunction.notUndefOrNull(request.body.level)
        && DataCheckerFunction.notUndefOrNull(request.body.additional)
        && Array.isArray(request.body.additional)
        && (request.body.additional.length > 0)
        && DataCheckerFunction.notUndefOrNull(request.body.additional[0].label)) {
      const requestBody = request.body;
      const message = JSON.stringify(requestBody.message, null, 4);
      const other = { timestamp: requestBody.timestamp, label: requestBody.additional[0].label };

      switch (requestBody.level) {
        case AppLogLevelEnum.INFO: {
          Logger.appLogger.info(message, other);
          break;
        }
        case AppLogLevelEnum.DEBUG: {
          Logger.appLogger.debug(message, other);
          break;
        }
        case AppLogLevelEnum.WARN: {
          Logger.appLogger.warn(message, other);
          break;
        }
        case AppLogLevelEnum.ERROR: {
          Logger.appLogger.error(message, other);
          break;
        }
        default: {
          break;
        }
      }

      response.status(200).send(true);
    } else {
      response.status(500).send(false);
    }
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'log.service - post - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.getBacklogsByDateRange = async (request, response) => {
  try {
    const backlogsByDateRange = await BacklogClass.getDateRange();

    response.status(200).send(backlogsByDateRange);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'log.service - getBacklogsByDateRange - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};

exports.getBacklogsByTime = async (request, response) => {
  try {
    const backlogsByTime = BacklogClass.getBacklogsByTime(request.query.startTime, request.query.logsLength);

    // deepcode ignore HTTPSourceWithUncheckedType: <false positive middleware validation tests query values>,
    // deepcode ignore XSS: <false positive middleware validation tests query values>
    response.status(200).send(backlogsByTime);
  } catch (error) {
    Logger.apiLogger.error(`>> ${error}`, { label: 'log.service - getBacklogsByTime - catch - error' });
    response.status(500).send({ message: 'Server error prevented completion' });
  }
};
