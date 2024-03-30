'use strict';

/**
 * mysql-import - v5.0.26
 * Import .sql into a MySQL database with Node.
 * @author Rob Parham
 * @website https://github.com/pamblam/mysql-import#readme
 * @license MIT#
 */

const stream = require('stream');

const MySQLConstant = require('../constants/mysql.contant');
const DataCheckerFunction = require('../functions/data-checker.function');
const Logger = require('../utils/logger');

class MySQLQueryParserClass extends stream.Writable {
	// The number of bytes processed so far
	#processedSize;
	// The progress callback
	#onProgress;
	// the encoding of the file being read
	#encoding;
	// the encoding of the database connection
	#connection;
	// The quote type (' or ") if the parser
	// is currently inside of a quote, else false
	#quoteType;
	// An array of chars representing the substring
	// the is currently being parsed
	#buffer;
	// Is the current char escaped
	#escaped;
	// The string that denotes the end of a query
	#delimiter;
	// Are we currently seeking new delimiter
	#seekingDelimiter;
	// Call back function to parent
	#callback;
	// Parent passed socket OperatorClass.serverSocket
	#serverSocket;

  constructor(options) {
  	super(options);

  	this.#processedSize = 0;
  	this.#onProgress = options.onProgress || (() => {});
  	this.#encoding = options.encoding || MySQLConstant.DEFAULT_IMPORTER_ENCODING;
  	this.#connection = options.connection;
  	this.#quoteType = false;
  	this.#buffer = [];
  	this.#escaped = false;
  	this.#delimiter = ';';
  	this.#seekingDelimiter = false;
		this.#callback = options.callback;
		this.#serverSocket = options.serverSocket;
  }

  /**
	 * Used for pipeing sql file data
	 *
	 * @param {*} chunk
	 * @param {*} _enc
	 * @param {*} next
	 * @memberof MySQLQueryParserClass
	 */
	async _write(chunk, _enc, next) {
		// eslint-disable-next-line no-param-reassign
  	chunk = chunk.toString(this.#encoding);
  	let errorCopy = null;
  	for (let i = 0; i < chunk.length; i++) {
  		const char = chunk[i];
  		const query = this.parseChar(char);
  		try {
  			if (DataCheckerFunction.notUndefOrNull(query)) {
					// eslint-disable-next-line no-await-in-loop
					await this.executeQuery(query);
				} else {
					// do nothing
				}
  		} catch (error) {
  			Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - queryParser - async write - catch - error' });
  			errorCopy = error;
  			break;
  		}
  	}

  	this.#processedSize += chunk.length;
  	this.#onProgress(this.#processedSize);
  	next(errorCopy);
  }

  /**
	 * Execute a query, return a Promise
	 *
	 * @param {string} query
	 * @return {callback | Promise}
	 * @memberof MySQLQueryParserClass
	 */
	async executeQuery(query) {
		if (DataCheckerFunction.notUndefOrNull(this.#callback)) {
      return this.#callback(query, false, false, this.#serverSocket);
    } else {
			return new Promise((resolve, reject) => {
				this.#connection.query(query, (error) => {
																								   if (error) {
																									   Logger.apiLogger.error(`>> ${error}`, { label: 'mysql-import - queryParser - async executeQuery - Promise - db_connection.query - error' });
																									   reject(error);
																									 } else {
   																								   resolve();
																									 }
																								 });
			});
		}
  }

  /**
   * Parse the next char in the string
   * return a full query if one is detected after parsing this char
   * else return false.
	 *
	 * @param {string} char
	 * @return {string | null}
	 * @memberof MySQLQueryParserClass
	 */
	parseChar(char) {
    this.checkEscapeChar();
    this.#buffer.push(char);
  	this.checkNewDelimiter(char);
  	this.checkQuote(char);

  	return this.checkEndOfQuery();
  }

  /**
   * Check if the current char has been escaped
   * and update this.#escaped
	 *
	 * @memberof MySQLQueryParserClass
	 */
	checkEscapeChar() {
  	if (DataCheckerFunction.isUndefOrNull(this.#buffer)) {
	    // do nothing
	  } else if (this.#buffer[this.#buffer.length - 1] === '\\') {
  	  this.#escaped = !this.#escaped;
  	} else {
  	  this.#escaped = false;
  	}
  }

  /**
	 * Check to see if a new delimiter is being assigned
	 *
	 * @param {string} char
	 * @memberof MySQLQueryParserClass
	 */
	checkNewDelimiter(char) {
    const bufferStr = this.#buffer.join('').toLowerCase().trim();

  	if (bufferStr === 'delimiter' && !this.#quoteType) {
  	  this.#seekingDelimiter = true;
  	  this.#buffer = [];
  	} else {
  	  const isNewLine = char === '\n' || char === '\r';
  	  if (isNewLine && this.#seekingDelimiter) {
  		  this.#seekingDelimiter = false;
  		  this.#delimiter = this.#buffer.join('').trim();
  		  this.#buffer = [];
  	  } else {
				// do nothing
			}
  	}
  }

  /**
	 * Check if the current char is a quote
	 *
	 * @param {string} char
	 * @memberof MySQLQueryParserClass
	 */
	checkQuote(char) {
  	const isQuote = (char === '"' || char === "'") && !this.#escaped;
  	if (isQuote && this.#quoteType === char) {
  	  this.#quoteType = false;
  	} else if (isQuote && !this.#quoteType) {
  	  this.#quoteType = char;
  	} else {
			// do nothing
		}
  }

  /**
	 * Check if we're at the end of the query
	 *
	 * @return {string | null}
	 * @memberof MySQLQueryParserClass
	 */
	checkEndOfQuery() {
  	if (this.#seekingDelimiter) {
  	  return null;
  	} else {
			let query = null;
			const demiliterFound = (!this.#quoteType && (this.#buffer.length >= this.#delimiter.length))
			                         ? this.#buffer.slice(-this.#delimiter.length).join('') === this.#delimiter
														   : false;

			if (demiliterFound) {
				// trim the delimiter off the end
				this.#buffer.splice(-this.#delimiter.length, this.#delimiter.length);
				query = this.#buffer.join('').trim();
				this.#buffer = [];
			} else {
				// do nothing
			}

			return query;
		}
  }
}

module.exports = MySQLQueryParserClass;
