const jwt = require('jsonwebtoken');
const config = require('../config/api.config');

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token) {
    return res.status(403).send({
      message: 'Token gerekli!'
    });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), config.jwtSecret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).send({
      message: 'Yetkisiz erişim!'
    });
  }
};

module.exports = {
  verifyToken
}; 