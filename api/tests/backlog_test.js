'use strict';

const BacklogClass = require('../classes/backlog.class');

async function test() {
  await BacklogClass.pushQuery('SELECT * FROM TEST', 1);
  // await BacklogClass.destroyBacklog();
  await BacklogClass.createBacklog();
  await BacklogClass.pushQuery('SELECT * FROM TEST', 1);
  await BacklogClass.pushQuery('SELECT * FROM TEST1', 2);
  await BacklogClass.pushQuery('SELECT * FROM TEST2', 3);
  await BacklogClass.pushQuery('SELECT * FROM TEST3', 4);
  await BacklogClass.pushQuery('SELECT * FROM TEST4', 5);
  const logs = await BacklogClass.getLogs(0, 5);
  console.log(JSON.stringify(logs));
  const lastSeq = await BacklogClass.getLastSequenceNumber();
  console.log(`last sequence number is: ${lastSeq}`);
  const totalLogs = await BacklogClass.getTotalLogsCount();
  console.log(`total logs: ${totalLogs}`);
  await BacklogClass.clearBuffer();
  // await BacklogClass.clearLogs();
}

test();
