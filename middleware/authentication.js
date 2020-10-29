const jwt = require("jsonwebtoken");
const authenticationHandler = (req, res, next) => {
  const headers = req.headers;

  if (!headers.accesstoken) {
    return res.status(403).json("Un-Authorized Access");
  }
  jwt.verify(headers.accesstoken, "APP_SECRET", (err, result) => {
    if (err) {
      return res.status(403).json("Authentication Failed");
    }
    next();
  });
};

module.exports = authenticationHandler;
