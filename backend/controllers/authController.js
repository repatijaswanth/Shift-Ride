const Employee = require('../models/Employee');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, companyName, vehicleType } = req.body;
    if (await Employee.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    const hashed  = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      name, email, password: hashed, phone, companyName,
      vehicleType: vehicleType || 'car'
    });

    res.status(201).json({
      message: 'Registration successful',
      employee: { id: employee._id, name: employee.name, email: employee.email }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(400).json({ message: 'Employee not found' });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { id: employee._id, email: employee.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful', token,
      employee: {
        id: employee._id, name: employee.name,
        email: employee.email, phone: employee.phone,
        companyName: employee.companyName, vehicleType: employee.vehicleType
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id).select('-password');
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
