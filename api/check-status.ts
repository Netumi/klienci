import http2 from 'node:http2';
import type { VercelRequest, VercelResponse } from '@vercel/node';

function http2Get(authority: string, path: string, headers: Record<string, string | number>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(authority);
    client.on('error', (err) => reject(err));
    const req = client.request({
      ':method': 'GET',
      ':path': path,
      ...headers
    });
    let responseData = '';
    let responseStatus = 200;
    req.on('response', (resHeaders) => {
      responseStatus = Number(resHeaders[':status'] || 200);
    });
    req.on('data', (chunk) => {
      responseData += chunk;
    });
    req.on('end', () => {
      client.close();
      resolve({ status: responseStatus, body: responseData });
    });
    req.on('error', (err) => {
      client.close();
      reject(err);
    });
    req.end();
  });
}

function http2Post(authority: string, path: string, headers: Record<string, string | number>, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(authority);
    client.on('error', (err) => reject(err));
    const req = client.request({
      ':method': 'POST',
      ':path': path,
      ...headers
    });
    let responseData = '';
    let responseStatus = 200;
    req.on('response', (resHeaders) => {
      responseStatus = Number(resHeaders[':status'] || 200);
    });
    req.on('data', (chunk) => {
      responseData += chunk;
    });
    req.on('end', () => {
      client.close();
      resolve({ status: responseStatus, body: responseData });
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Endpoint przyjmuje metodą GET parametr transactionId z adresu URL (query)
    const transactionId = (req.query.transactionId || req.query.id || req.query.tpayId) as string;

    if (!transactionId) {
      return res.status(400).json({ paid: false, error: 'Brak transactionId' });
    }

    const clientId = process.env.TPAY_CLIENT_ID;
    const clientSecret = process.env.TPAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Brak zmiennych środowiskowych Tpay (TPAY_CLIENT_ID / TPAY_CLIENT_SECRET)');
      return res.status(500).json({ paid: false, error: 'Brak konfiguracji Tpay' });
    }

    const authority = 'https://openapi.sandbox.tpay.com';

    // 2. Najpierw pobiera token OAuth2 przez HTTP/2 z adresu https://openapi.sandbox.tpay.com/oauth/auth
    const authParams = new URLSearchParams();
    authParams.append('client_id', clientId);
    authParams.append('client_secret', clientSecret);
    const authBody = authParams.toString();

    const authResult = await http2Post(authority, '/oauth/auth', {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': Buffer.byteLength(authBody),
      'user-agent': 'Mozilla/5.0',
      'accept': 'application/json',
    }, authBody);

    if (authResult.status !== 200 && authResult.status !== 201) {
      console.error('Tpay Auth Error:', authResult.status, authResult.body);
      return res.status(500).json({ paid: false, error: 'Błąd uwierzytelniania w Tpay' });
    }

    let authData: any;
    try {
      authData = JSON.parse(authResult.body);
    } catch (e) {
      console.error('Tpay Auth Parse Error:', authResult.body);
      return res.status(500).json({ paid: false, error: 'Błąd parsowania tokena Tpay' });
    }

    const accessToken = authData.access_token;
    if (!accessToken) {
      console.error('Brak access_token w odpowiedzi Tpay:', authData);
      return res.status(500).json({ paid: false, error: 'Brak tokena dostępu Tpay' });
    }

    // 3. Następnie wysyła żądanie GET przez HTTP/2 na serwer Tpay, na adres: https://openapi.sandbox.tpay.com/transactions/TUTAJ_ID_TRANSAKCJI
    const txResult = await http2Get(authority, `/transactions/${encodeURIComponent(transactionId)}`, {
      'authorization': 'Bearer ' + accessToken,
      'user-agent': 'Mozilla/5.0',
      'accept': 'application/json',
    });

    if (txResult.status !== 200) {
      console.error('Tpay Transaction Status API Error:', txResult.status, txResult.body);
      return res.status(200).json({ paid: false });
    }

    let txData: any;
    try {
      txData = JSON.parse(txResult.body);
    } catch (e) {
      console.error('Tpay Transaction Status Parse Error:', txResult.body);
      return res.status(200).json({ paid: false });
    }

    // 4. Sprawdź w nim pole 'status'. Jeśli status wynosi 'correct', oznacza to, że transakcja jest opłacona.
    const status = txData.status || txData.tr_status;
    const isPaid = status === 'correct' || status === 'paid' || status === 'TRUE' || status === 3;

    // 5. Zwróć do frontendu JSON: { paid: true } lub { paid: false }
    if (isPaid) {
      return res.status(200).json({ paid: true });
    }

    return res.status(200).json({ paid: false });
  } catch (error) {
    console.error('Check Status API Error:', error);
    return res.status(500).json({ paid: false, error: error instanceof Error ? error.message : String(error) });
  }
}
