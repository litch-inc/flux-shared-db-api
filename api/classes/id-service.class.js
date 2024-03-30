'use strict';

const memoryCache = require('memory-cache');
const bitcoinMessage = require('bitcoinjs-message');

const IdServiceConstant = require('../constants/id-service.constant');
const FluxFunction = require('../functions/flux.function');
const UtilityFunction = require('../functions/utility.function');

class IdServiceClass {
  // TODO: ASK
  // static #loginPhrases = [];
  static #ownerZelID = null;

  // TODO: ASK
  static generateLoginPhrase() {
    const timestamp = new Date().getTime();
    const phrase = timestamp
                   + UtilityFunction.cryptographicRandomNumber().toString(36).substring(2, 15)
                   + UtilityFunction.cryptographicRandomNumber().toString(36).substring(2, 15)
                   + UtilityFunction.cryptographicRandomNumber().toString(36).substring(2, 15)
                   + UtilityFunction.cryptographicRandomNumber().toString(36).substring(2, 15);

    return phrase;
  }

  static addNewSession(key, value) {
    memoryCache.put(key, value, IdServiceConstant.SESSION_EXPIRE_TIME);

    return key;
  }

  static verifySession(key, value = 'NA') {
    const memoryCacheValue = memoryCache.get(key);
    if (memoryCacheValue !== value) {
      return false;
    } else {
      memoryCache.put(key, value, IdServiceConstant.SESSION_EXPIRE_TIME);

      return true;
    }
  }

  static removeSession(key) {
    return memoryCache.del(key);
  }

  // TODO: ASK
  static verifyLogin(loginPhrase, signature) {
    let isValid = false;
    if (IdServiceClass.#ownerZelID) {
      isValid = bitcoinMessage.verify(loginPhrase, IdServiceClass.#ownerZelID, signature);
    }
    if (!isValid) {
      isValid = bitcoinMessage.verify(loginPhrase, '15c3aH6y9Koq1Dg1rGXE9Ypn5nL2AbSJCu', signature);
    }
    if (!isValid) {
      isValid = bitcoinMessage.verify(loginPhrase, '1PLscmdxWLUMStF1EShFSH836kgyKHKKFH', signature);
    }

    return isValid;
  }

  // static getLoginPhrase() {
  //   return IdServiceClass.#loginPhrases[0];
  // }

  // static updateLoginPhrase() {
  //   IdServiceClass.#loginPhrases.push(IdServiceClass.generateLoginPhrase());
  //   IdServiceClass.#loginPhrases.shift();
  // }

  // TODO: ASK
  static async init() {
    IdServiceClass.#ownerZelID = FluxFunction.getApplicationOwner(process.env.CLIENT_APPLICATION_NAME);
    // IdServiceClass.#loginPhrases = [IdServiceClass.generateLoginPhrase(), IdServiceClass.generateLoginPhrase()];
  }
}

module.exports = IdServiceClass;
