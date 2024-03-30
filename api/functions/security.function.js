'use strict';

const forge = require('node-forge');

/**
 * Used for generating SSL certs
 *
 * @return {{ pemPrivateKey, pemCertificate }}
 */
const generateRSAKey = () => {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  const attrs = [
    { name: 'commonName', value: 'runonflux.io' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'New York' },
    { name: 'localityName', value: 'New York' },
    { name: 'organizationName', value: 'InFlux Technologies' },
    { shortName: 'OU', value: 'IT' }
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey);
  const pemPrivateKey = forge.pki.privateKeyToPem(keys.privateKey);
  const pemCertificate = forge.pki.certificateToPem(cert);

  return { pemPrivateKey, pemCertificate };
};

module.exports = {
  generateRSAKey
};
