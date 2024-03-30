'use strict';

const { App } = require('uWebSockets.js');
const { Server } = require('socket.io');

const FluxFunction = require('../functions/flux.function');
const UtilityFunction = require('../functions/utility.function');

function startServer() {
  const io = new Server();
  const app = new App();
  io.attachApp(app);
  io.on('connection', async (socket) => {
    socket.on('getStatus', async (callback) => {
      callback({ status: 'success', message: UtilityFunction.convertIP(socket.handshake.address) });
    });
  });

  app.listen(3002, (token) => {
    if (!token) {
      console.log(`port ${3002} already in use`);
    }
  });
}

async function testClient() {
  console.log(await FluxFunction.getStatus('localhost', 3002));
}

startServer();
testClient();
