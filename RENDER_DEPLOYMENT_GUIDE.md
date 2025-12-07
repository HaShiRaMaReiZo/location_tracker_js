# Complete Render Deployment Guide

> **💡 Free Tier Users**: If you're on Render's free plan, see [FREE_TIER_DEPLOYMENT.md](./FREE_TIER_DEPLOYMENT.md) for a guide that uses only the dashboard (no commands needed).

## 🎯 Overview

This guide will help you deploy the backend to Render while keeping the Flutter app in the same repository.

## 📋 Prerequisites

1. GitHub/GitLab/Bitbucket account
2. Render account (free tier available)
3. Your code pushed to a Git repository

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to GitHub.com
   - Click "New repository"
   - Name it (e.g., `location-tracker-backend`)
   - **Don't** initialize with README
   - Click "Create repository"

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/location-tracker-backend.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create PostgreSQL Database on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"PostgreSQL"**
3. **Configure Database**:
   - **Name**: `location-tracker-db` (or any name)
   - **Database**: `locationtracker`
   - **User**: `locationtracker`
   - **Region**: Choose closest to you
   - **Plan**: Free (or your choice)
4. **Click "Create Database"**
5. **Wait for database to be created** (takes 1-2 minutes)
6. **Copy the Internal Database URL**:
   - Go to your database dashboard
   - Find "Internal Database URL"
   - Copy it (you'll need this later)

### Step 3: Deploy Backend Web Service

1. **Go to Render Dashboard**
2. **Click "New +"** → **"Web Service"**
3. **Connect Repository**:
   - Connect your GitHub account (if not connected)
   - Select your repository: `location-tracker-backend`
   - Click "Connect"

4. **Configure Service**:
   - **Name**: `location-tracker-backend` (or your choice)
   - **Environment**: `Node`
   - **Region**: Same as database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (backend files are in root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your choice)

5. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable" and add:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | (Paste Internal Database URL from Step 2) |
   | `JWT_SECRET` | (Generate: `openssl rand -hex 32` or use any random string) |
   | `JWT_EXPIRES_IN` | `24h` |
   | `PORT` | (Leave empty - Render sets this automatically) |

   **To generate JWT_SECRET**:
   - On Mac/Linux: Run `openssl rand -hex 32` in terminal
   - On Windows: Use PowerShell: `-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})`
   - Or use any random string (at least 32 characters)

6. **Click "Create Web Service"**

7. **Wait for Deployment**:
   - Render will install dependencies
   - Build your service
   - Start the server
   - Takes 3-5 minutes

### Step 4: Verify Deployment

1. **Check Build Logs**:
   - In Render dashboard, click on your service
   - Go to "Logs" tab
   - Look for: `Server running on port XXXX`
   - Should see: `Database connected successfully`
   - Should see: `Database tables initialized`

2. **Test Health Endpoint**:
   - Go to "Settings" → Find your service URL (e.g., `https://location-tracker-backend.onrender.com`)
   - Visit: `https://your-service-url.onrender.com/health`
   - Should see: `{"status":"ok","timestamp":"..."}`

3. **Test API**:
   - Try: `https://your-service-url.onrender.com/api/auth/register`
   - Should get a response (even if error, means server is running)

### Step 5: Update Flutter App Configuration

1. **Get Your Render Service URL**:
   - From Render dashboard → Your service → Settings
   - Copy the service URL (e.g., `https://location-tracker-backend.onrender.com`)

2. **Update Flutter App**:
   - Open: `flutter_app/lib/config/app_config.dart`
   - Update:
     ```dart
     static const String baseUrl = 'https://your-service-name.onrender.com';
     ```
   - Replace `your-service-name` with your actual Render service name

3. **Test Connection**:
   - Run Flutter app
   - Try to register/login
   - Should connect to Render backend

## 🔧 Important Notes

### Render Free Tier Limitations

1. **Service Sleeps After 15 Minutes**:
   - Free tier services spin down after 15 min of inactivity
   - First request after sleep takes 30-60 seconds to wake up
   - This is normal for free tier

2. **WebSocket Connection**:
   - WebSockets work on Render
   - But if service sleeps, connection will drop
   - Client should reconnect automatically

3. **Database**:
   - Free PostgreSQL is sufficient for testing
   - Has 90-day retention
   - Perfect for development/testing

### Troubleshooting

#### Build Fails

**Error: "Cannot find module"**
- Check `package.json` has all dependencies
- Verify `npm install` runs successfully
- Check build logs for specific errors

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is correct
- Use **Internal Database URL** (not External)
- Check database is running in Render dashboard

#### Service Won't Start

**Error: "Port already in use"**
- Remove `PORT` environment variable (Render sets it automatically)
- Or set `PORT` to empty

**Error: "JWT_SECRET not set"**
- Add `JWT_SECRET` environment variable
- Generate a random string

#### Flutter Can't Connect

**Error: "Network error"**
- Verify Render service URL is correct
- Check service is running (visit `/health` endpoint)
- For local testing, use `http://10.0.2.2:3000` (Android) or `http://localhost:3000` (iOS)

**Error: "Socket connection failed"**
- Ensure backend URL uses `https://` (not `http://`)
- Check service is not sleeping
- Verify WebSocket is enabled in Render (it is by default)

## 📝 Alternative: Deploy Backend Only

If you want to deploy only the backend (without Flutter app):

### Option 1: Separate Repository (Recommended)

1. Create a new repository: `location-tracker-backend-only`
2. Copy only backend files:
   ```
   - config/
   - middleware/
   - routes/
   - socket/
   - server.js
   - package.json
   - .gitignore
   ```
3. Push to new repository
4. Deploy from new repository

### Option 2: Use .renderignore (Not Available)

Render doesn't support `.renderignore`, but you can:
- Use `render.yaml` with `ignorePaths` (already configured)
- Or deploy from a separate branch

### Option 3: Deploy from Subdirectory

If backend was in a subdirectory, you'd set:
- **Root Directory**: `backend` (or your subdirectory name)

But since backend is in root, leave it empty.

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Web service created on Render
- [ ] Environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` (Internal URL)
  - [ ] `JWT_SECRET` (random string)
  - [ ] `JWT_EXPIRES_IN=24h`
- [ ] Service deployed successfully
- [ ] Health endpoint works (`/health`)
- [ ] Flutter app updated with Render URL
- [ ] Tested registration/login from Flutter app

## 🎉 Success!

Once deployed, your backend will be available at:
`https://your-service-name.onrender.com`

Update your Flutter app and start tracking! 🚀

## 📞 Need Help?

- Check Render logs for errors
- Verify all environment variables are set
- Test endpoints manually using Postman or curl
- Check database connection in Render dashboard

