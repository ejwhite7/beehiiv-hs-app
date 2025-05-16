import { getUserByPublication, logWebhookEvent } from '../../db.js';
import { upsertContactInHubspot } from '../../utils.js';

export default async function handler(req, res) {
  const event = req.body;
  // Validate webhook (optional: check secret/signature)
  const user = await getUserByPublication(event.publication_id);
  if (!user) return res.status(404).send('User not found');
  await logWebhookEvent({ user_id: user.id, event_type: event.type, payload: event });

  // Map Beehiiv fields to HubSpot using field_mapping
  const mapping = user.field_mapping || {};
  const properties = { email: event.email };

  if (event.custom_fields && Array.isArray(event.custom_fields)) {
    for (const field of event.custom_fields) {
      const hubspotField = mapping[field.name];
      if (hubspotField) {
        properties[hubspotField] = field.value;
      }
    }
  }

  const contact = { properties };
  await upsertContactInHubspot(user, contact);
  res.status(200).send('ok');
} 