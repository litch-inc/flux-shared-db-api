'use strict';

const SecurityClass = require('../classes/security.class');

async function test() {
  SecurityClass.init();
  const en = SecurityClass.encryptComm('test');
  const keys = {
    'N89.58.26.67': 'd9c1fa0352be20f37ee2f60a1e4284db4af054cfc2cdb270737999cb773bb502:e0f0e5080fdf0a91dd0ecc523e6e53e5'
  };
  console.log(SecurityClass.getKey());
  console.log(SecurityClass.getCommAESKey());
  const encrypted = SecurityClass.publicEncrypt(SecurityClass.publicKey, SecurityClass.getCommAESKey());
  const decrypted = SecurityClass.privateDecrypt(encrypted);
  console.log(Buffer.from(decrypted.toString('hex'), 'hex'));
  SecurityClass.setCommKeys(decrypted, SecurityClass.getCommAESIv());
  SecurityClass.setKey(SecurityClass.generateNewKey());
  const de = SecurityClass.decryptComm(en);
  console.log(de);
  console.log(SecurityClass.getIV());
  console.log(SecurityClass.decrypt(SecurityClass.encrypt(SecurityClass.getIV())));
  console.log(SecurityClass.getKey());

  const encrypted2 = SecurityClass.publicEncrypt(SecurityClass.publicKey, Buffer.from(null, 'hex'));
  const decrypted2 = SecurityClass.privateDecrypt(encrypted2);
  console.log(Buffer.from(decrypted2.toString('hex'), 'hex'));
  SecurityClass.setCommKeys(decrypted2, SecurityClass.getCommAESIv());
  SecurityClass.setKey(SecurityClass.generateNewKey());
  const de2 = SecurityClass.decryptComm(keys['N89.58.26.67'].toString('hex'));
  console.log(de2);
  console.log(SecurityClass.getIV());
  console.log(SecurityClass.decrypt(SecurityClass.encrypt(SecurityClass.getIV())));
  console.log(SecurityClass.getKey());
}

test();
