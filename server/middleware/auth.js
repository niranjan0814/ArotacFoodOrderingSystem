const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get token from Authorization header (Bearer token format)
  const token = req.header('Authorization') && req.header('Authorization').startsWith('Bearer ')
    ? req.header('Authorization').split(' ')[1]
    : null;
  
  // Check if no token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user ID to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};
