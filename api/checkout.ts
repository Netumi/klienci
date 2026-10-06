import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    // Step 1: Get OAuth2 token from Tpay via corsproxy.io without Referer header
    const authParams = new URLSearchParams();
    authParams.append('client_id', clientId);
    authParams.append('client_secret', clientSecret);
    authParams.append('grant_type', 'client_credentials');

    const authResponse = await fetch('https://corsproxy.io/?https://openapi.tpay.com/oauth/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Origin': origin,
      },
      body: authParams.toString(),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Tpay Auth Error:', errorText);
      return res.status(500).json({ error: 'Nie udało się uwierzytelnić w Tpay przez proxy', details: errorText });
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      console.error('Brak access_token w odpowiedzi Tpay:', authData);
      return res.status(500).json({ error: 'Brak tokena dostępu z Tpay' });
    }

    const successUrl = `${origin}/?success=true`;
    const errorUrl = `${origin}/?error=true`;
    const webhookUrl = `${origin}/api/webhook`;

    // Step 2: Create transaction via corsproxy.io without Referer header
    const transactionResponse = await fetch('https://corsproxy.io/?https://openapi.tpay.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Origin': origin,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!transactionResponse.ok) {
      const txErrorText = await transactionResponse.text();
      console.error('Tpay Transaction Error:', txErrorText);
      return res.status(500).json({ error: 'Nie udało się utworzyć transakcji w Tpay przez proxy', details: txErrorText });
    }

    const txData = await transactionResponse.json();
    const paymentUrl = txData.transactionPaymentUrl || txData.url;

    if (!paymentUrl) {
      console.error('Brak transactionPaymentUrl w odpowiedzi Tpay:', txData);
      return res.status(500).json({ error: 'Brak adresu URL płatności w odpowiedzi Tpay' });
    }

    return res.status(200).json({ url: paymentUrl });
  } catch (error) {
    console.error('Checkout API Error:', error);
    return res.status(500).json({ 
      error: 'Wystąpił błąd podczas tworzenia płatności przez proxy', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
