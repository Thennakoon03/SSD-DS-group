import jwt from 'jsonwebtoken';

// Verifies JWT and sets req.user = { id, role }
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Role guard — use after protect
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

/**
 * Internal service middleware — used for endpoints called by other microservices.
 * Requires the header: x-service-secret: <SERVICE_SECRET>
 */
export const serviceAuth = (req, res, next) => {
  const secret = req.headers['x-service-secret'];
  if (!secret || secret !== process.env.SERVICE_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid service secret' });
  }
  next();
};
