require('dotenv').config();
const { expressjwt: expressJwt } = require('express-jwt');

const jwtMiddleware = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
});

module.exports = jwtMiddleware;