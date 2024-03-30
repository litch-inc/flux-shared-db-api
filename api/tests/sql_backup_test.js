'use strict';

const BacklogClass = require('../classes/backlog.class');
const SecurityClass = require('../classes/security.class');
const BacklogFunction = require('../functions/backlog.function');

async function test() {
  await BacklogClass.dumpBackup();
  await BacklogFunction.deleteBackupFile('BU_1695997497871');
  console.log(await BacklogFunction.getAllBackupFile());
}

SecurityClass.init();

test();
