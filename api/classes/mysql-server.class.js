'use strict';

const crypto = require('crypto');

const ConnectionPoolClass = require('./connection-pool.class');
const MySQLConstant = require('../constants/mysql.contant');
// const MySQLServerConstant = require('../constants/mysql-server.constant');
const DataCheckerFunction = require('../functions/data-checker.function');
const MySQLServerFunction = require('../functions/mysql-server.function');
const UtilityFunction = require('../functions/utility.function');
const Logger = require('../utils/logger');

/**
* [This Library emulates the MySQL server protocol, giving you the ability to create MySQL-like service]
*/
class MySQLServerClass {
  constructor(opts) {
    try {
      Object.assign(this, opts);

      if (DataCheckerFunction.isUndefOrNull(this.banner)) {
        this.banner = 'MySQL 8.3.0';
      } else {
        // do nothing
      }

      if (DataCheckerFunction.isUndefOrNull(this.salt)) {
        this.salt = crypto.randomBytes(20);
      } else {
        // do nothing
      }

      this.connId = null;
      this.sequence = 0;
      this.onPacket = this.#helloPacketHandler;
      this.incoming = [];

      this.#setupSocket();
      this.#sendServerHello();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysqlServer - MySQLServerClass - constructor - catch - error' });
    }
  }

  end() {
    try {
      this.socket.end();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysqlServer - MySQLServerClass - end - catch - error' });
    }
  }

  /**
   * Used for sending data to socket for write
   *
   * @param {Buffer} buffer
   * @memberof MySQLServerClass
   */
  sendPacket(buffer) {
    this.socket.write(buffer);
  }

  // /**
  //  *
  //  *
  //  * @param {*} definitions
  //  * @memberof MySQLServerClass
  //  */
  // sendDefinitions(definitions) {
  //   // Write Definition Header
  //   const buffer = Buffer.alloc(1024);
  //   let len = 4;
  //   len = MySQLServerFunction.writeLengthCodedBinary(buffer, len, definitions.length);
  //   this.#writeHeader(buffer, len);
  //   this.sendPacket(buffer.subarray(0, len));

  //   // Write each definition
  //   definitions.forEach((definition) => {
  //                                         len = 4;
  //                                         MySQLServerConstant.FIELDS.forEach((field) => {
  //                                                                                         const val = definition[field] || '';
  //                                                                                         len = MySQLServerFunction.writeLengthCodedString(buffer, len, val);
  //                                                                                       });
  //                                         len = buffer.writeUInt8(0x0C, len);
  //                                         len = buffer.writeUInt16LE(11, len); // ASCII
  //                                         len = buffer.writeUInt32LE(definition.columnLength || 0, len);
  //                                         len = buffer.writeUInt8(definition.columnType != null ? definition.columnType : MySQLConstant.MYSQL_TYPE_VAR_STRING, len);
  //                                         len = buffer.writeUInt16LE(definition.flags != null ? definition.flags : 0, len);
  //                                         len = buffer.writeUInt8(definition.decimals != null ? definition.decimals : 0, len);
  //                                         len = buffer.writeUInt16LE(0, len); // \0\0 FILLER
  //                                         len = MySQLServerFunction.writeLengthCodedString(buffer, len, definition.default);
  //                                         this.#writeHeader(buffer, len);
  //                                         this.sendPacket(buffer.subarray(0, len));
  //                                       });

  //   this.sendEOF();
  // }

  // sendRow(row) {
  //   const buffer = Buffer.alloc(1024);
  //   let len = 4;
  //   row.forEach((cell) => {
  //                           if (DataCheckerFunction.isUndefOrNull(cell)) {
  //                             len = buffer.writeUInt8(0xFB, len);
  //                           } else {
  //                             len = MySQLServerFunction.writeLengthCodedString(buffer, len, cell);
  //                           }
  //                         });
  //   this.#writeHeader(buffer, len);
  //   this.sendPacket(buffer.subarray(0, len));
  // }

  // sendRows(rows = []) {
  //   rows.forEach((row) => {
  //                           this.sendRow(row);
  //                         });
  //   this.sendEOF();
  // }

  // sendEOF({ warningCount = 0, serverStatus = MySQLConstant.SERVER_STATUS_AUTOCOMMIT }) {
  //   // Write EOF
  //   const buffer = Buffer.alloc(16);
  //   let len = 4;
  //   len = buffer.writeUInt8(0xFE, len);
  //   len = buffer.writeUInt16LE(warningCount, len);
  //   len = buffer.writeUInt16LE(serverStatus, len);
  //   this.#writeHeader(buffer, len);
  //   this.sendPacket(buffer.subarray(0, len));
  // }

