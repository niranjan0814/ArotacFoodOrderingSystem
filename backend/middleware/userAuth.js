import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
  if (!token) {
    console.log('No token provided in Authorization header');
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized! Login Again!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Match the JWT payload structure
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized! Login Again!" });
  }
};

export default userAuth;