const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  phone:       { type: String, required: true },
  companyName: { type: String, required: true },
  vehicleType: { type: String, enum: ['car', 'bike'], default: 'car' },
  homeLocation: {
    latitude:  { type: Number },
    longitude: { type: Number },
    address:   { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
