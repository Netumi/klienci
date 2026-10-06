import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body || {};
    console.log('Tpay Webhook received payload:', JSON.stringify(body));

    const status = body?.status;
    const trStatus = body?.tr_status;
    const crc = body?.crc || body?.hidden || body?.order_id;
    const tpayId = body?.id || body?.transactionId || body?.tr_id;

    const isSuccess = 
      status === 'correct' || 
      status === 'paid' || 
      status === 'TRUE' || 
      trStatus === 'TRUE' || 
      status === 3;

    if (isSuccess) {
      // Find and update transaction in DB
      let updated = false;

      if (crc) {
        try {
          await prisma.transaction.update({
            where: { tpayId: String(crc) },
            data: { status: 'PAID' }
          });
          updated = true;
          console.log(`Transaction ${crc} marked as PAID via CRC in webhook.`);
        } catch (err) {
          // might not exist or already updated
        }
      }

      if (!updated && tpayId) {
        try {
          await prisma.transaction.update({
            where: { tpayId: String(tpayId) },
            data: { status: 'PAID' }
          });
          updated = true;
          console.log(`Transaction ${tpayId} marked as PAID via tpayId in webhook.`);
        } catch (err) {
          // ignore
        }
      }

      if (!updated) {
        // Fallback: update the latest PENDING transaction if any exists
        try {
          const latestPending = await prisma.transaction.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
          });
          if (latestPending) {
            await prisma.transaction.update({
              where: { id: latestPending.id },
              data: { status: 'PAID' }
            });
            console.log(`Fallback: marked latest pending transaction ${latestPending.tpayId} as PAID.`);
          }
        } catch (fallbackErr) {
          console.error('Webhook fallback update error:', fallbackErr);
        }
      }
    } else {
      console.log('Powiadomienie Tpay odebrane, status nieoznaczający pełnego sukcesu:', status || trStatus);
    }

    // Tpay specification requires HTTP 200 and plain text 'TRUE' without JSON
    return res.status(200).setHeader('content-type', 'text/plain').send('TRUE');
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(200).setHeader('content-type', 'text/plain').send('TRUE');
  }
}
