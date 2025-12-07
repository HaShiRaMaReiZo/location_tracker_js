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

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
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
