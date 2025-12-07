# Project Structure

## Backend (`/`)

```
location-tracker-backend/
├── config/
│   └── database.js          # PostgreSQL connection and table creation
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Authentication endpoints (register, login)
│   └── location.js          # Location endpoints (optional storage)
├── socket/
│   └── socketHandler.js     # WebSocket handlers for real-time updates
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env.example            # Environment variables template
├── render.yaml              # Render deployment configuration
└── README.md                # Backend documentation
```

## Flutter App (`/flutter_app`)

```
flutter_app/
├── lib/
│   ├── config/
│   │   └── app_config.dart          # Backend URL configuration
│   ├── services/
│   │   ├── auth_service.dart         # Authentication API calls
│   │   ├── location_service.dart     # Location tracking service
│   │   ├── socket_service.dart       # WebSocket client
│   │   └── background_location_service.dart  # Background tracking
│   ├── screens/
│   │   ├── login_screen.dart         # Login/Register UI
│   │   └── map_screen.dart           # Map view with tracking
│   └── main.dart                     # App entry point
├── android/
│   └── app/
│       └── src/main/
│           └── AndroidManifest.xml   # Android permissions
├── ios/
│   └── Runner/
│       └── Info.plist                # iOS permissions
└── pubspec.yaml                      # Flutter dependencies
```

## Key Features

### Backend
- **Express.js** - Web framework
- **Socket.io** - WebSocket for real-time communication
- **PostgreSQL** - Database (free on Render)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Flutter
- **geolocator** - Location tracking
- **flutter_background_service** - Background tracking
- **socket_io_client** - WebSocket client
- **flutter_map** - OpenStreetMap integration
- **shared_preferences** - Local storage

## Data Flow

1. **User Registration/Login**
   - Flutter → Backend API → JWT token returned
   - Token stored locally

2. **Location Tracking**
   - Flutter gets location from device GPS
   - Location sent via WebSocket to backend
   - Backend broadcasts to all connected clients
   - Map updates in real-time

3. **Background Tracking**
   - Background service runs independently
   - Continues sending location updates
   - Works even when app is closed

