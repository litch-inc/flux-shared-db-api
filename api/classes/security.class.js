'use strict';

const crypto = require('crypto');

const Logger = require('../utils/logger');

class SecurityClass {
  static #initVector;
  static #securityKey;
  static #commAESKey;
  static #commAESIv;
  static publicKey;
  static #privateKey;
  static #key;

  /**
   * Used for encrypting a message
   *
   * @static
   * @param {*} message
   * @param {string} [key=Buffer.from(SecurityClass.getKey(), 'hex')]
   * @param {Buffer} [iv=SecurityClass.#initVector]
   * @return {string}
   * @memberof SecurityClass
   */
  static encrypt(message, key = Buffer.from(SecurityClass.getKey(), 'hex'), iv = SecurityClass.#initVector) {
    try {
      const utfMessage = message.toString();
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      return cipher.update(utfMessage, 'utf8', 'hex') + cipher.final('hex');
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static encrypt - catch - error' });

      return null;
    }
  }

  /**
   * Used for decrypting a message
   *
   * @static
   * @param {*} message
   * @param {string} [key=Buffer.from(SecurityClass.getKey(), 'hex')]
   * @param {Buffer} [iv=SecurityClass.#initVector]
   * @return {Buffer}
   * @memberof SecurityClass
   */
  static decrypt(message, key = Buffer.from(SecurityClass.getKey(), 'hex'), iv = SecurityClass.#initVector) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

      return decipher.update(message, 'hex') + decipher.final();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static decrypt - catch - error' });

      return null;
    }
  }

  /**
   * Used for encrypting comm
   *
   * @static
   * @param {*} message
   * @param {Buffer} [key=SecurityClass.commAESKey]
   * @param {Buffer} [iv=SecurityClass.commAESIv]
   * @return {string}
   * @memberof SecurityClass
   */
  static encryptComm(message, key = SecurityClass.#commAESKey, iv = SecurityClass.#commAESIv) {
    try {
      const utfMessage = message.toString();
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      return cipher.update(utfMessage, 'utf8', 'hex') + cipher.final('hex');
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static encryptComm - catch - error' });

      return null;
    }
  }

  /**
   * Used for decrypting comm
   *
   * @static
   * @param {*} message
   * @param {Buffer} [key=SecurityClass.commAESKey]
   * @param {Buffer} [iv=SecurityClass.commAESIv]
   * @return {Buffer}
   * @memberof SecurityClass
   */
  static decryptComm(message, key = SecurityClass.#commAESKey, iv = SecurityClass.#commAESIv) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

      return decipher.update(message, 'hex') + decipher.final();
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static decryptComm - catch - error' });

      return null;
    }
  }

  /**
   * Used for retrieving local key
   *
   * @static
   * @return {Buffer}
   * @memberof SecurityClass
   */
  static getKey() {
    return SecurityClass.decrypt(SecurityClass.#key, SecurityClass.#securityKey, SecurityClass.#initVector);
  }

  /**
   * Used for returning Buffer with encoding
   *
   * @static
   * @return {string}
   * @memberof SecurityClass
   */
  static getIV() {
    return SecurityClass.#initVector.toString('hex');
  }

  /**
   * Used for generating a new key
   *
   * @static
   * @return {string}
   * @memberof SecurityClass
   */
  static generateNewKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Used for setting SecurityClass.#key
   *
   * @static
   * @param {string} key
   * @memberof SecurityClass
   */
  static setKey(key) {
    SecurityClass.#key = SecurityClass.encrypt(key, SecurityClass.#securityKey, SecurityClass.#initVector);
  }

  /**
   * Used for setting SecurityClass.#initVector
   *
   * @static
   * @param {string} iv
   * @memberof SecurityClass
   */
  static setIV(iv) {
    SecurityClass.#initVector = Buffer.from(iv, 'hex');
  }

  /**
   * Used for setting SecurityClass.#commAESIv and SecurityClass.#commAESKey
   *
   * @static
   * @param {string} key
   * @param {string} iv
   * @memberof SecurityClass
   */
  static setCommKeys(key, iv) {
    SecurityClass.#commAESIv = Buffer.from(iv, 'hex');
    SecurityClass.#commAESKey = Buffer.from(key, 'hex');
  }

  /**
   * Used for retrieving SecurityClass.#commAESIv
   *
   * @static
   * @return {string}
   * @memberof SecurityClass
   */
  static getCommAESIv() {
    return SecurityClass.#commAESIv.toString('hex');
  }

  /**
   * Used for retrieving SecurityClass.#commAESKey
   *
   * @static
   * @return {string}
   * @memberof SecurityClass
   */
  static getCommAESKey() {
    return SecurityClass.#commAESKey.toString('hex');
  }

  /**
   * Used for encrypting public passed data
   *
   * @static
   * @param {*} key
   * @param {*} buffer
   * @return {Buffer}
   * @memberof SecurityClass
   */
  static publicEncrypt(key, buffer) {
    try {
      return crypto.publicEncrypt(key, buffer);
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static publicEncrypt - catch - error' });

      return null;
    }
  }

  /**
   * Used for retrieving decypted value from passed data
   *
   * @static
   * @param {*} key
   * @param {*} buffer
   * @return {string}
   * @memberof SecurityClass
   */
  static publicDecrypt(key, buffer) {
    try {
      return crypto.publicDecrypt(key, buffer).toString('utf8');
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static publicDecrypt - catch - error' });

      return null;
    }
  }

  /**
   * Used for encrypting buffer with private key
   *
   * @static
   * @param {*} buffer
   * @return {Buffer }
   * @memberof SecurityClass
   */
  static privateEncrypt(buffer) {
    try {
      return crypto.privateEncrypt(SecurityClass.#getPrivateKey(), buffer);
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static privateEncrypt - catch - error' });

      return null;
    }
  }

  /**
   * Used for retrieving private decrypt
   *
   * @static
   * @param {*} buffer
   * @return {string}
   * @memberof SecurityClass
   */
  static privateDecrypt(buffer) {
    try {
      return crypto.privateDecrypt(SecurityClass.#getPrivateKey(), buffer).toString('utf8');
    } catch (error) {
      Logger.apiLogger.error(`>> ${error}`, { label: 'security.class - SecurityClass - static privateDecrypt - catch - error' });

      return null;
    }
  }

  /**
   * Used for retrieving the SecurityClass.#privateKey
   *
   * @memberof SecurityClass
   */
  static #getPrivateKey() {
    return SecurityClass.decrypt(SecurityClass.#privateKey, SecurityClass.#securityKey, SecurityClass.#initVector);
  }

  /**
   * Used for iniializing calss values
   *
   * @static
   * @memberof SecurityClass
   */
  static async init() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa',
                                                                 {
                                                                   modulusLength: 2048,
                                                                   publicKeyEncoding: {
                                                                     type: 'spki',
                                                                     format: 'pem'
                                                                   },
                                                                   privateKeyEncoding: {
                                                                     type: 'pkcs8',
                                                                     format: 'pem'
                                                                   }
                                                                 });
    SecurityClass.#initVector = crypto.randomBytes(16);
    SecurityClass.#securityKey = crypto.randomBytes(32);
    SecurityClass.#commAESIv = crypto.randomBytes(16);
    SecurityClass.#commAESKey = crypto.randomBytes(32);
    SecurityClass.#key = SecurityClass.encrypt(process.env.DB_ROOT_PASS, SecurityClass.#securityKey, SecurityClass.#initVector);
    SecurityClass.publicKey = publicKey;
    SecurityClass.#privateKey = SecurityClass.encrypt(privateKey, SecurityClass.#securityKey, SecurityClass.#initVector);
  }
}

module.exports = SecurityClass;
