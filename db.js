import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function saveUserTokens({ hubspot_user_id, access_token, refresh_token }) {
  await pool.query(
    'INSERT INTO users (hubspot_user_id, hubspot_access_token, hubspot_refresh_token)\n     VALUES ($1, $2, $3)\n     ON CONFLICT (hubspot_user_id) DO UPDATE\n     SET hubspot_access_token = $2, hubspot_refresh_token = $3, updated_at = NOW()',
    [hubspot_user_id, access_token, refresh_token]
  );
}

export async function getUserByPublication(publication_id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE beehiiv_publication_id = $1 LIMIT 1',
    [publication_id]
  );
  return rows[0];
}

export async function saveBeehiivSettings({ hubspot_user_id, beehiiv_api_key, beehiiv_publication_id, field_mapping }) {
  await pool.query(
    'UPDATE users SET beehiiv_api_key = $2, beehiiv_publication_id = $3, field_mapping = $4, updated_at = NOW()\n     WHERE hubspot_user_id = $1',
    [hubspot_user_id, beehiiv_api_key, beehiiv_publication_id, field_mapping]
  );
}

export async function logWebhookEvent({ user_id, event_type, payload }) {
  await pool.query(
    'INSERT INTO webhook_events (user_id, event_type, payload, processed, created_at)\n     VALUES ($1, $2, $3, false, NOW())',
    [user_id, event_type, JSON.stringify(payload)]
  );
} 