import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const prisma = new PrismaClient();
    const clientCount = await prisma.client.count();
    await prisma.$disconnect();
    
    return res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      count: clientCount,
      env_check: process.env.POSTGRES_URL ? 'POSTGRES_URL is set' : 'POSTGRES_URL IS MISSING!'
    });
  } catch (err) {
    return res.status(500).json({ 
      status: 'error', 
      message: err instanceof Error ? err.message : String(err),
      env_check: process.env.POSTGRES_URL ? 'POSTGRES_URL is set' : 'POSTGRES_URL IS MISSING!'
    });
  }
}
