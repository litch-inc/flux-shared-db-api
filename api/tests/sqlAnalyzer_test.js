'use strict';

const fs = require('fs');

const MySQLAnalyzerFunction = require('../functions/mysql-analyzer.function');

console.log(MySQLAnalyzerFunction('select * from table;', 'mysql'));

try {
    const queries = fs.readFileSync('./tests/sql/test.sql', 'utf8');
    console.log(MySQLAnalyzerFunction(queries, 'mysql'));
  } catch (err) {
    console.error(err);
  }
