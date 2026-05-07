import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { prisma } = await import('../lib/prisma');
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
        console.error('PATCH Error:', error);
        return res.status(500).json({ error: 'Failed to update client', details: error instanceof Error ? error.message : String(error) });
      }
    }

    if (req.method === 'DELETE') {
      try {
        await prisma.client.delete({
          where: { id },
        });
        return res.status(204).end();
      } catch (error) {
        console.error('DELETE Error:', error);
        return res.status(500).json({ error: 'Failed to delete client', details: error instanceof Error ? error.message : String(error) });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (fatalError: any) {
    console.error('FATAL API ERROR:', fatalError);
    return res.status(500).json({ 
      error: 'Prisma Initialization Error', 
      details: fatalError?.message || String(fatalError)
    });
  }
}
