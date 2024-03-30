'use strict';

module.exports = (api, generateToken) => {
  api.get('/api/auth/protect',
          (request, response) => {
            const csrfToken = generateToken(request, response);

            response.status(201).json({ message: csrfToken });
          });
};
