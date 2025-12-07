# Quick Render Deployment (5 Minutes) - Free Tier Friendly

> **💡 Free Tier Users**: You configure everything through the dashboard - no commands needed! See [FREE_TIER_DEPLOYMENT.md](./FREE_TIER_DEPLOYMENT.md) for detailed dashboard instructions.

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created (free tier is fine!)

## 🚀 Deploy in 5 Steps (Dashboard Only)

### 1. Create PostgreSQL Database
- Render Dashboard → "New +" → "PostgreSQL"
- Name: `location-tracker-db`
- Plan: Free
- **Copy Internal Database URL**

### 2. Create Web Service
- Render Dashboard → "New +" → "Web Service"
- Connect your GitHub repository
- Settings:
  - **Name**: `location-tracker-backend`
  - **Environment**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Root Directory**: (Leave empty - backend is in root)

### 3. Add Environment Variables
Click "Advanced" → Add these:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (Paste Internal Database URL) |
| `JWT_SECRET` | (Random string, e.g., `my-super-secret-key-12345`) |
| `JWT_EXPIRES_IN` | `24h` |

**Note**: Don't add `PORT` - Render sets it automatically.

### 4. Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for deployment
- Check logs for: `Server running on port XXXX`

### 5. Update Flutter App
- Get your service URL from Render (e.g., `https://location-tracker-backend.onrender.com`)
- Edit `flutter_app/lib/config/app_config.dart`:
  ```dart
  static const String baseUrl = 'https://your-service-name.onrender.com';
  ```

## 🎯 Test It

1. Visit: `https://your-service.onrender.com/health`
2. Should see: `{"status":"ok","timestamp":"..."}`
3. Run Flutter app and register/login

## ⚠️ Important

- **Free tier sleeps after 15 min** - First request may take 30-60 seconds
- **Use Internal Database URL** (not External)
- **Backend files are in root** - Render will automatically ignore `flutter_app` folder

## 📚 Need More Details?

See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for complete guide.

