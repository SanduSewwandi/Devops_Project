import jwt from "jsonwebtoken";

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  try {
    // Expect header format: "Authorization: Bearer <token>"
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Please login again.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Token missing.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Check only role
    if (decoded.role && decoded.role === "admin") {
      req.admin = decoded; // store admin info for routes
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access Denied. Not an Admin.",
      });
    }
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export default adminAuth;
