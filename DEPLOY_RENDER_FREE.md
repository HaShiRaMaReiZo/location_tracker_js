# Deploy Location Tracker JS on Render (Free Plan)

## ✅ What You Need

**ONLY a Web Service - NO DATABASE required!**

The Location Tracker JS is completely stateless:
- ✅ No database needed (uses Laravel's database)
- ✅ No authentication needed (Laravel handles it)
- ✅ Just broadcasts Socket.io messages in real-time

## 🚀 Deployment Steps

### 1. Push to GitHub

If `location_tracker_js` is in your main repository:

```bash
cd location_tracker_js
git add .
git commit -m "Add JavaScript location tracker"
git push origin main
```

### 2. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `location-tracker-js` (or any name you like)
   - **Root Directory**: `location_tracker_js`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter if you want)

5. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = (auto-set by Render, don't add this)

6. Click **"Create Web Service"**

### 3. Wait for Deployment

- First deployment takes 2-3 minutes
- Render will install dependencies and start the server
- You'll get a URL like: `https://location-tracker-js-xxx.onrender.com`

### 4. Update Configuration

After deployment, update these files with your new URL:

#### Laravel `.env`:
```env
LOCATION_TRACKER_URL=https://location-tracker-js-xxx.onrender.com
```

#### Flutter `ok_delivery/lib/core/api/api_endpoints.dart`:
```dart
static const String websocketBaseUrl = 'https://location-tracker-js-xxx.onrender.com';
```

#### Office Map (already configured):
The office map uses `LOCATION_TRACKER_URL` from Laravel's `.env`, so it will automatically use the new URL.

## ⚠️ Free Plan Limitations

- **Sleep after 15 min inactivity**: Like your Laravel service, this will sleep if no requests for 15 minutes
- **First request after sleep**: Takes 30-60 seconds to wake up
- **Solution**: Use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping your service every 5 minutes

## ✅ Verify It's Working

1. **Check health endpoint**:
   ```
   https://your-location-tracker-js.onrender.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check logs** in Render dashboard:
   - Should see: `Location Tracker Server running on port XXXX`

3. **Test location update**:
   - Rider app sends location → Laravel → Location Tracker JS
   - Check Render logs for: `Location update broadcasted: rider_id=X...`

## 🎯 That's It!

No database needed. Just a simple Web Service that broadcasts Socket.io messages. The free plan is perfect for this!

