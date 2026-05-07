import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ 
    POSTGRES_URL: process.env.POSTGRES_URL || 'Not set',
    note: 'DELETE THIS FILE IMMEDIATELY AFTER USE!'
  });
}
