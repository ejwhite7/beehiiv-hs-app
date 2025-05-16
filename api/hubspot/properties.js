import axios from 'axios';
import { getUserByPublication } from '../../db.js';

export default async function handler(req, res) {
  const { publication_id } = req.query;
  const user = await getUserByPublication(publication_id);
  if (!user) return res.status(404).send('User not found');
  try {
    const resp = await axios.get(
      'https://api.hubapi.com/crm/v3/properties/contacts',
      { headers: { Authorization: `Bearer ${user.hubspot_access_token}` } }
    );
    res.status(200).json(resp.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 