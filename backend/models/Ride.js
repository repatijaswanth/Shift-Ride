const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  employee:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  costShare: { type: Number },
  totalPays: { type: Number }
});

const rideSchema = new mongoose.Schema({
  // Rider (driver) — NOT counted as passenger
  rider:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  passengers:    [passengerSchema],
  maxPassengers: { type: Number, default: 3 },

  startLocation: {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    address:   { type: String }
  },
  destination: {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
    address:   { type: String }
  },

  // Current rider live location (for real-time tracking)
  currentLocation: {
    latitude:  { type: Number },
    longitude: { type: Number }
  },

  vehicleType:     { type: String, enum: ['car', 'bike'], default: 'car' },
  distanceInKm:    { type: Number },

  // Cost breakdown
  fuelCost:         { type: Number },
  totalRideCost:    { type: Number },
  costPerPassenger: { type: Number },
  riderCollects:    { type: Number, default: 0 },
  riderPays:        { type: Number, default: 0 },

  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }

}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
