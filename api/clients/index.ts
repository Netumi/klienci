import { prisma } from '../lib/prisma';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      try {
        const clients = await prisma.client.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(clients);
      } catch (error) {
        console.error('GET Error:', error);
        return res.status(500).json({ error: 'Failed to fetch clients', details: error instanceof Error ? error.message : String(error) });
      }
    }

    if (req.method === 'POST') {
      try {
        const { name, email, status } = req.body;
        const client = await prisma.client.create({
          data: { name, email, status },
        });
        return res.status(201).json(client);
      } catch (error) {
        console.error('POST Error:', error);
        return res.status(500).json({ error: 'Failed to create client', details: error instanceof Error ? error.message : String(error) });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (fatalError) {
    console.error('FATAL API ERROR:', fatalError);
    return res.status(500).json({ 
      error: 'Fatal Server Error', 
      details: fatalError instanceof Error ? fatalError.message : String(fatalError) 
    });
  }
}
