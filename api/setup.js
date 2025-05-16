import { saveBeehiivSettings } from '../db.js';
import { registerBeehiivWebhook } from '../utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { hubspot_user_id, beehiiv_api_key, beehiiv_publication_id, field_mapping } = req.body;
  await saveBeehiivSettings({ hubspot_user_id, beehiiv_api_key, beehiiv_publication_id, field_mapping });

  // Register Beehiiv webhook
  const webhook_url = `${process.env.PUBLIC_BASE_URL || ''}/api/beehiiv/webhook`;
  try {
    await registerBeehiivWebhook({
      publication_id: beehiiv_publication_id,
      beehiiv_api_key,
      webhook_url,
      secret: process.env.BEEHIIV_WEBHOOK_SECRET
    });
  } catch (err) {
    return res.status(500).send(`Failed to register Beehiiv webhook: ${err.message}`);
  }

  res.status(200).send('Settings saved and webhook registered');
} 