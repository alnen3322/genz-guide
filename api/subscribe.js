export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, lastName } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        firstName: firstName || '',
        lastName:  lastName  || '',
        listIds:   [6],
        updateEnabled: true
      })
    });

    if (response.status === 201 || response.status === 204) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();
    if (data?.code === 'duplicate_parameter') {
      return res.status(200).json({ success: true });
    }

    return res.status(500).json({ error: data.message || 'Brevo error' });

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
