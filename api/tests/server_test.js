'use strict';

const FluxFunction = require('../functions/flux.function');

async function test() {
  console.log(await FluxFunction.getMaster('localhost', 7071));
  console.log(await FluxFunction.getMyIp('localhost', 7071));
}

test();
