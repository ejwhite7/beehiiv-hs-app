# Beehiiv ↔ HubSpot Sync (Backend)

## Features
- HubSpot OAuth (no frontend)
- Beehiiv webhook handler for real-time sync
- PostgreSQL for storage
- Deployable on Vercel

## Setup

1. Clone this repo and install dependencies:
   ```
   npm install
   ```

2. Set up your PostgreSQL database and run the provided SQL (see below).

3. Copy `.env.example` to `.env` and fill in your secrets.

4. Deploy to Vercel.

## Database Schema

See below for SQL.

## Endpoints

- `/api/oauth/callback` — HubSpot OAuth callback
- `/api/beehiiv/webhook` — Beehiiv webhook receiver
- `/api/setup` — (POST) Set Beehiiv API key, publication, field mapping

## License

MIT 