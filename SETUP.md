# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Flutter SDK installed
- PostgreSQL database (free on Render)
- Git repository (GitHub/GitLab/Bitbucket)

## Backend Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

**Important**: 
- For local testing, use your local PostgreSQL connection string
- For Render deployment, use the Internal Database URL from Render
- Generate a strong JWT_SECRET (use `openssl rand -hex 32`)

### 3. Test Locally (Optional)

```bash
npm start
```

Visit `http://localhost:3000/health` to verify it's running.

## Flutter App Setup

### 1. Install Dependencies

```bash
cd flutter_app
flutter pub get
```

### 2. Configure Backend URL

Edit `lib/config/app_config.dart`:

**For Production (Render):**
```dart
static const String baseUrl = 'https://your-app-name.onrender.com';
```

**For Local Testing:**
- Android Emulator: `http://10.0.2.2:3000`
- iOS Simulator: `http://localhost:3000`
- Physical Device: `http://YOUR_COMPUTER_IP:3000`

### 3. Run the App

```bash
flutter run
```

## Deployment to Render

See `DEPLOYMENT.md` for detailed instructions.

### Quick Steps:

1. Push code to GitHub
2. Create PostgreSQL database on Render
3. Create Web Service on Render
4. Set environment variables
5. Deploy
6. Update Flutter app with Render URL

## Testing

1. **Register Account**
   - Open Flutter app
   - Click "Register"
   - Enter email and password (min 6 characters)

2. **Start Tracking**
   - Grant location permissions
   - Click "Start Tracking"
   - Move around to see location updates

3. **Background Tracking**
   - Start tracking
   - Minimize or close the app
   - Location continues to update

## Troubleshooting

### Backend Issues

**Database connection error:**
- Verify DATABASE_URL is correct
- Check database is running
- Ensure SSL is configured for production

**Port already in use:**
- Change PORT in `.env`
- Or kill process using port 3000

### Flutter Issues

**Can't connect to backend:**
- Verify baseUrl in `app_config.dart`
- Check backend is running
- For physical device, ensure phone and computer are on same network

**Location not updating:**
- Grant location permissions in device settings
- Enable location services
- Check AndroidManifest.xml / Info.plist permissions

**Background tracking not working:**
- Grant "Always" location permission
- Check device battery optimization settings
- Verify background service is running

### Common Errors

**"No token provided" (Socket.io):**
- Ensure you're logged in
- Token might be expired, try logging out and back in

**"Location permissions not granted":**
- Go to device Settings → App → Permissions
- Grant location permission (Always for background)

**Render service sleeping:**
- Free tier services sleep after 15 min inactivity
- First request may take 30-60 seconds
- Consider upgrading to paid plan for always-on service

## Next Steps

- Customize UI colors and branding
- Add location history feature
- Implement multiple user tracking
- Add geofencing features
- Set up monitoring and alerts

