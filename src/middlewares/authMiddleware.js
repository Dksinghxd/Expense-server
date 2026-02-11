const jwt = require('jsonwebtoken');

const authMiddleware = {
  protect: async (req, res, next) => {
    try {
      let token = null;

      if (req.cookies && req.cookies.jwtToken) {
        token = req.cookies.jwtToken;
      }

      if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      
      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized access'
        });
      }

      
      try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedUser;
        next();
      } catch (error) {
        return res.status(401).json({
          error: 'Invalid or expired token'
        });
      }

    } catch (error) {
      console.error('Auth Middleware Error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};

module.exports = authMiddleware;
