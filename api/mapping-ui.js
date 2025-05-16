import axios from 'axios';
import { getUserByPublication, saveBeehiivSettings } from '../db.js';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { publication_id } = req.query;
  if (!publication_id) return res.status(400).send('Missing publication_id');
  const user = await getUserByPublication(publication_id);
  if (!user) return res.status(404).send('User not found');

  if (req.method === 'GET') {
    // Fetch Beehiiv custom fields
    const beehiivFieldsResp = await axios.get(
      `https://api.beehiiv.com/v2/publications/${publication_id}/custom_fields`,
      { headers: { Authorization: `Bearer ${user.beehiiv_api_key}` } }
    );
    const beehiivFields = beehiivFieldsResp.data.data || [];

    // Fetch HubSpot properties
    const hubspotPropsResp = await axios.get(
      'https://api.hubapi.com/crm/v3/properties/contacts',
      { headers: { Authorization: `Bearer ${user.hubspot_access_token}` } }
    );
    const hubspotProps = hubspotPropsResp.data.results || [];

    // Render HTML form
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <html>
        <head>
          <title>Map Beehiiv Fields to HubSpot Properties</title>
          <style>
            body { font-family: sans-serif; margin: 2em; }
            label { display: inline-block; width: 180px; }
            select { width: 220px; }
            .row { margin-bottom: 1em; }
            button { padding: 0.5em 1.5em; font-size: 1em; }
          </style>
        </head>
        <body>
          <h2>Map Beehiiv Fields to HubSpot Properties</h2>
          <form method="POST" action="/api/mapping-ui?publication_id=${publication_id}">
            ${beehiivFields.map(field => `
              <div class="row">
                <label>${field.name}</label>
                <select name="mapping[${field.name}]">
                  <option value="">-- Ignore --</option>
                  ${hubspotProps.map(prop => `
                    <option value="${prop.name}">${prop.label || prop.name}</option>
                  `).join('')}
                </select>
              </div>
            `).join('')}
            <button type="submit">Save Mapping</button>
          </form>
        </body>
      </html>
    `);
  } else if (req.method === 'POST') {
    // Parse form data
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields) => {
      if (err) return res.status(500).send('Form parse error');
      let mapping = {};
      try {
        mapping = JSON.parse(JSON.stringify(fields.mapping));
      } catch (e) {
        mapping = fields.mapping || {};
      }
      // Remove empty values using for...of
      for (const k of Object.keys(mapping)) {
        if (!mapping[k]) delete mapping[k];
      }
      await saveBeehiivSettings({
        hubspot_user_id: user.hubspot_user_id,
        beehiiv_api_key: user.beehiiv_api_key,
        beehiiv_publication_id: publication_id,
        field_mapping: mapping
      });
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <html><body><h2>Mapping saved!</h2><a href="/api/mapping-ui?publication_id=${publication_id}">Back to mapping</a></body></html>
      `);
    });
  } else {
    res.status(405).send('Method Not Allowed');
  }
} 