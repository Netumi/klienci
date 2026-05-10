import { prisma } from './lib/prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let dbStatus = 'unknown';
  let clientCount = 0;
  
  try {
    clientCount = await prisma.client.count();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  res.status(200).json({ 
    status: 'ok', 
    message: 'API layer is reachable',
    database: {
      status: dbStatus,
      count: clientCount
    },
    timestamp: new Date().toISOString()
  });
}
