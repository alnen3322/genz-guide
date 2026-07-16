export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, lastName } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const BREVO_API_KEY = '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';
  const GUIDE_URL = 'https://drive.google.com/file/d/1fc3OpGzzv_G0gfCesqqlaANeAtRsyRf3/view?usp=sharing';
  const FROM_EMAIL = 'al@eastsideandaround.com';
  const FROM_NAME = 'Eastside & Around';

  try {
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName || '', LASTNAME: lastName || '' },
        listIds: [6],
        updateEnabled: true
      })
    });

    const contactData = contactRes.status !== 204 ? await contactRes.json() : {};
    const contactOk = contactRes.status === 201 || contactRes.status === 204 || contactData?.code === 'duplicate_parameter';

    if (!contactOk) {
      console.error('Brevo contact error:', contactData);
      return res.status(500).json({ error: contactData.message || 'Could not save contact' });
    }

    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email, name: firstName || email }],
        subject: 'Your Free Field Guide — Advertising to Gen Z in Greater Milwaukee',
        htmlContent: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
          <p style="font-size: 15px; color: #111; margin-bottom: 8px;">Hey ${firstName || 'there'},</p>
          <p style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 24px;">Your free copy of <strong>Advertising to Gen Z in Greater Milwaukee</strong> is ready. Click below to access it instantly.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${GUIDE_URL}" style="background: #1a1a2e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600; display: inline-block;">Access Your Free Guide →</a>
          </div>
          <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 32px;">Inside: county-by-county Gen Z demographics, Milwaukee's creator ecosystem mapped, and six strategic principles for the Southeastern Wisconsin DMA.</p>
          <p style="font-size: 14px; color: #555; margin-top: 24px;">Questions? Just reply to this email.<br><br>— The Eastside & Around Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">© 2026 Eastside & Around LLC · Milwaukee, WI<br>You're receiving this because you requested the free guide.</p>
        </div>`
      })
    });

    const emailData = await emailRes.json();
    if (emailRes.status !== 201) {
      console.error('Brevo email error:', emailData);
      return res.status(500).json({ error: emailData.message || 'Could not send email' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
