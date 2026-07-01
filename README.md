# 🚗 Smart Employee Commute System

A web-based ride sharing platform for employees with real-time map tracking,
GST-based cost splitting, and savings dashboard.

---

## 🛠️ Tech Stack
- Frontend  : React.js + Leaflet (OpenStreetMap)
- Backend   : Node.js + Express.js
- Database  : MongoDB
- Real-time : Socket.io
- Maps      : OpenStreetMap via react-leaflet (FREE — No API key needed)
- Vehicles  : Car (15 km/liter) + Bike (40 km/liter)

---

## 📁 Folder Structure

```
smart-commute/
├── backend/
│   ├── config/              # DB connection
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   └── rideController.js
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── models/
│   │   ├── Employee.js
│   │   └── Ride.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── rideRoutes.js
│   ├── utils/
│   │   ├── costCalculator.js  # GST + fuel cost logic
│   │   └── haversine.js       # Distance calculation
│   ├── .env
│   └── server.js
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── CostCard.jsx   # GST cost breakdown
│       │   ├── MapView.jsx    # OpenStreetMap view
│       │   └── Navbar.jsx
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── Dashboard.jsx  # Main ride booking page
│       │   ├── Login.jsx
│       │   ├── MyRides.jsx
│       │   ├── Register.jsx
│       │   └── Savings.jsx    # Savings dashboard
│       ├── utils/
│       │   └── api.js
│       ├── App.js
│       └── index.js
```

---

## 🚀 Setup Instructions

### Step 1 — Install MongoDB
Download and install from: https://mongodb.com/try/download/community

### Step 2 — Setup Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at: http://localhost:5000

### Step 3 — Setup Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs at: http://localhost:3000

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description     |
|--------|-----------------------|-----------------|
| POST   | /api/auth/register    | Register employee |
| POST   | /api/auth/login       | Login employee  |
| GET    | /api/auth/profile     | Get profile     |

### Rides
| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| POST   | /api/rides/create           | Create new ride        |
| POST   | /api/rides/join             | Join existing ride     |
| GET    | /api/rides/active           | Get all active rides   |
| GET    | /api/rides/match            | Find matching rides    |
| GET    | /api/rides/my-rides         | Get my rides           |
| GET    | /api/rides/savings          | Get savings data       |
| POST   | /api/rides/location         | Update live location   |
| PATCH  | /api/rides/complete/:rideId | Complete a ride        |

---

## 💰 Cost Calculation Formula

```
Fuel Cost         = (Distance ÷ Mileage) × ₹103
Ride GST (5%)     = Fuel Cost × 0.05
Total Ride Cost   = Fuel Cost + Ride GST
Base Share        = Total Ride Cost ÷ Passengers  (Rider excluded)
Employee GST (5%) = Base Share × 0.05
Employee Pays     = Base Share + Employee GST
Rider Pays        = ₹0 (Travels FREE!)
```

---

## 👥 User Roles
- **Rider** — Creates ride, provides vehicle, travels FREE
- **Passenger** — Joins existing ride, pays their share + GST

---

## 🌟 Key Features
- ✅ Employee registration & JWT login
- ✅ OpenStreetMap integration (FREE)
- ✅ Haversine formula ride matching (2km radius)
- ✅ GST calculation (CGST 2.5% + SGST 2.5%)
- ✅ Rider travels FREE when passengers join
- ✅ Real-time updates via Socket.io
- ✅ Savings dashboard with CO2 tracking
- ✅ Car + Bike vehicle support
