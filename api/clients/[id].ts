import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;
      const client = await prisma.client.update({
        where: { id },
        data: { status },
      });
      return res.status(200).json(client);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update client' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.client.delete({
        where: { id },
      });
      return res.status(204).end();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete client' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
