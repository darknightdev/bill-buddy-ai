# Environment Setup for Frontend

This document explains how to configure environment variables for the frontend application.

## Local Development

1. Create a `.env.local` file in the frontend directory:
```bash
# Copy the example file
cp .env.example .env.local
```

2. Update the `.env.local` file with your local backend URL:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Production Deployment

### Vercel Deployment

1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Environment Variables" section
3. Add the following environment variable:
   - **Name**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: Your production backend URL (e.g., `https://your-backend-domain.com`)
   - **Environment**: Production (and Preview if needed)

### Other Platforms

For other deployment platforms, set the `NEXT_PUBLIC_API_BASE_URL` environment variable to point to your production backend.

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the backend API | `http://localhost:4000` | Yes |

## Notes

- The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the client-side code
- The configuration is centralized in `src/lib/config.ts`
- All API calls use the `buildApiUrl()` helper function to construct proper URLs
- The backend URL should not include a trailing slash 