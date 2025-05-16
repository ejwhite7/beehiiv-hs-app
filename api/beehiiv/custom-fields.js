import axios from 'axios';
import { getUserByPublication } from '../../db.js';

export default async function handler(req, res) {
  const { publication_id } = req.query;
  const user = await getUserByPublication(publication_id);
  if (!user) return res.status(404).send('User not found');
  try {
    const resp = await axios.get(
      `https://api.beehiiv.com/v2/publications/${publication_id}/custom_fields`,
      { headers: { Authorization: `Bearer ${user.beehiiv_api_key}` } }
    );
    res.status(200).json(resp.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 