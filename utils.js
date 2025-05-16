import axios from 'axios';
import { saveUserTokens } from './db.js';

export async function upsertContactInHubspot(user, contact) {
  try {
    await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      contact,
      { headers: { Authorization: `Bearer ${user.hubspot_access_token}` } }
    );
  } catch (err) {
    if (err.response && err.response.status === 401) {
      // Token expired, refresh and retry once
      const newToken = await refreshHubspotToken(user);
      if (newToken) {
        await axios.post(
          'https://api.hubapi.com/crm/v3/objects/contacts',
          contact,
          { headers: { Authorization: `Bearer ${newToken}` } }
        );
      } else {
        throw new Error('Failed to refresh HubSpot token');
      }
    } else {
      throw err;
    }
  }
}

export async function refreshHubspotToken(user) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', process.env.HUBSPOT_CLIENT_ID);
  params.append('client_secret', process.env.HUBSPOT_CLIENT_SECRET);
  params.append('refresh_token', user.hubspot_refresh_token);

  const resp = await axios.post('https://api.hubapi.com/oauth/v1/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  // Save new tokens
  await saveUserTokens({
    hubspot_user_id: user.hubspot_user_id,
    access_token: resp.data.access_token,
    refresh_token: resp.data.refresh_token || user.hubspot_refresh_token
  });
  return resp.data.access_token;
}

export async function registerBeehiivWebhook({ publication_id, beehiiv_api_key, webhook_url, secret }) {
  await axios.post(
    `https://api.beehiiv.com/v2/publications/${publication_id}/webhooks`,
    {
      url: webhook_url,
      event_types: ['subscriber.subscribed', 'subscriber.updated'],
      ...(secret ? { secret } : {})
    },
    { headers: { Authorization: `Bearer ${beehiiv_api_key}` } }
  );
} 