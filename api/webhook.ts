import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body;
    console.log('Tpay Webhook received payload:', JSON.stringify(body));

    const status = body?.status;
    const trStatus = body?.tr_status;

    if (status === 'correct' || trStatus === 'TRUE' || status === 'TRUE' || status === 3) {
      console.log('SUKCES TRANSAKCJI TPAY! Transakcja została opłacona pomyślnie.', body);
    } else {
      console.log('Powiadomienie Tpay odebrane, status:', status || trStatus);
    }

    // Tpay specification requires HTTP 200 and plain text 'TRUE' without JSON
    return res.status(200).send('TRUE');
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(200).send('TRUE');
  }
}
