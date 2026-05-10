import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

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
        const { email, phone, status } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // Duplicate check
        const existingClient = await prisma.client.findFirst({
          where: {
            OR: [
              { email: normalizedEmail },
              { phone: phone.trim() }
            ]
          }
        });

        if (existingClient) {
          const isEmailMatch = existingClient.email.toLowerCase() === normalizedEmail;
          const field = isEmailMatch ? 'Email' : 'Numer telefonu';
          return res.status(400).json({ 
            error: 'Duplicate client', 
            details: `Klient o podanym ${field.toLowerCase()} już istnieje w bazie.` 
          });
        }

        const client = await prisma.client.create({
          data: { 
            email: normalizedEmail, 
            phone: phone.trim(), 
            status 
          },
        });
        return res.status(201).json(client);
      } catch (error) {
        console.error('POST Error:', error);
        return res.status(500).json({ error: 'Failed to create client', details: error instanceof Error ? error.message : String(error) });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (fatalError: any) {
    console.error('FATAL API ERROR:', fatalError);
    return res.status(500).json({ 
      error: 'Prisma Execution Error', 
      details: fatalError?.message || String(fatalError)
    });
  }
}
