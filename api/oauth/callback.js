import axios from 'axios';
import { saveUserTokens } from '../../db.js';

export default async function handler(req, res) {
  const { code } = req.query;
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', process.env.HUBSPOT_CLIENT_ID);
    params.append('client_secret', process.env.HUBSPOT_CLIENT_SECRET);
    params.append('redirect_uri', process.env.HUBSPOT_REDIRECT_URI);
    params.append('code', code);

    const resp = await axios.post('https://api.hubapi.com/oauth/v1/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Get user info
    const userResp = await axios.get('https://api.hubapi.com/integrations/v1/me', {
      headers: { Authorization: `Bearer ${resp.data.access_token}` }
    });

    console.log('HubSpot user info:', userResp.data);

    const hubspotUserId = userResp.data.portalId;
    if (!hubspotUserId) {
      console.error('No HubSpot portalId found in response:', userResp.data);
      return res.status(500).send('OAuth Error: No HubSpot portalId found');
    }

    await saveUserTokens({
      hubspot_user_id: hubspotUserId,
      access_token: resp.data.access_token,
      refresh_token: resp.data.refresh_token
    });

    res.status(200).send('OAuth Success! You can close this window.');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send(`OAuth Error: ${err.message}`);
  }
} 