import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import RevokedToken from '../models/RevokedToken.js';

const hashToken = (token) =>
  createHash('sha256').update(token).digest('hex');

export const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
    jwtid: randomUUID(),
  });

export const verifyActiveToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const revoked = await RevokedToken.exists({ tokenHash: hashToken(token) });

  if (revoked) {
    throw new jwt.JsonWebTokenError('Token has been revoked');
  }

  return decoded;
};

export const revokeToken = async (token, expiresAtSeconds) => {
  await RevokedToken.updateOne(
    { tokenHash: hashToken(token) },
    { $set: { expiresAt: new Date(expiresAtSeconds * 1000) } },
    { upsert: true }
  );
};
