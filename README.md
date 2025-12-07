# Location Tracker Backend (JavaScript/Node.js)

Real-time location tracking server integrated with Laravel backend.

## Features

- ✅ **Socket.io** - Real-time WebSocket communication
- ✅ **Laravel Integration** - Receives location updates from Laravel via HTTP POST
- ✅ **Office Map** - Broadcasts all rider locations to office dashboard
- ✅ **Merchant App** - Broadcasts rider location only when package status is "on_the_way"
- ✅ **No Database** - Uses Laravel's database, only handles real-time broadcasting

## Architecture

```
Laravel Backend → HTTP POST → Location Tracker JS → Socket.io → Clients
```

### Flow:

1. **Rider App** sends location to Laravel API
2. **Laravel** saves location and forwards to Location Tracker JS via HTTP POST
3. **Location Tracker JS** broadcasts via Socket.io to:
   - Office map: All riders (room: `office.riders.locations`)
   - Merchant app: Only when package status is "on_the_way" (room: `merchant.package.{packageId}.location`)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file (optional - PORT is auto-set on Render):**
   ```env
   PORT=3000
   NODE_ENV=production
   ```

3. **Run:**
   ```bash
   npm start
   ```

## Deployment on Render (Free Plan)

**✅ You only need a Web Service - NO DATABASE required!**

1. Create new **Web Service** (not database)
2. Connect to GitHub repository
3. Root directory: `location_tracker_js`
4. Environment: `node`
5. Build command: `npm install`
6. Start command: `npm start`
7. Environment variable: `NODE_ENV=production`
8. PORT is automatically set by Render

**Note**: Free tier services sleep after 15 min inactivity (same as Laravel service)

## API Endpoints

### POST /api/location/update

Receives location updates from Laravel.

**Request Body:**
```json
{
  "rider_id": 1,
  "latitude": 16.7890,
  "longitude": 96.1270,
  "package_id": 38,
  "last_update": "2025-12-05T11:00:00Z"
}
```

**Query Parameters:**
- `package_status` (optional) - If "on_the_way", broadcasts to merchant channel

**Response:**
```json
{
  "message": "Location update received and broadcasted",
  "rider_id": 1,
  "package_id": 38
}
```

## Socket.io Events

### Client → Server

- `join:office` - Join office map room (receives all rider locations)
- `join:merchant` - Join merchant room (receives rider location for specific package)
  ```javascript
  socket.emit('join:merchant', {
    merchant_id: 2,
    package_id: 38
  });
  ```

### Server → Client

- `connected` - Connection confirmation
- `location:update` - Real-time location update
  ```javascript
  {
    rider_id: 1,
    latitude: 16.7890,
    longitude: 96.1270,
    timestamp: "2025-12-05T11:00:00Z",
    package_id: 38
  }
  ```
- `location:all` - All current rider locations (sent when joining office room)

## Deployment

### Render.com

1. Create new Web Service
2. Set environment:
   - `env: node`
   - `buildCommand: npm install`
   - `startCommand: npm start`
3. Set `PORT` environment variable (auto-set by Render)

## Integration with Laravel

Laravel sends location updates via HTTP POST:

```php
Http::timeout(2)->post($jsServerUrl . '/api/location/update?package_status=' . $packageStatus, [
    'rider_id' => $riderId,
    'latitude' => $latitude,
    'longitude' => $longitude,
    'package_id' => $packageId,
    'last_update' => now()->toIso8601String()
]);
```

## Notes

- No authentication required - Laravel handles authentication
- No database - uses Laravel's database
- In-memory storage of rider locations (lost on restart)
- Office map always receives all rider locations
- Merchant app only receives location when package status is "on_the_way"
