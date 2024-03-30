'use strict';

const { validationCheck, verifyFields, verify } = require('../middlewares');
const AuthService = require('../services/auth.service');

module.exports = (app) => {
  app.post('/api/auth/login',
           [
             verifyFields.bodyLoginPhrase,
             verifyFields.bodySignature,
             validationCheck.validationResultCheck
           ],
           AuthService.login);

  app.post('/api/auth/logout',
          [
            verify.authUser
          ],
          AuthService.logout);

  app.get('/api/auth/login-phrase',
          [],
          AuthService.getLoginPhrase);

  app.get('/api/auth/logged-in-check',
          [
            verify.authUser
          ],
          AuthService.loggedInCheck);
};
