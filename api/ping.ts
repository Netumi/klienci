import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API layer is reachable',
    timestamp: new Date().toISOString()
  });
}
