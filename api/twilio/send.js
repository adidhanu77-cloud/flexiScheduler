export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const accountSid = body.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = body.authToken || process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = body.fromPhone || process.env.TWILIO_PHONE_NUMBER || '+17756182757';
    const fromWhatsApp = body.fromWhatsApp || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const to = body.to || process.env.VITE_RECIPIENT_PHONE || '+918210868501';
    const message = body.message || '';
    const channels = body.channels || ['whatsapp', 'sms'];

    // Format destination numbers to E.164
    let cleanTo = to.trim().replace(/^whatsapp:/, '');
    if (/^\d{10}$/.test(cleanTo)) {
      cleanTo = '+91' + cleanTo;
    }
    const formattedPhone = cleanTo.startsWith('+') ? cleanTo : `+${cleanTo}`;

    const results = [];
    const hasRealCreds = Boolean(accountSid && authToken && accountSid.startsWith('AC'));

    for (const ch of channels) {
      if (ch === 'whatsapp') {
        const targetTo = `whatsapp:${formattedPhone}`;
        const targetFrom = fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`;

        if (hasRealCreds) {
          try {
            const params = new URLSearchParams();
            params.append('To', targetTo);
            params.append('From', targetFrom);
            params.append('Body', message);

            const twilioRes = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              }
            );
            const twilioData = await twilioRes.json();
            results.push({
              channel: 'whatsapp',
              to: targetTo,
              from: targetFrom,
              status: twilioRes.ok ? (twilioData.status || 'queued') : 'failed',
              sid: twilioData.sid || `SM_WA_${Date.now()}`,
              realTwilio: twilioRes.ok,
              details: twilioData.message || twilioData.status || 'Delivered to Twilio WhatsApp Sandbox'
            });
          } catch (err) {
            results.push({
              channel: 'whatsapp',
              to: targetTo,
              status: 'error',
              sid: `SM_WA_ERR_${Date.now()}`,
              realTwilio: false,
              details: err.message
            });
          }
        }
      }

      if (ch === 'sms') {
        const targetTo = formattedPhone;
        const targetFrom = fromPhone;

        if (hasRealCreds) {
          try {
            const params = new URLSearchParams();
            params.append('To', targetTo);
            params.append('From', targetFrom);
            params.append('Body', message);

            const twilioRes = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
              }
            );
            const twilioData = await twilioRes.json();
            results.push({
              channel: 'sms',
              to: targetTo,
              from: targetFrom,
              status: twilioRes.ok ? (twilioData.status || 'queued') : 'failed',
              sid: twilioData.sid || `SM_SMS_${Date.now()}`,
              realTwilio: twilioRes.ok,
              details: twilioData.message || twilioData.status || 'Dispatched via Twilio SMS Gateway'
            });
          } catch (err) {
            results.push({
              channel: 'sms',
              to: targetTo,
              status: 'error',
              sid: `SM_SMS_ERR_${Date.now()}`,
              realTwilio: false,
              details: err.message
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message,
      results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
