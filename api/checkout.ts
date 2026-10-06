import http2 from 'node:http2';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function http2Post(authority: string, path: string, headers: Record<string, string>, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(authority);
    client.on('error', (err) => reject(err));

    const req = client.request({
      ':method': 'POST',
      ':path': path,
      ...headers,
    });

    let data = '';
    req.setEncoding('utf8');

    req.on('response', (resHeaders) => {
      const status = Number(resHeaders[':status'] || 500);
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        client.close();
        resolve({ status, body: data });
      });
    });

    req.on('error', (err) => {
      client.close();
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, name, email, phone } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Podaj prawidłową kwotę' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Podaj prawidłowy adres e-mail płatnika' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Podaj imię i nazwisko płatnika' });
    }

    const clientId = process.env.TPAY_CLIENT_ID;
    const clientSecret = process.env.TPAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Brak zmiennych środowiskowych Tpay (TPAY_CLIENT_ID / TPAY_CLIENT_SECRET)');
      return res.status(500).json({ error: 'Brak konfiguracji Tpay w zmiennych środowiskowych' });
    }

    const host = req.headers.host || 'localhost';
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    const origin = `${protocol}://${host}`;
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const authority = 'https://openapi.tpay.com';

    // Step 1: Get OAuth2 token via HTTP/2
    const authParams = new URLSearchParams();
    authParams.append('client_id', clientId);
    authParams.append('client_secret', clientSecret);
    authParams.append('grant_type', 'client_credentials');
    const authBody = authParams.toString();

    const authResult = await http2Post(authority, '/oauth/auth', {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': Buffer.byteLength(authBody),
      'user-agent': userAgent,
      'accept': 'application/json',
      'origin': origin,
    }, authBody);

    if (authResult.status !== 200 && authResult.status !== 201) {
      console.error('Tpay HTTP/2 Auth Error:', authResult.body);
      return res.status(500).json({ error: 'Nie udało się uwierzytelnić w Tpay przez HTTP/2', details: authResult.body });
    }

    let authData: any;
    try {
      authData = JSON.parse(authResult.body);
    } catch (e) {
      console.error('Tpay Auth Parse Error:', authResult.body);
      return res.status(500).json({ error: 'Nie udało się sparsować odpowiedzi tokena Tpay', details: authResult.body });
    }

    const accessToken = authData.access_token;
    if (!accessToken) {
      console.error('Brak access_token w odpowiedzi Tpay:', authData);
      return res.status(500).json({ error: 'Brak tokena dostępu z Tpay', details: authData });
    }

    const successUrl = `${origin}/?success=true`;
    const errorUrl = `${origin}/?error=true`;
    const webhookUrl = `${origin}/api/webhook`;

    const txPayload = JSON.stringify({
      amount: Number(amount),
      description: `Opłata - ${name.trim()} (${amount} PLN)`,
      lang: 'pl',
      payer: {
        email: email.trim(),
        name: name.trim(),
        ...(phone && phone.trim() ? { phone: phone.trim() } : {}),
      },
      callbacks: {
        payerUrls: {
          success: successUrl,
          error: errorUrl,
        },
        notification: {
          url: webhookUrl,
        },
      },
    });

    // Step 2: Create transaction via HTTP/2
    const txResult = await http2Post(authority, '/transactions', {
      'authorization': `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(txPayload),
      'user-agent': userAgent,
      'accept': 'application/json',
      'origin': origin,
    }, txPayload);

    if (txResult.status !== 200 && txResult.status !== 201) {
      console.error('Tpay HTTP/2 Transaction Error:', txResult.body);
      return res.status(500).json({ error: 'Nie udało się utworzyć transakcji w Tpay przez HTTP/2', details: txResult.body });
    }

    let txData: any;
    try {
      txData = JSON.parse(txResult.body);
    } catch (e) {
      console.error('Tpay Transaction Parse Error:', txResult.body);
      return res.status(500).json({ error: 'Nie udało się sparsować odpowiedzi transakcji Tpay', details: txResult.body });
    }

    const paymentUrl = txData.transactionPaymentUrl || txData.url;
    if (!paymentUrl) {
      console.error('Brak transactionPaymentUrl w odpowiedzi Tpay:', txData);
      return res.status(500).json({ error: 'Brak adresu URL płatności w odpowiedzi Tpay', details: txData });
    }

    return res.status(200).json({ url: paymentUrl });
  } catch (error) {
    console.error('Checkout API HTTP/2 Error:', error);
    return res.status(500).json({ 
      error: 'Wystąpił błąd podczas komunikacji HTTP/2 z Tpay', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
