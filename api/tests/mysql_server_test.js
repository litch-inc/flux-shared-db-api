'use strict';

const net = require('net');
const mysql = require('mysql2/promise');

const DBClientClass = require('../classes/db-client.class');
const MySQLServerClass = require('../classes/mysql-server.class');
const MySQLConstant = require('../constants/mysql.contant');

let localDBClient = null;
let appDBClient = null;

async function init() {
  localDBClient = await DBClientClass.createDBClient();
  appDBClient = await mysql.createConnection({
    password: 'secret',
    port: 3307,
    host: 'localhost'
  });
}

function handleAuthorize(param) {
  console.log('Auth Info:');
  console.log(param);
  // Yup you are authorized
  return true;
}

function handleQuery(result) {
  // Take the query, print it out
  this.sendPacket(result);
}

async function handleCommand({ command, extra }) {
  // command is a numeric ID, extra is a Buffer
  switch (command) {
    case MySQLConstant.COM_QUERY:
      console.log(`Got query: ${extra.toString()}`);
      this.localDBClient.setSocket(this.socket);
      await this.localDBClient.query(extra.toString(), true);
      break;
    case MySQLConstant.COM_PING:
      this.sendOK({ message: 'OK' });
      break;
    case null:
    case undefined:
    case MySQLConstant.COM_QUIT:
      console.log('Disconnecting');
      this.end();
      break;
    case MySQLConstant.COM_INIT_DB:
      await this.localDBClient.query(`use ${extra}`);
      console.log(`extra is ${extra}`);
      this.sendOK({ message: 'OK' });
      break;
    default:
      console.log(`Unknown Command: ${command}`);
      this.sendError({ message: 'Unknown Command' });
      break;
  }
}

net.createServer((so) => {
  const server = MySQLServerClass.createServer({
                                                 socket: so,
                                                 onAuthorize: handleAuthorize,
                                                 onCommand: handleCommand,
                                                 localDBClient
                                               });
}).listen(3307);

console.log('Started server on port 3307');

init();
