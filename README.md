# Reefing App

## Local development

1. Copy `.env.example` to `.env.local` and fill in your values.
2. Install dependencies:

	 ```bash
	 pnpm install
	 ```

3. Run the app:

	 ```bash
	 pnpm dev
	 ```

## Auth0 production setup

In your Auth0 Application settings, configure:

- **Allowed Callback URLs**
	- `https://your-production-domain.com/auth/callback`
- **Allowed Logout URLs**
	- `https://your-production-domain.com`
- **Allowed Web Origins**
	- `https://your-production-domain.com`

If you also use local development, include:

- `http://localhost:3001/auth/callback`
- `http://localhost:3001`

## Production environment variables

Set these in your hosting provider (for example, Vercel):

- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_SECRET` (32-byte hex string)
- `APP_BASE_URL` (your public production URL)
- `DATABASE_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `NEXT_PUBLIC_AWS_S3_BUCKET`
- `NEXT_PUBLIC_AWS_REGION`

The app also supports `VERCEL_URL` as a fallback for Auth0 base URL resolution.

## Build for production

```bash
pnpm build
pnpm start
```
