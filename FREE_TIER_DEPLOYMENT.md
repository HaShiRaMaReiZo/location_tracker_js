# Render Free Tier Deployment Guide (No Commands Needed)

## 🎯 For Free Tier Users

On Render's **free tier**, you configure everything through the **web dashboard** - no commands needed! This guide shows you exactly what to click and fill in.

## ✅ Step-by-Step (Dashboard Only)

### Step 1: Push Code to GitHub

1. **Initialize Git** (if needed):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Repository name: `location-tracker-backend`
   - Click "Create repository"

3. **Push Code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/location-tracker-backend.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create PostgreSQL Database

1. **Go to Render**: https://dashboard.render.com
2. **Click "New +"** (top right)
3. **Click "PostgreSQL"**

4. **Fill in the form**:
   - **Name**: `location-tracker-db`
   - **Database**: `locationtracker`
   - **User**: `locationtracker`
   - **Region**: Choose closest (e.g., `Oregon (US West)`)
   - **PostgreSQL Version**: `Latest` (default)
   - **Plan**: **Free** ✅
   - **Datadog API Key**: (Leave empty)

5. **Click "Create Database"**
6. **Wait 1-2 minutes** for database to be ready

7. **Copy Database URL**:
   - Click on your database
   - Find **"Internal Database URL"** section
   - Click **"Copy"** button
   - **Save this** - you'll need it in Step 4

### Step 3: Create Web Service

1. **In Render Dashboard**, click **"New +"**
2. **Click "Web Service"**

3. **Connect Repository**:
   - If first time: Click **"Connect account"** → Authorize GitHub
   - Select your repository: `location-tracker-backend`
   - Click **"Connect"**

4. **Fill in Service Settings**:

   **Basic Settings**:
   - **Name**: `location-tracker-backend`
   - **Region**: Same as database (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: **Leave EMPTY** ✅ (backend is in root)
   - **Environment**: **Node** ✅
   - **Build Command**: `npm install` ✅
   - **Start Command**: `npm start` ✅
   - **Plan**: **Free** ✅

   **Advanced Settings** (Click "Advanced" to expand):
   - **Auto-Deploy**: `Yes` (default)
   - **Health Check Path**: (Leave empty)
   - **Dockerfile Path**: (Leave empty)

5. **Add Environment Variables**:
   
   Click **"Add Environment Variable"** for each:

   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Exact text |
   | `DATABASE_URL` | (Paste Internal Database URL from Step 2) | The one you copied |
   | `JWT_SECRET` | `your-random-secret-key-here-12345` | Any random string (32+ chars) |
   | `JWT_EXPIRES_IN` | `24h` | Exact text |

   **Important**: 
   - **DO NOT** add `PORT` - Render sets it automatically
   - Use **Internal Database URL** (not External)
   - For `JWT_SECRET`, use any random string like: `my-super-secret-jwt-key-2024-abc123xyz`

6. **Click "Create Web Service"**

### Step 4: Wait for Deployment

1. **Watch the Logs**:
   - You'll see build progress
   - Look for: `npm install` running
   - Then: `npm start` running
   - Finally: `Server running on port XXXX` ✅

2. **Check for Errors**:
   - If you see errors, check:
     - Database URL is correct
     - JWT_SECRET is set
     - All environment variables are added

3. **Get Your Service URL**:
   - Once deployed, you'll see your service URL
   - Example: `https://location-tracker-backend.onrender.com`
   - **Copy this URL**

### Step 5: Test Your Backend

1. **Test Health Endpoint**:
   - Visit: `https://your-service-name.onrender.com/health`
   - Should see: `{"status":"ok","timestamp":"..."}` ✅

2. **Test API** (Optional):
   - Visit: `https://your-service-name.onrender.com/api/auth/register`
   - Should see an error (that's OK - means server is running!)

### Step 6: Update Flutter App

1. **Open**: `flutter_app/lib/config/app_config.dart`

2. **Update the URL**:
   ```dart
   static const String baseUrl = 'https://your-service-name.onrender.com';
   ```
   Replace `your-service-name` with your actual Render service name

3. **Save and test**:
   - Run Flutter app
   - Try to register/login
   - Should connect to Render backend ✅

## 🎯 Quick Reference: What to Fill In

### Database Settings
- Name: `location-tracker-db`
- Plan: **Free**
- Copy **Internal Database URL**

### Web Service Settings
- Name: `location-tracker-backend`
- Environment: **Node**
- Root Directory: **EMPTY** ✅
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: **Free**

### Environment Variables (4 total)
1. `NODE_ENV` = `production`
2. `DATABASE_URL` = (Internal Database URL)
3. `JWT_SECRET` = (Random string)
4. `JWT_EXPIRES_IN` = `24h`

## ⚠️ Free Tier Limitations

1. **Service Sleeps After 15 Minutes**:
   - If no requests for 15 minutes, service goes to sleep
   - First request after sleep takes 30-60 seconds
   - This is normal - service wakes up automatically

2. **No SSH Access**:
   - Can't run commands directly
   - Everything configured through dashboard ✅

3. **WebSocket Works**:
   - WebSockets work fine on free tier
   - Connection may drop if service sleeps
   - Client should reconnect automatically

## 🐛 Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Check all files are pushed to GitHub
- Verify `package.json` is in root
- Check build logs for specific error

**Error: "Database connection failed"**
- Verify `DATABASE_URL` uses **Internal** URL (not External)
- Check database is running (green status)
- Ensure database and service are in same region

### Service Won't Start

**Error: "Port already in use"**
- Don't add `PORT` environment variable
- Render sets it automatically

**Error: "JWT_SECRET not set"**
- Add `JWT_SECRET` environment variable
- Use any random string (32+ characters)

### Can't Connect from Flutter

**Error: "Network error"**
- Verify service URL is correct
- Check service is running (visit `/health`)
- Wait 30-60 seconds if service was sleeping

## ✅ Success Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] Internal Database URL copied
- [ ] Web service created
- [ ] All 4 environment variables added
- [ ] Service deployed successfully
- [ ] Health endpoint works (`/health`)
- [ ] Flutter app updated with service URL
- [ ] Tested registration/login from Flutter

## 🎉 You're Done!

Your backend is now live at: `https://your-service-name.onrender.com`

**No commands needed** - everything done through the dashboard! 🚀