  // eslint-disable-next-line object-curly-newline
  sendOK({ message, affectedRows = 0, insertId, warningCount = 0 }) {
    const data = Buffer.alloc(message.length + 64);
    let len = 4;
    len = data.writeUInt8(0, len);
    len = MySQLServerFunction.writeLengthCodedBinary(data, len, affectedRows);
    len = MySQLServerFunction.writeLengthCodedBinary(data, len, insertId);
    len = data.writeUInt16LE(MySQLConstant.SERVER_STATUS_AUTOCOMMIT, len);
    len = data.writeUInt16LE(warningCount, len);
    len = MySQLServerFunction.writeLengthCodedString(data, len, message);

    this.#writeHeader(data, len);
    this.sendPacket(data.subarray(0, len));
  }

  // eslint-disable-next-line object-curly-newline
  // sendRequestHeader({ fieldCount = 0, message, affectedRows = 0, insertId, warningCount = 0 }) {
  //   const data = Buffer.alloc(message.length + 64);
  //   let len = 4;
  //   len = data.writeUInt8(0, len);
  //   len = MySQLServerFunction.writeLengthCodedBinary(data, len, fieldCount);
  //   len = MySQLServerFunction.writeLengthCodedBinary(data, len, affectedRows);
  //   len = MySQLServerFunction.writeLengthCodedBinary(data, len, insertId);
  //   len = MySQLServerFunction.writeLengthCodedString(data, len, '');
  //   len = data.writeUInt16LE(MySQLConstant.SERVER_STATUS_AUTOCOMMIT, len);
  //   len = data.writeUInt16LE(warningCount, len);
  //   len = MySQLServerFunction.writeLengthCodedString(data, len, message);

  //   this.#writeHeader(data, len);
  //   this.sendPacket(data.subarray(0, len));
  // }

  // eslint-disable-next-line object-curly-newline
  sendError({ message = 'Unknown MySQL error', errno = 2000, sqlState = 'HY000' }) {
    // ## Sending Error ...
    const data = Buffer.alloc(message.length + 64);
    let len = 4;
    len = data.writeUInt8(0xFF, len);
    len = data.writeUInt16LE(errno, len);
    len += data.write('#', len);
    len += data.write(sqlState, len, 5);
    len += data.write(message, len);
    len = data.writeUInt8(0, len);

    this.#writeHeader(data, len);
    this.sendPacket(data.subarray(0, len));
  }

  #setupSocket() {
    this.socket.on('data', this.#handleData);

    this.socket.on('error',
                   (error) => {
                                Logger.apiLogger.error(`>> ${error}`, { label: 'mysqlServer - MySQLServerClass - constructor - try - socket.on - error' });
                                ConnectionPoolClass.releaseConnection(this.connId);
                                this.operator.sessionQueries[this.connId] = undefined;
                              });

    this.socket.on('end',
                   () => {
                           ConnectionPoolClass.releaseConnection(this.connId);
                           this.operator.sessionQueries[this.connId] = undefined;
                         });
  }

  #sendServerHello() {
    // ## Sending Server Hello...
    const buffer = Buffer.alloc(128);
    let pos = 4;
    pos = buffer.writeUInt8(10, pos); // Protocol version
    pos += buffer.write('8.0', pos);
    pos = buffer.writeUInt8(0, pos);
    pos = buffer.writeUInt32LE(process.pid, pos);
    pos += this.salt.copy(buffer, pos, 0, 8);
    pos = buffer.writeUInt8(0, pos);

    // deepcode ignore UsageOfUndefinedReturnValue: <false positive no values undefined>
    // eslint-disable-next-line no-bitwise
    const bufferValue = MySQLConstant.CLIENT_LONG_PASSWORD
                        | MySQLConstant.CLIENT_CONNECT_WITH_DB
                        | MySQLConstant.CLIENT_PROTOCOL_41
                        | MySQLConstant.CLIENT_SECURE_CONNECTION;
    pos = buffer.writeUInt16LE(bufferValue, pos);

    // TODO: ASK
    if (this.serverCharset) {
      pos = buffer.writeUInt8(this.serverCharset, pos);
    } else {
      pos = buffer.writeUInt8(0x21, pos); // latin1
    }
    pos = buffer.writeUInt16LE(MySQLConstant.SERVER_STATUS_AUTOCOMMIT, pos);
    buffer.fill(0, pos, pos + 13);
    pos += 13;
    pos += this.salt.copy(buffer, pos, 8);
    pos = buffer.writeUInt8(0, pos);

