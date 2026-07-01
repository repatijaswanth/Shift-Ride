const FUEL_CONFIG = {
  fuelPricePerLiter: 103,
  mileage: { car: 15, bike: 40 }
};

function calculateFullCost(distanceInKm, passengerCount, vehicleType = 'car') {
  const mileage   = FUEL_CONFIG.mileage[vehicleType] || 15;
  const fuelPrice = FUEL_CONFIG.fuelPricePerLiter;

  // Total fuel cost for the ride
  const fuelCost      = (distanceInKm / mileage) * fuelPrice;
  const totalRideCost = fuelCost;

  // Per passenger share (rider NOT counted)
  const costPerPassenger = passengerCount > 0
    ? totalRideCost / passengerCount
    : totalRideCost;

  // Rider collects from all passengers
  const riderCollects = costPerPassenger * passengerCount;

  // Savings compared to riding solo
  const dailySaving   = totalRideCost - costPerPassenger;
  const monthlySaving = dailySaving * 22;
  const yearlySaving  = dailySaving * 264;

  const r = v => parseFloat(v.toFixed(2));

  return {
    distanceInKm:      r(distanceInKm),
    vehicleType,
    mileage,
    fuelCost:          r(fuelCost),
    totalRideCost:     r(totalRideCost),
    passengerCount,
    costPerPassenger:  r(costPerPassenger),
    riderCollects:     r(riderCollects),
    riderPays:         0,
    dailySaving:       r(dailySaving),
    monthlySaving:     r(monthlySaving),
    yearlySaving:      r(yearlySaving)
  };
}

module.exports = { calculateFullCost };
