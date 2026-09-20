import dotenv from 'dotenv';
dotenv.config();

// Middleware for internal service-to-service calls.
// Caller must include the header: X-Service-Key: <SERVICE_SECRET_KEY>
export const serviceProtect = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];

  if (!serviceKey || serviceKey !== process.env.SERVICE_SECRET_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden: invalid service key' });
  }

  next();
};
