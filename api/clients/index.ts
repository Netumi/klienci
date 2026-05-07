import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(clients);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch clients' });
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
      return res.status(500).json({ error: 'Failed to create client' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