    this.#writeHeader(buffer, pos);
    this.sendPacket(buffer.subarray(0, pos));
  }

  // TODO: ASK
  async #helloPacketHandler(packet) {
    // ## Reading Client Hello...
    // http://dev.mysql.com/doc/internals/en/the-packet-header.html
    if (packet.length === 0) {
      this.sendError({ message: 'Zero length hello packet' });
    } else {
      // do nothing
    }

    // let ptr = 0;
    // const clientFlags = packet.subarray(ptr, ptr + 4);
    // ptr += 4;
    // const maxPacketSize = packet.subarray(ptr, ptr + 4);
    // ptr += 4;
    // this.clientCharset = packet.readUInt8(ptr);
    // ptr++;
    // packet.subarray(ptr, ptr + 23); // filler
    // ptr += 23;
    // const usernameEnd = packet.indexOf(0, ptr);
    // // const username = packet.toString('ascii', ptr, usernameEnd);
    // ptr = usernameEnd + 1;
    // const scrambleLength = packet.readUInt8(ptr);
    // ptr++;
    // if (scrambleLength > 0) {
    //   this.scramble = packet.subarray(ptr, ptr + scrambleLength);
    //   ptr += scrambleLength;
    // } else {
    //   // do nothing
    // }

    // let database;
    // const databaseEnd = packet.indexOf(0, ptr);
    // if (databaseEnd >= 0) {
    //   database = packet.toString('ascii', ptr, databaseEnd);
    // } else {
    //   // do nothing
    // }

    this.onPacket = null;
    const remoteIP = UtilityFunction.convertIP(this.socket.remoteAddress);

    // TODO: ASK
    // eslint-disable-next-line object-curly-newline
    try {
      // eslint-disable-next-line object-curly-newline
      const authorized = await Promise.resolve(this.onAuthorize({ remoteIP }));
      if (!authorized) {
        throw Error(`${remoteIP} Not Authorized`);
      } else {
        // do nothing
      }

      this.connId = ConnectionPoolClass.getFreeConnection(this.socket);
      this.onPacket = this.#normalPacketHandler;
      this.#gatherIncoming();
      this.sendOK({ message: 'OK' });
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysqlServer - MySQLServerClass - #helloPacketHandler - onAuthorize - catch - error' });
      this.socket.destroy();
    }
  }

  #normalPacketHandler(packet) {
    if (DataCheckerFunction.isUndefOrNull(packet)) {
      throw Error('Empty packet');
    } else {
      return this.onCommand({
                              command: packet.readUInt8(0),
                              extra: packet.length > 1 ? packet.subarray(1) : null,
                              id: this.connId,
                              instanceMySQLServerClass: this
                            });
    }
  }

  /**
   * Used for writing the header for server payload
   *
   * @param {Buffer} buffer
   * @param {number} len
   * @memberof MySQLServerClass
   */
  #writeHeader(buffer, len) {
    buffer.writeUIntLE(len - 4, 0, 3);
    buffer.writeUInt8(this.sequence++ % 256, 3);
  }

  #handleData(data) {
    try {
      if (DataCheckerFunction.notUndefOrNull(data) && Array.isArray(data) && (data.length > 0)) {
        this.incoming.push(data);
        this.#gatherIncoming();
      } else if (DataCheckerFunction.isUndefOrNull(data)) {
        Logger.apiLogger.info('Connection closed');
        this.socket.destroy();
      } else {
        // do nothing
      }
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysqlServer - MySQLServerClass - #handleData - catch - error' });
    }
  }

  #gatherIncoming() {
    try {
      let incoming;
      if (this.incoming.length > 0) {
        let len = 0;
        this.incoming.forEach((buf) => {
                                         len += buf.length;
                                       });
        incoming = Buffer.alloc(len);
        len = 0;
        this.incoming.forEach((buf) => {
                                         len += buf.copy(incoming, len);
                                       });
      } else {
        incoming = this.incoming[0];
      }

      const remaining = this.#readPackets(incoming);
      this.incoming = [Buffer.from(remaining)];
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'mysqlServer - MySQLServerClass - #gatherIncoming - catch - error' });
    }
  }

  #readPackets(buffer) {
    let offset = 0;
    while (true) {
      const data = buffer.subarray(offset);
      if (data.length < 4) {
        return data;
      }

      const packetLength = data.readUIntLE(0, 3);
      if (data.length < packetLength + 4) {
        return data;
      }

      this.sequence = data.readUIntLE(3, 1) + 1;
      offset += packetLength + 4;
      const packet = data.subarray(4, packetLength + 4);

      this.onPacket(packet);
      this.packetCount++;
    }
  }
}

exports.createServer = (options) => new MySQLServerClass(options);
