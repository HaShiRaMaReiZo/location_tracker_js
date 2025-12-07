# Deployment Guide

> **📖 For a complete step-by-step guide, see [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)**

## Quick Deployment Summary

## Backend Deployment on Render

### Step 1: Prepare Your Repository

1. Push your code to GitHub/GitLab/Bitbucket
2. Make sure `.env` is in `.gitignore` (already done)

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Create a new PostgreSQL database
4. Note the **Internal Database URL** (you'll use this)

### Step 3: Deploy Backend

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: `location-tracker-backend` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your choice)

5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (Internal Database URL from Step 2)
   - `JWT_SECRET` = (Generate a random string, e.g., use `openssl rand -hex 32`)
   - `JWT_EXPIRES_IN` = `24h`
   - `PORT` = (Leave empty, Render sets this automatically)

6. Click "Create Web Service"

### Step 4: Update Flutter App

1. Once deployed, copy your Render service URL (e.g., `https://location-tracker-backend.onrender.com`)
2. Open `flutter_app/lib/config/app_config.dart`
3. Update:
   ```dart
   static const String baseUrl = 'https://your-app-name.onrender.com';
   ```
4. Replace `your-app-name` with your actual Render service name

### Step 5: Test

1. Run the Flutter app
2. Register a new account
3. Start tracking
4. Verify location updates are being sent to the server

## Important Notes

- **Free Tier Limitations**: Render free tier services spin down after 15 minutes of inactivity. First request may take 30-60 seconds to wake up.
- **WebSocket Support**: Render supports WebSockets, but ensure your service stays active for real-time tracking.
- **Database**: PostgreSQL on Render free tier is sufficient for testing.
- **JWT Secret**: Use a strong, random secret in production. Never commit it to Git.

## Troubleshooting

### Backend not connecting
- Check Render service logs
- Verify DATABASE_URL is correct
- Ensure JWT_SECRET is set

### Flutter app can't connect
- Verify baseUrl in `app_config.dart` matches your Render URL
- Check if backend service is running (visit `/health` endpoint)
- For local testing, ensure backend is running locally

### Location not updating
- Check app permissions (Settings → App → Permissions)
- Verify background location permission is granted
- Check device location services are enabled

### WebSocket connection issues
- Ensure backend URL uses `https://` (not `http://`)
- Check Render service is not sleeping (free tier limitation)
- Verify JWT token is valid

