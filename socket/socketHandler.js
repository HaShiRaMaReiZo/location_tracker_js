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

  // Broadcast to merchant app if package_id is provided
  // If package_status is null (couldn't fetch from Laravel), we'll broadcast anyway
  // The merchant app will filter based on its own package status check
  if (package_id) {
    const merchantChannel = `merchant.package.${package_id}.location`;
    
    // Only broadcast if status is "on_the_way" OR if status is null (assume on_the_way)
    // This ensures merchant app receives updates even if we can't fetch status from Laravel
    if (!package_status || package_status === 'on_the_way') {
      ioInstance.to(merchantChannel).emit('location:update', {
        rider_id,
        latitude,
        longitude,
        timestamp,
        package_id
      });
      
      console.log(`Broadcasted location update for rider ${rider_id} to merchant channel: ${merchantChannel} (status: ${package_status || 'unknown'})`);
    }
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
        // Note: This endpoint requires auth, so we'll skip it for now
        // The merchant app will only receive updates when package status is "on_the_way"
        // Since we can't easily get status without auth, we'll broadcast to merchant channel
        // if package_id is provided (merchant app will filter based on its own package status check)
        let packageStatus = null;
        
        // Try to get package status (optional - will fail silently if auth required)
        if (package_id) {
          try {
            const laravelUrl = process.env.LARAVEL_URL || 'https://ok-delivery-service.onrender.com';
            const response = await axios.get(
              `${laravelUrl}/api/rider/packages/${package_id}`,
              { 
                timeout: 1000, // Shorter timeout since this is optional
                headers: {
                  'Accept': 'application/json'
                }
              }
            ).catch(() => null);
            
            if (response?.data?.package?.status) {
              packageStatus = response.data.package.status;
            } else if (response?.data?.status) {
              // Alternative response structure
              packageStatus = response.data.status;
            }
          } catch (err) {
            // Silently fail - status check is optional
            // We'll broadcast anyway if package_id is provided
          }
        }
        
        // If we couldn't get status but package_id is provided, assume "on_the_way"
        // This allows merchant app to receive updates (merchant app will filter based on its own status check)
        if (package_id && !packageStatus) {
          packageStatus = 'on_the_way'; // Default assumption
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
        const laravelUrl = process.env.LARAVEL_URL || 'https://ok-delivery-service.onrender.com';
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
        ).then((response) => {
          if (response?.status === 200) {
            console.log(`✅ Location saved to Laravel database: rider_id=${rider_id}, lat=${latitude}, lng=${longitude}`);
          } else {
            console.warn(`⚠️ Laravel returned non-200 status: ${response?.status} for rider_id=${rider_id}`);
          }
        }).catch((err) => {
          // Log the error so we can see why database save is failing
          console.error(`❌ Failed to store location in Laravel database: rider_id=${rider_id}, error=${err.message}`);
          if (err.response) {
            console.error(`   Response status: ${err.response.status}, data:`, err.response.data);
          }
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
