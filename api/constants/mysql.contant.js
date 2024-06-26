'use strict';

/* eslint-disable no-bitwise */
module.exports = {
  MYSERVER_PACKET_COUNT: 0,
  MYSERVER_SOCKET: 1,
  MYSERVER_DATABASE: 4,
  MYSERVER_THREAD_ID: 5,
  MYSERVER_SCRAMBLE: 6,
  MYSERVER_DBH: 7,
  MYSERVER_PARSER: 8,
  MYSERVER_BANNER: 9,
  MYSERVER_SERVER_CHARSET: 10,
  MYSERVER_CLIENT_CHARSET: 11,
  MYSERVER_SALT: 12,

  FIELD_CATALOG: 0,
  FIELD_DB: 1,
  FIELD_TABLE: 2,
  FIELD_ORG_TABLE: 3,
  FIELD_NAME: 4,
  FIELD_ORG_NAME: 5,
  FIELD_LENGTH: 6,
  FIELD_TYPE: 7,
  FIELD_FLAGS: 8,
  FIELD_DECIMALS: 9,
  FIELD_DEFAULT: 10,

  //
  // This comes from include/mysql_com.h of the MySQL source
  //

  CLIENT_LONG_PASSWORD: 1,
  CLIENT_FOUND_ROWS: 2,
  CLIENT_LONG_FLAG: 4,
  CLIENT_CONNECT_WITH_DB: 8,
  CLIENT_NO_SCHEMA: 16,
  CLIENT_COMPRESS: 32, // Must implement that one
  CLIENT_ODBC: 64,
  CLIENT_LOCAL_FILES: 128,
  CLIENT_IGNORE_SPACE: 256,
  CLIENT_PROTOCOL_41: 512,
  CLIENT_INTERACTIVE: 1024,
  CLIENT_SSL: 2048, // Must implement that one
  CLIENT_IGNORE_SIGPIPE: 4096,
  CLIENT_TRANSACTIONS: 8192,
  CLIENT_RESERVED: 16384,
  CLIENT_SECURE_CONNECTION: 32768,
  CLIENT_MULTI_STATEMENTS: 1 << 16,
  CLIENT_MULTI_RESULTS: 1 << 17,
  CLIENT_SSL_VERIFY_SERVER_CERT: 1 << 30,
  CLIENT_REMEMBER_OPTIONS: 1 << 31,

  SERVER_STATUS_IN_TRANS: 1,
  SERVER_STATUS_AUTOCOMMIT: 2,
  SERVER_MORE_RESULTS_EXISTS: 8,
  SERVER_QUERY_NO_GOOD_INDEX_USED: 16,
  SERVER_QUERY_NO_INDEX_USED: 32,
  SERVER_STATUS_CURSOR_EXISTS: 64,
  SERVER_STATUS_LAST_ROW_SENT: 128,
  SERVER_STATUS_DB_DROPPED: 256,
  SERVER_STATUS_NO_BACKSLASH_ESCAPES: 512,

  COM_SLEEP: 0,
  COM_QUIT: 1,
  COM_INIT_DB: 2,
  COM_QUERY: 3,
  COM_FIELD_LIST: 4,
  COM_CREATE_DB: 5,
  COM_DROP_DB: 6,
  COM_REFRESH: 7,
  COM_SHUTDOWN: 8,
  COM_STATISTICS: 9,
  COM_PROCESS_INFO: 10,
  COM_CONNECT: 11,
  COM_PROCESS_KILL: 12,
  COM_DEBUG: 13,
  COM_PING: 14,
  COM_TIME: 15,
  COM_DELAYED_INSERT: 16,
  COM_CHANGE_USER: 17,
  COM_BINLOG_DUMP: 18,
  COM_TABLE_DUMP: 19,
  COM_CONNECT_OUT: 20,
  COM_REGISTER_SLAVE: 21,
  COM_STMT_PREPARE: 22,
  COM_STMT_EXECUTE: 23,
  COM_STMT_SEND_LONG_DATA: 24,
  COM_STMT_CLOSE: 25,
  COM_STMT_RESET: 26,
  COM_SET_OPTION: 27,
  COM_STMT_FETCH: 28,
  COM_END: 29,

  // This is taken from include/mysql_com.h

  MYSQL_TYPE_DECIMAL: 0,
  MYSQL_TYPE_TINY: 1,
  MYSQL_TYPE_SHORT: 2,
  MYSQL_TYPE_LONG: 3,
  MYSQL_TYPE_FLOAT: 4,
  MYSQL_TYPE_DOUBLE: 5,
  MYSQL_TYPE_NULL: 6,
  MYSQL_TYPE_TIMESTAMP: 7,
  MYSQL_TYPE_LONGLONG: 8,
  MYSQL_TYPE_INT24: 9,
  MYSQL_TYPE_DATE: 10,
  MYSQL_TYPE_TIME: 11,
  MYSQL_TYPE_DATETIME: 12,
  MYSQL_TYPE_YEAR: 13,
  MYSQL_TYPE_NEWDATE: 14,
  MYSQL_TYPE_VARCHAR: 15,
  MYSQL_TYPE_BIT: 16,
  MYSQL_TYPE_NEWDECIMAL: 246,
  MYSQL_TYPE_ENUM: 247,
  MYSQL_TYPE_SET: 248,
  MYSQL_TYPE_TINY_BLOB: 249,
  MYSQL_TYPE_MEDIUM_BLOB: 250,
  MYSQL_TYPE_LONG_BLOB: 251,
  MYSQL_TYPE_BLOB: 252,
  MYSQL_TYPE_VAR_STRING: 253,
  MYSQL_TYPE_STRING: 254,
  MYSQL_TYPE_GEOMETRY: 255,

  NOT_NULL_FLAG: 1,
  PRI_KEY_FLAG: 2,
  UNIQUE_KEY_FLAG: 4,
  MULTIPLE_KEY_FLAG: 8,
  BLOB_FLAG: 16,
  UNSIGNED_FLAG: 32,
  ZEROFILL_FLAG: 64,
  BINARY_FLAG: 128,
  ENUM_FLAG: 256,
  AUTO_INCREMENT_FLAG: 512,
  TIMESTAMP_FLAG: 1024,
  SET_FLAG: 2048,
  NO_DEFAULT_VALUE_FLAG: 4096,
  NUM_FLAG: 32768,

  IMPORTER_SUPPORTED_ENCODINGS: [
    'utf8',
    'ucs2',
    'utf16le',
    'latin1',
    'ascii',
    'base64',
    'hex'
  ],
  DEFAULT_IMPORTER_ENCODING: 'utf8'
};
