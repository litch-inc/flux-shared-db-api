'use strict';

const DBClientClass = require('../classes/db-client.class');

async function test() {
  await DBClientClass.init();
  await DBClientClass.query('CREATE DATABASE test123;');
  await DBClientClass.setDBName('test123');
  await DBClientClass.query('CREATE TABLE pet (name VARCHAR(20), owner VARCHAR(20), species VARCHAR(20), sex CHAR(1), birth DATE, death DATE);');

  console.log(await DBClientClass.query('SHOW DATABASES;'));
  console.log(await DBClientClass.query('SHOW TABLES;'));
}

test();
