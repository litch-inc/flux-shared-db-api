'use strict';

const memoryCache = require('memory-cache');
const timer = require('timers/promises');

async function test() {
  memoryCache.put('1', '1', 700);
  await timer.setTimeout(500);
  memoryCache.put('1', '1', 700);
  console.log(memoryCache.get(1));
  await timer.setTimeout(500);
  console.log(memoryCache.get(1));
  console.log(memoryCache.size());
}

test();
