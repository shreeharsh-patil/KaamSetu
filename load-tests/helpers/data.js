/**
 * Synthetic payload generators for realistic marketplace benchmarking
 */

const LOCATIONS = [
  { city: 'Bengaluru', lat: 12.9716, lon: 77.5946, pincode: '560001' },
  { city: 'Bengaluru', lat: 12.9352, lon: 77.6245, pincode: '560034' }, // Koramangala
  { city: 'Bengaluru', lat: 12.9784, lon: 77.6408, pincode: '560038' }, // Indiranagar
  { city: 'Bengaluru', lat: 12.9141, lon: 77.6109, pincode: '560076' }, // BTM Layout
  { city: 'Bengaluru', lat: 13.0358, lon: 77.5970, pincode: '560024' }, // Hebbal
];

const JOB_TITLES = [
  'Fix Leaking Kitchen Sink',
  'Master Bedroom AC Servicing',
  'Main Switchboard Tripping Issue',
  'Deep House Cleaning Before Festival',
  'Wooden Door Hinge Repair & Polish',
  'Bathroom Tile Regrouting & Seal',
];

export function generateJobPayload(categoryId, skillIds = []) {
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const title = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
  const price = Math.floor(Math.random() * 4000) + 500; // 500 to 4500 INR

  return {
    categoryId: categoryId || '660000000000000000000001',
    requiredSkills: skillIds.length > 0 ? skillIds : ['660000000000000000000002'],
    title,
    description: `Urgent requirement for ${title}. Please send quotes and arrive on time.`,
    location: {
      type: 'Point',
      coordinates: [loc.lon, loc.lat],
    },
    address: {
      line: `${Math.floor(Math.random() * 900) + 100}, Cross Road`,
      city: loc.city,
      state: 'Karnataka',
      pincode: loc.pincode,
    },
    preferredTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    estimatedPrice: price,
    urgency: Math.random() > 0.3 ? 'STANDARD' : 'EMERGENCY',
  };
}
