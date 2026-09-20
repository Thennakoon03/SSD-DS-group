import dotenv from 'dotenv';
dotenv.config();

export const serviceProtect = (req, res, next) => {
  // Accept either header name for compatibility across services
  const serviceKey = req.headers['x-service-key'] || req.headers['x-service-secret'];
  // Accept either env var name
  const expected   = process.env.SERVICE_SECRET_KEY || process.env.SERVICE_SECRET;

  if (!serviceKey || !expected || serviceKey !== expected) {
    return res.status(403).json({ success: false, message: 'Forbidden: invalid service key' });
  }

  next();
};
