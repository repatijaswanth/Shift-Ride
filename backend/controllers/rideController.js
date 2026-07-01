const Ride                  = require('../models/Ride');
const { calculateFullCost } = require('../utils/costCalculator');
const { calculateDistance } = require('../utils/haversine');

const MATCH_RADIUS_KM = 2;

// CREATE RIDE
exports.createRide = async (req, res) => {
  try {
    const { startLocation, destination, vehicleType } = req.body;
    const riderId      = req.employee.id;
    const distanceInKm = calculateDistance(
      startLocation.latitude, startLocation.longitude,
      destination.latitude,   destination.longitude
    );
    const costs = calculateFullCost(distanceInKm, 0, vehicleType || 'car');

    const ride = await Ride.create({
      rider: riderId,
      passengers: [],
      startLocation,
      destination,
      distanceInKm:    costs.distanceInKm,
      fuelCost:        costs.fuelCost,
      totalRideCost:   costs.totalRideCost,
      vehicleType:     vehicleType || 'car',
      riderCollects:   0,
      riderPays:       costs.totalRideCost
    });

    await ride.populate('rider', 'name phone companyName vehicleType');
    res.status(201).json({ message: 'Ride created', ride, costs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// JOIN RIDE
exports.joinRide = async (req, res) => {
  try {
    const { rideId }  = req.body;
    const passengerId = req.employee.id;
    const ride        = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (ride.rider.toString() === passengerId)
      return res.status(400).json({ message: 'You are the rider' });

    if (ride.passengers.some(p => p.employee.toString() === passengerId))
      return res.status(400).json({ message: 'Already joined this ride' });

    if (ride.passengers.length >= ride.maxPassengers)
      return res.status(400).json({ message: 'Ride is full' });

    const newCount = ride.passengers.length + 1;
    const costs    = calculateFullCost(ride.distanceInKm, newCount, ride.vehicleType);

    // Add new passenger
    ride.passengers.push({
      employee:  passengerId,
      costShare: costs.costPerPassenger,
      totalPays: costs.costPerPassenger
    });

    // Update all existing passengers with new split cost
    ride.passengers = ride.passengers.map(p => ({
      ...p.toObject(),
      costShare: costs.costPerPassenger,
      totalPays: costs.costPerPassenger
    }));

    ride.costPerPassenger = costs.costPerPassenger;
    ride.riderCollects    = costs.riderCollects;
    ride.riderPays        = 0;
    await ride.save();
    await ride.populate('rider', 'name phone companyName');
    await ride.populate('passengers.employee', 'name phone');

    res.json({ message: 'Joined ride successfully', ride, costs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// FIND MATCHING RIDES
exports.findMatchingRides = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const activeRides = await Ride.find({
      status: 'active',
      $expr: { $lt: [{ $size: '$passengers' }, '$maxPassengers'] }
    }).populate('rider', 'name phone companyName vehicleType');

    const matched = activeRides.filter(ride => {
      const dist = calculateDistance(
        parseFloat(latitude), parseFloat(longitude),
        ride.startLocation.latitude, ride.startLocation.longitude
      );
      return dist <= MATCH_RADIUS_KM;
    });

    res.json({ count: matched.length, rides: matched });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL ACTIVE RIDES
exports.getActiveRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'active' })
      .populate('rider',               'name phone companyName vehicleType')
      .populate('passengers.employee', 'name phone')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET MY RIDES
exports.getMyRides = async (req, res) => {
  try {
    const id    = req.employee.id;
    const rides = await Ride.find({
      $or: [{ rider: id }, { 'passengers.employee': id }]
    })
      .populate('rider',               'name phone companyName')
      .populate('passengers.employee', 'name phone')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE RIDER LIVE LOCATION
exports.updateLocation = async (req, res) => {
  try {
    const { rideId, latitude, longitude } = req.body;
    await Ride.findByIdAndUpdate(rideId, {
      currentLocation: { latitude, longitude }
    });
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// COMPLETE RIDE
exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.rider.toString() !== req.employee.id)
      return res.status(403).json({ message: 'Only rider can complete ride' });
    ride.status = 'completed';
    await ride.save();
    res.json({ message: 'Ride completed', ride });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SAVINGS DASHBOARD DATA
exports.getSavings = async (req, res) => {
  try {
    const id    = req.employee.id;
    const rides = await Ride.find({
      $or: [{ rider: id }, { 'passengers.employee': id }],
      status: 'completed'
    });

    let totalSaved    = 0;
    let totalRides    = rides.length;
    let totalDistance = 0;
    let co2Saved      = 0;

    rides.forEach(ride => {
      totalDistance += ride.distanceInKm || 0;
      const isPassenger = ride.passengers.some(p => p.employee.toString() === id);
      if (isPassenger) {
        // Passenger saved vs riding solo
        const saved = (ride.totalRideCost || 0) - (ride.costPerPassenger || 0);
        totalSaved += saved;
      } else {
        // Rider's fuel was covered by passengers
        totalSaved += ride.riderCollects || 0;
      }
      co2Saved += (ride.distanceInKm || 0) * 0.12 * (ride.passengers.length || 1);
    });

    res.json({
      totalRides,
      totalSaved:    parseFloat(totalSaved.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      co2Saved:      parseFloat(co2Saved.toFixed(2)),
      monthlySaved:  parseFloat((totalSaved / Math.max(1, totalRides / 22)).toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
