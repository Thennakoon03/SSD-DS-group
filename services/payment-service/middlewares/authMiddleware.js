import jwt from 'jsonwebtoken';
import axios from 'axios';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify cryptographic validity and expiration locally
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Inter-service verification to ensure token has not been revoked on logout
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
    try {
      const response = await axios.get(`${authServiceUrl}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000,
      });

      if (!response.data.success) {
        return res.status(401).json({ success: false, message: 'Token has been revoked or is invalid' });
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        return res.status(401).json({ success: false, message: 'Token has been revoked. Please log in again.' });
      }
      // If auth-service is unreachable during internal network issues, fall back to valid decoded payload
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
  }
  next();
};