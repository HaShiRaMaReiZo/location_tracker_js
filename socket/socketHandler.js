const axios = require('axios');

// Store active connections: userId -> socketId
const activeConnections = new Map();
// Store rider locations: riderId -> { latitude, longitude, timestamp, package_id }
const riderLocations = new Map();

let ioInstance = null;

/**
 * Broadcast location update to appropriate rooms
 */
const broadcastLocationUpdate = (data) => {
  if (!ioInstance) {
    console.error('Socket.io not initialized');
    return;
  }

  const { rider_id, latitude, longitude, package_id, package_status, timestamp } = data;

  // Store latest location with rider_id
  riderLocations.set(rider_id, {
    rider_id,
    latitude,
    longitude,
    timestamp,
    package_id: package_id || null
  });

  // Always broadcast to office map (all riders)
  ioInstance.to('office.riders.locations').emit('location:update', {
    rider_id,
    latitude,
    longitude,
    timestamp,
    package_id: package_id || null
  });

  // Broadcast to merchant app only if package status is "on_the_way"
  if (package_id && package_status === 'on_the_way') {
    const merchantChannel = `merchant.package.${package_id}.location`;
    ioInstance.to(merchantChannel).emit('location:update', {
      rider_id,
      latitude,
      longitude,
      timestamp,
      package_id
    });
    
    console.log(`Broadcasted location update for rider ${rider_id} to merchant channel: ${merchantChannel}`);
  }

  console.log(`Location update broadcasted: rider_id=${rider_id}, lat=${latitude}, lng=${longitude}, package_id=${package_id || 'null'}, status=${package_status || 'null'}`);
};

/**
 * Initialize Socket.io
 * No authentication required - clients connect and join rooms based on their role
 */
const initializeSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle office map connection (shows all riders)
    socket.on('join:office', () => {
      socket.join('office.riders.locations');
      console.log(`Client ${socket.id} joined office.riders.locations`);

      // Send all current rider locations to the newly connected office client
      const allLocations = Array.from(riderLocations.entries()).map(([riderId, location]) => ({
        rider_id: riderId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        package_id: location.package_id
      }));

      socket.emit('location:all', allLocations);
    });

    // Handle merchant app connection (shows rider only when package is on_the_way)
    socket.on('join:merchant', (data) => {
      const { merchant_id, package_id } = data;
      
      if (!merchant_id || !package_id) {
        socket.emit('error', { message: 'merchant_id and package_id required' });
        return;
      }

      const merchantChannel = `merchant.package.${package_id}.location`;
      socket.join(merchantChannel);
      console.log(`Client ${socket.id} joined ${merchantChannel} (merchant_id: ${merchant_id}, package_id: ${package_id})`);

      // Send current rider location if available (find rider with this package_id)
      const riderLocation = Array.from(riderLocations.entries())
        .map(([riderId, location]) => ({ rider_id: riderId, ...location }))
        .find(loc => loc.package_id === parseInt(package_id));

      if (riderLocation) {
        socket.emit('location:update', {
          rider_id: riderLocation.rider_id,
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          timestamp: riderLocation.timestamp,
          package_id: parseInt(package_id)
        });
      }
    });

    // Handle rider location updates (direct from rider app via Socket.io)
    socket.on('location:update', async (data) => {
      try {
        const { rider_id, latitude, longitude, package_id, speed, heading, timestamp } = data;

        // Validate location data
        if (!rider_id || typeof latitude !== 'number' || typeof longitude !== 'number') {
          socket.emit('error', { message: 'Invalid location data: rider_id, latitude, and longitude are required' });
          return;
        }

        // Store rider connection
        activeConnections.set(rider_id, socket.id);

        // Get package status from Laravel if package_id is provided
        let packageStatus = null;
        if (package_id) {
          try {
            const laravelUrl = process.env.LARAVEL_URL || 'https://ok-delivery.onrender.com';
            const response = await axios.get(
              `${laravelUrl}/api/rider/packages/${package_id}`,
              { 
                timeout: 2000,
                headers: {
                  'Accept': 'application/json'
                }
              }
            ).catch(() => null);
            
            if (response?.data?.package?.status) {
              packageStatus = response.data.package.status;
            }
          } catch (err) {
            // If Laravel is unavailable, continue without status check
            console.warn(`Could not fetch package status from Laravel: ${err.message}`);
          }
        }

        // Broadcast location update
        broadcastLocationUpdate({
          rider_id: parseInt(rider_id),
          latitude,
          longitude,
          package_id: package_id ? parseInt(package_id) : null,
          package_status: packageStatus,
          timestamp: timestamp || new Date().toISOString()
        });

        // Forward to Laravel for database storage (optional, non-blocking)
        // Note: This is optional - real-time tracking works without Laravel storage
        const laravelUrl = process.env.LARAVEL_URL || 'https://ok-delivery.onrender.com';
        axios.post(
          `${laravelUrl}/api/rider/location/store`,
          {
            rider_id: rider_id,
            latitude: latitude,
            longitude: longitude,
            package_id: package_id || null,
            speed: speed || null,
            heading: heading || null,
          },
          {
            timeout: 2000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        ).catch((err) => {
          // Silently fail - Laravel storage is optional for real-time tracking
          // console.warn(`Could not store location in Laravel: ${err.message}`);
        });

        // Confirm receipt
        socket.emit('location:received', {
          rider_id,
          timestamp: timestamp || new Date().toISOString()
        });

      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to process location update' });
      }
    });

    // Handle rider registration (optional - for tracking which riders are connected)
    socket.on('join:rider', (data) => {
      const { rider_id } = data;
      if (rider_id) {
        activeConnections.set(parseInt(rider_id), socket.id);
        socket.join(`rider:${rider_id}`);
        console.log(`Rider ${rider_id} connected: ${socket.id}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove from active connections
      for (const [riderId, socketId] of activeConnections.entries()) {
        if (socketId === socket.id) {
          activeConnections.delete(riderId);
          break;
        }
      }
    });

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to location tracking server',
      socketId: socket.id
    });
  });
};

/**
 * Get all rider locations (for debugging/admin)
 */
const getAllRiderLocations = () => {
  return Array.from(riderLocations.entries()).map(([riderId, location]) => ({
    rider_id: riderId,
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: location.timestamp,
    package_id: location.package_id
  }));
};

module.exports = {
  initializeSocket,
  broadcastLocationUpdate,
  getAllRiderLocations,
  activeConnections
};
