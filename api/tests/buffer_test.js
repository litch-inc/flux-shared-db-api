'use strict';

const memoryCache = require('memory-cache');

const Logger = require('../utils/logger');

const request = {
  query: 'select * from table',
  sequenceNumber: 123,
  timestamp: 1231343214313
};

memoryCache.put(123, request);

console.log(memoryCache.get(122 + 1));
console.log(memoryCache.get(122));
console.log(memoryCache.size());
console.log(memoryCache.del(122 + 1));
console.log(memoryCache.size());

memoryCache.put(123, request);
memoryCache.clear();

console.log(memoryCache.size());

Logger.apiLogger.error('tttt', { class: 't' });
