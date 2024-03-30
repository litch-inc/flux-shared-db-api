'use strict';

module.exports = {
  MISSING_CONNECTION_CONFIG: 'Expected to be given `connection` options.',
  MISSING_CONNECTION_HOST: 'Expected to be given `host` connection option.',
  MISSING_CONNECTION_DATABASE: 'Expected to be given `database` connection option.',
  MISSING_CONNECTION_USER: 'Expected to be given `user` connection option.',
  MISSING_CONNECTION_PASSWORD: 'Expected to be given `password` connection option.',
  GEOMETRY_CONSTRUCTORS: {
    1: 'POINT',
    2: 'LINESTRING',
    3: 'POLYGON',
    4: 'MULTIPOINT',
    5: 'MULTILINESTRING',
    6: 'MULTIPOLYGON',
    7: 'GEOMETRYCOLLECTION'
  },
  DB_NULL: 'NULL',
  COLUMN_TYPE_BIT: 'BIT',
  COLUMN_TYPE_GEOMETRY: 'GEOMETRY',
  COLUMN_TYPE_HEX: 'HEX',
  COLUMN_TYPE_NUMBER: 'NUMBER',
  COLUMN_TYPE_STRING: 'STRING',
  HEADER_VARIABLES: [
    // Add commands to store the client encodings used when importing and set to UTF8 to preserve data
    '/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;',
    '/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;',
    '/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;',
    '/*!40101 SET NAMES utf8 */;',
    // Add commands to disable foreign key checks
    '/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;',
    "/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;",
    '/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;',
    ''
  ].join('\n'),
  FOOTER_VARIABLES: [
    '/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;',
    '/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;',
    '/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;',
    '/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;',
    '/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;',
    '/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;',
    ''
  ].join('\n'),
  BIT_TYPES: [
    'bit'
  ],
  GEOMETRY_TYPES: [
    'point',
    'linestring',
    'polygon',
    'multipoint',
    'multilinestring',
    'multipolygon',
    'geometrycollection'
  ],
  HEX_TYPES: [
    'blob',
    'tinyblob',
    'mediumblob',
    'longblob',
    'binary',
    'varbinary'
  ],
  NUMBER_TYPES: [
    'integer',
    'int',
    'smallint',
    'tinyint',
    'mediumint',
    'bigint',
    'decimal',
    'numeric',
    'float',
    'double',
    'real'
  ],
  STRING_TYPES: [
    'date',
    'datetime',
    'timestamp',
    'time',
    'year',
    'char',
    'varchar',
    'text',
    'mediumtext',
    'longtext',
    'tinytext',
    'set',
    'enum',
    'json'
  ],
  DEFAULT_OPTIONS: {
    connection: {
      host: 'localhost',
      port: 3306,
      user: '',
      password: '',
      database: '',
      charset: 'UTF8_GENERAL_CI',
      ssl: null
    },
    dump: {
      tables: [],
      excludeTables: false,
      schema: {
        format: true,
        autoIncrement: true,
        engine: true,
        table: {
          ifNotExist: true,
          dropIfExist: false,
          charset: true
        },
        view: {
          createOrReplace: true,
          algorithm: false,
          definer: false,
          sqlSecurity: false
        }
      },
      data: {
        format: true,
        verbose: true,
        lockTables: false,
        includeViewData: false,
        where: {},
        returnFromFunction: false,
        maxRowsPerInsertStatement: 1
      },
      trigger: {
        delimiter: ';;',
        dropIfExist: true,
        definer: false
      }
    },
    dumpToFile: null
  }
};
