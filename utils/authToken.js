const jwt = require('jsonwebtoken');
const User = require('../models/user.model');



exports.createToken = (
  jwtPayload,
  secret,
  expiresIn,
) => {
  const options = { expiresIn: expiresIn };
  return jwt.sign(jwtPayload, secret, options);
};


exports.verifyToken =(
  token,
  secret
)=> {
  return jwt.verify(token, secret)
};

