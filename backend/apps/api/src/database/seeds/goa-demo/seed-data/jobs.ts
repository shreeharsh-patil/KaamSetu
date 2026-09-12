/**
 * Goa demo seed data — jobs, offers and lifecycle scenarios.
 *
 * Times are relative to seed execution (see `minutesAgo` / `minutesFromNow`)
 * so the dataset never goes stale. All invariants (one accepted offer per job,
 * assigned worker matches accepted offer, coherent event history) are enforced
 * by the seed builder, not by this file.
 */
import type { GoaLocationKey } from './goa-locations.js';

export interface SeedJobDef {
  /** Deterministic key used by the builder to correlate offers/events. */
  key: string;
  customer: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** customer's nth saved address (1-based, defaults to 1 = default address) */
  addressIndex?: number;
  town: GoaLocationKey;
  category: string; // category slug
  /** skill slugs (must belong to the category) */
  skills: string[];
  title: string;
  description: string;
  urgency: 'FLEXIBLE' | 'TODAY' | 'EMERGENCY';
  /** rupees, stored on job as rupees (KaamSetu convention: jobs = rupees) */
  estimatedPrice: number;
  status: string; // JobStatus value
  /** minutes before "now" the job was created */
  createdMinutesAgo: number;
  /** for active/finished jobs: minutes after creation the worker was assigned */
  assignedAfterMinutes?: number;
  /** worker `n` from SEED_WORKERS (required for ACCEPTED and later) */
  workerN?: number;
  /** minutes from now; for future bookings */
  scheduledMinutesFromNow?: number;
  /** extra scenario notes surfaced in docs */
  scenario?: string;
}

export const SEED_JOBS: SeedJobDef[] = [
  // ───────────────────────── DRAFT (3) ─────────────────────────
  { key: 'draft-1', customer: 3, town: 'PORVORIM', category: 'electrician', skills: ['wiring'], title: 'Install pendant lights in dining area', description: 'Bought two pendant lamps, need them wired to existing switch.', urgency: 'FLEXIBLE', estimatedPrice: 0, status: 'DRAFT', createdMinutesAgo: 90 },
  { key: 'draft-2', customer: 7, town: 'MARGAO', category: 'carpentry', skills: ['shelf-installation'], title: 'Wall shelves for study room', description: 'Three floating shelves, brick wall.', urgency: 'FLEXIBLE', estimatedPrice: 0, status: 'DRAFT', createdMinutesAgo: 240 },
  { key: 'draft-3', customer: 1, town: 'PANAJI', category: 'home-cleaning', skills: ['deep-cleaning'], title: 'Pre-Diwali deep cleaning', description: 'Whole 2BHK deep clean before the festival.', urgency: 'FLEXIBLE', estimatedPrice: 0, status: 'DRAFT', createdMinutesAgo: 30 },

  // ───────────────────────── OPEN (4) ─────────────────────────
  { key: 'open-1', customer: 5, town: 'CALANGUTE', category: 'ac-repair', skills: ['cooling-issue'], title: 'AC not cooling properly', description: 'Split AC runs but barely cools. Probably needs gas top-up or service.', urgency: 'TODAY', estimatedPrice: 800, status: 'OPEN', createdMinutesAgo: 45, scenario: 'open-visibility' },
  { key: 'open-2', customer: 9, town: 'COLVA', category: 'painting', skills: ['interior-painting'], title: 'Bedroom wall needs repainting', description: 'One bedroom wall, patchy after the monsoon damp.', urgency: 'FLEXIBLE', estimatedPrice: 1200, status: 'OPEN', createdMinutesAgo: 200, scenario: 'open-visibility' },
  { key: 'open-3', customer: 12, town: 'VERNA', category: 'welding', skills: ['gate-welding'], title: 'Metal gate welding repair', description: 'Main gate hinge is coming loose and one bar is bent.', urgency: 'TODAY', estimatedPrice: 700, status: 'OPEN', createdMinutesAgo: 150, scenario: 'open-visibility' },
  { key: 'open-4', customer: 4, town: 'MAPUSA', category: 'motorbike-repair', skills: ['puncture-repair'], title: 'Scooter rear tyre puncture', description: 'Slow leak on the rear tyre, need it plugged or patched.', urgency: 'EMERGENCY', estimatedPrice: 300, status: 'OPEN', createdMinutesAgo: 25, scenario: 'open-visibility' },

  // ───────────────────────── MATCHING (4) ─────────────────────────
  { key: 'matching-1', customer: 2, town: 'PANAJI', category: 'electrical', skills: ['fan-repair'], title: 'Bedroom ceiling fan not working', description: 'Fan hums but doesn’t spin. Capacitor probably dead.', urgency: 'TODAY', estimatedPrice: 450, status: 'MATCHING', createdMinutesAgo: 35, scenario: 'multiple-nearby-electricians' },
  { key: 'matching-2', customer: 6, town: 'PONDA', category: 'carpentry', skills: ['door-repair'], title: 'Wooden door hinge broken', description: 'Main bedroom door hinge has pulled out of the frame.', urgency: 'FLEXIBLE', estimatedPrice: 400, status: 'MATCHING', createdMinutesAgo: 60, scenario: 'single-nearby-carpenter' },
  { key: 'matching-3', customer: 10, town: 'CANACONA', category: 'plumbing', skills: ['drain-blockage'], title: 'Bathroom drain blocked', description: 'Water collects around the drain and drains very slowly.', urgency: 'TODAY', estimatedPrice: 350, status: 'MATCHING', createdMinutesAgo: 50, scenario: 'radius-expansion-canacona' },
  { key: 'matching-4', customer: 8, town: 'VASCO', category: 'home-cleaning', skills: ['deep-cleaning'], title: '2BHK deep cleaning', description: 'Moving in soon, want a full deep clean first.', urgency: 'FLEXIBLE', estimatedPrice: 1500, status: 'MATCHING', createdMinutesAgo: 70, scenario: 'no-cleaning-workers-near-vasco' },

  // ───────────────────────── OFFERED (4) ─────────────────────────
  { key: 'offered-demo', customer: 1, town: 'PANAJI', category: 'plumbing', skills: ['pipe-leak-repair'], title: 'Kitchen sink leaking', description: 'Water pooling under the kitchen sink, looks like the drain pipe joint.', urgency: 'TODAY', estimatedPrice: 600, status: 'OFFERED', createdMinutesAgo: 20, assignedAfterMinutes: 8, workerN: 1, scenario: 'PANAJI_PLUMBER_DEMO — pending offer to Demo Plumber' },
  { key: 'offered-2', customer: 2, town: 'PANAJI', category: 'electrical', skills: ['mcb-repair'], title: 'MCB tripping repeatedly', description: 'Living room MCB trips whenever the geyser switches on.', urgency: 'TODAY', estimatedPrice: 500, status: 'OFFERED', createdMinutesAgo: 40, assignedAfterMinutes: 10, workerN: 2 },
  { key: 'offered-3', customer: 6, town: 'PONDA', category: 'electrical', skills: ['wiring'], title: 'New socket for kitchen appliance', description: 'Need a 16A socket added in the kitchen.', urgency: 'FLEXIBLE', estimatedPrice: 550, status: 'OFFERED', createdMinutesAgo: 55, assignedAfterMinutes: 12, workerN: 18, scenario: 'offline-worker-offered — worker 18 is OFFLINE, offer still pending response' },
  { key: 'offered-4', customer: 7, town: 'MARGAO', category: 'appliance-repair', skills: ['washing-machine-repair'], title: 'Washing machine not draining', description: 'Water stays in the drum after the wash cycle.', urgency: 'TODAY', estimatedPrice: 650, status: 'OFFERED', createdMinutesAgo: 65, assignedAfterMinutes: 14, workerN: 19 },

  // ───────────────────────── ACCEPTED (4) ─────────────────────────
  { key: 'accepted-demo', customer: 1, town: 'PANAJI', category: 'plumbing', skills: ['tap-repair', 'sink-repair'], title: 'Bathroom tap replacement', description: 'Replace the worn-out bathroom basin tap, I have the new tap.', urgency: 'TODAY', estimatedPrice: 550, status: 'ACCEPTED', createdMinutesAgo: 120, assignedAfterMinutes: 15, workerN: 1, scenario: 'demo-active-job — Demo Plumber accepted, conversation seeded' },
  { key: 'accepted-2', customer: 3, town: 'PORVORIM', category: 'painting', skills: ['wall-touch-up'], title: 'Hall wall touch-up before guests', description: 'Scuff marks and one patch that needs repainting.', urgency: 'TODAY', estimatedPrice: 450, status: 'ACCEPTED', createdMinutesAgo: 100, assignedAfterMinutes: 20, workerN: 6 },
  { key: 'accepted-3', customer: 5, town: 'CALANGUTE', category: 'electrical', skills: ['light-installation'], title: 'Install two wall lights', description: 'Two wall lamps bought from the shop, need mounting and wiring.', urgency: 'FLEXIBLE', estimatedPrice: 600, status: 'ACCEPTED', createdMinutesAgo: 180, assignedAfterMinutes: 25, workerN: 12 },
  { key: 'accepted-4', customer: 7, town: 'MARGAO', category: 'appliance-repair', skills: ['refrigerator-repair'], title: 'Refrigerator not cooling', description: 'Fridge compartment warm, freezer still cold.', urgency: 'EMERGENCY', estimatedPrice: 900, status: 'ACCEPTED', createdMinutesAgo: 90, assignedAfterMinutes: 18, workerN: 19 },

  // ───────────────────────── EN_ROUTE (2) ─────────────────────────
  { key: 'enroute-demo', customer: 1, town: 'PANAJI', category: 'plumbing', skills: ['pipe-leak-repair'], title: 'Bathroom pipe joint leaking', description: 'Drip from the joint behind the geyser.', urgency: 'EMERGENCY', estimatedPrice: 750, status: 'EN_ROUTE', createdMinutesAgo: 70, assignedAfterMinutes: 10, workerN: 1, scenario: 'worker-in-transit — Demo Plumber travelling' },
  { key: 'enroute-2', customer: 9, town: 'COLVA', category: 'appliance-repair', skills: ['washing-machine-repair'], title: 'Washing machine shakes violently', description: 'Machine jumps during spin cycle, probably leveling or drum issue.', urgency: 'TODAY', estimatedPrice: 600, status: 'EN_ROUTE', createdMinutesAgo: 110, assignedAfterMinutes: 20, workerN: 19 },

  // ───────────────────────── ARRIVED (2) ─────────────────────────
  { key: 'arrived-demo', customer: 1, town: 'PANAJI', category: 'electrical', skills: ['socket-repair'], title: 'Sparking socket in bedroom', description: 'Socket sparked once when plugging in the charger. Smells slightly burnt.', urgency: 'EMERGENCY', estimatedPrice: 500, status: 'ARRIVED', createdMinutesAgo: 55, assignedAfterMinutes: 10, workerN: 2, scenario: 'worker-on-site — Amit Naik arrived' },
  { key: 'arrived-2', customer: 7, town: 'MARGAO', category: 'appliance-repair', skills: ['water-purifier-repair'], title: 'Water purifier no output', description: 'RO purifier stopped dispensing water.', urgency: 'TODAY', estimatedPrice: 550, status: 'ARRIVED', createdMinutesAgo: 80, assignedAfterMinutes: 15, workerN: 19 },

  // ───────────────────────── IN_PROGRESS (3) ─────────────────────────
  { key: 'inprogress-demo', customer: 1, town: 'PANAJI', category: 'plumbing', skills: ['drain-blockage'], title: 'Kitchen drain running slow', description: 'Kitchen sink drains slowly, likely grease build-up in the pipe.', urgency: 'TODAY', estimatedPrice: 400, status: 'IN_PROGRESS', createdMinutesAgo: 150, assignedAfterMinutes: 20, workerN: 1, scenario: 'work-started — Demo Plumber on the job' },
  { key: 'inprogress-2', customer: 6, town: 'PONDA', category: 'carpentry', skills: ['woodwork'], title: 'Wardrobe door alignment', description: 'Wardrobe doors have dropped and don’t close flush.', urgency: 'FLEXIBLE', estimatedPrice: 500, status: 'IN_PROGRESS', createdMinutesAgo: 200, assignedAfterMinutes: 30, workerN: 16 },
  { key: 'inprogress-3', customer: 11, town: 'CANDOLIM', category: 'painting', skills: ['waterproof-coating'], title: 'Balcony waterproofing before monsoon', description: 'Balcony leaks into the room below during heavy rain.', urgency: 'FLEXIBLE', estimatedPrice: 2500, status: 'IN_PROGRESS', createdMinutesAgo: 300, assignedAfterMinutes: 45, workerN: 13 },

  // ───────────────────────── COMPLETED (16) ─────────────────────────
  // Demo pair with review + full history
  { key: 'done-demo-reviewable', customer: 1, town: 'PANAJI', category: 'plumbing', skills: ['pipe-leak-repair'], title: 'Kitchen sink leaking', description: 'Pipe under the sink was leaking at the joint.', urgency: 'TODAY', estimatedPrice: 500, status: 'COMPLETED', createdMinutesAgo: 4320, assignedAfterMinutes: 30, workerN: 1, scenario: 'REVIEWABLE — completed but not yet reviewed (demo customer dashboard)' },
  { key: 'done-1', customer: 2, town: 'PANAJI', category: 'plumbing', skills: ['tap-repair'], title: 'Bathroom tap dripping continuously', description: 'Tap washer worn out.', urgency: 'FLEXIBLE', estimatedPrice: 350, status: 'COMPLETED', createdMinutesAgo: 5760, assignedAfterMinutes: 40, workerN: 1 },
  { key: 'done-2', customer: 2, town: 'PANAJI', category: 'electrical', skills: ['fan-repair'], title: 'Hall fan making noise', description: 'Bearing noise at high speed.', urgency: 'FLEXIBLE', estimatedPrice: 300, status: 'COMPLETED', createdMinutesAgo: 7200, assignedAfterMinutes: 35, workerN: 2 },
  { key: 'done-3', customer: 3, town: 'PORVORIM', category: 'electrical', skills: ['switch-repair'], title: 'Two switches replaced', description: 'Switch plates cracked.', urgency: 'FLEXIBLE', estimatedPrice: 250, status: 'COMPLETED', createdMinutesAgo: 8640, assignedAfterMinutes: 50, workerN: 2 },
  { key: 'done-4', customer: 4, town: 'MAPUSA', category: 'plumbing', skills: ['toilet-repair'], title: 'Toilet flush running nonstop', description: 'Flush valve doesn’t seal.', urgency: 'TODAY', estimatedPrice: 400, status: 'COMPLETED', createdMinutesAgo: 10080, assignedAfterMinutes: 30, workerN: 8 },
  { key: 'done-5', customer: 5, town: 'CALANGUTE', category: 'ac-repair', skills: ['ac-servicing'], title: 'AC general service', description: 'Annual service, filter cleaning and gas check.', urgency: 'FLEXIBLE', estimatedPrice: 700, status: 'COMPLETED', createdMinutesAgo: 11520, assignedAfterMinutes: 60, workerN: 11 },
  { key: 'done-6', customer: 6, town: 'PONDA', category: 'plumbing', skills: ['water-tank-plumbing'], title: 'Overhead tank pipe replacement', description: 'Old galvanised pipe replaced with PVC.', urgency: 'FLEXIBLE', estimatedPrice: 1800, status: 'COMPLETED', createdMinutesAgo: 12960, assignedAfterMinutes: 45, workerN: 17 },
  { key: 'done-7', customer: 7, town: 'MARGAO', category: 'appliance-repair', skills: ['refrigerator-repair'], title: 'Fridge thermostat replaced', description: 'Fridge over-cooling and icing up.', urgency: 'FLEXIBLE', estimatedPrice: 850, status: 'COMPLETED', createdMinutesAgo: 14400, assignedAfterMinutes: 40, workerN: 19 },
  { key: 'done-8', customer: 8, town: 'VASCO', category: 'ac-repair', skills: ['gas-refill'], title: 'AC gas refill', description: 'Cooling dropped after two summers.', urgency: 'TODAY', estimatedPrice: 1500, status: 'COMPLETED', createdMinutesAgo: 15840, assignedAfterMinutes: 35, workerN: 23 },
  { key: 'done-9', customer: 9, town: 'COLVA', category: 'painting', skills: ['wall-touch-up'], title: 'Living room touch-up', description: 'Patch work after furniture move.', urgency: 'FLEXIBLE', estimatedPrice: 300, status: 'COMPLETED', createdMinutesAgo: 17280, assignedAfterMinutes: 55, workerN: 21 },
  { key: 'done-10', customer: 11, town: 'CANDOLIM', category: 'electrical', skills: ['light-installation'], title: 'Garden lights installed', description: 'Four garden pole lights wired.', urgency: 'FLEXIBLE', estimatedPrice: 1200, status: 'COMPLETED', createdMinutesAgo: 18720, assignedAfterMinutes: 50, workerN: 12 },
  { key: 'done-11', customer: 12, town: 'VERNA', category: 'welding', skills: ['grill-repair'], title: 'Window grill repair', description: 'Two bars re-welded after rust-out.', urgency: 'FLEXIBLE', estimatedPrice: 450, status: 'COMPLETED', createdMinutesAgo: 20160, assignedAfterMinutes: 40, workerN: 14 },
  { key: 'done-12', customer: 10, town: 'CANACONA', category: 'general-handyman', skills: ['furniture-shifting'], title: 'Furniture shifted within the house', description: 'Two heavy items moved upstairs.', urgency: 'FLEXIBLE', estimatedPrice: 350, status: 'COMPLETED', createdMinutesAgo: 21600, assignedAfterMinutes: 65, workerN: 31 },
  { key: 'done-13', customer: 1, town: 'PANAJI', category: 'carpentry', skills: ['furniture-repair'], title: 'Dining chair repair', description: 'Two chairs re-glued and clamped.', urgency: 'FLEXIBLE', estimatedPrice: 300, status: 'COMPLETED', createdMinutesAgo: 25920, assignedAfterMinutes: 45, workerN: 3 },
  { key: 'done-14', customer: 4, town: 'MAPUSA', category: 'appliance-repair', skills: ['mixer-repair'], title: 'Mixer grinder not starting', description: 'Carbon brushes replaced.', urgency: 'TODAY', estimatedPrice: 280, status: 'COMPLETED', createdMinutesAgo: 30240, assignedAfterMinutes: 55, workerN: 9 },
  // Disputed job (COMPLETED + dispute raised)
  { key: 'done-15-disputed', customer: 8, town: 'VASCO', category: 'appliance-repair', skills: ['refrigerator-repair'], title: 'Fridge cooling issue repair', description: 'Cooling coil cleaned, worked for a day.', urgency: 'TODAY', estimatedPrice: 950, status: 'COMPLETED', createdMinutesAgo: 2880, assignedAfterMinutes: 30, workerN: 19, scenario: 'DISPUTED — customer says issue returned next day (dispute seeded)' },
  // one extra COMPLETED so completed count reaches 16
  { key: 'done-16', customer: 3, town: 'PORVORIM', category: 'carpentry', skills: ['lock-fitting'], title: 'Main door lock replaced', description: 'Old lock cylinder replaced with new one.', urgency: 'FLEXIBLE', estimatedPrice: 400, status: 'COMPLETED', createdMinutesAgo: 34560, assignedAfterMinutes: 40, workerN: 27 },

  // ───────────────────────── CANCELLED (3) ─────────────────────────
  { key: 'cancelled-1', customer: 2, town: 'PANAJI', category: 'electrical', skills: ['wiring'], title: 'Additional power point in garage', description: 'Customer found a local electrician instead.', urgency: 'FLEXIBLE', estimatedPrice: 600, status: 'CANCELLED', createdMinutesAgo: 4320, scenario: 'cancelled-before-matching' },
  { key: 'cancelled-2', customer: 5, town: 'CALANGUTE', category: 'carpentry', skills: ['furniture-repair'], title: 'Sofa frame repair', description: 'Cancelled: planned to replace the sofa instead.', urgency: 'FLEXIBLE', estimatedPrice: 900, status: 'CANCELLED', createdMinutesAgo: 5760, scenario: 'cancelled-before-matching' },
  { key: 'cancelled-3', customer: 7, town: 'MARGAO', category: 'painting', skills: ['interior-painting'], title: 'Two rooms interior painting', description: 'Cancelled: postponed to next month.', urgency: 'FLEXIBLE', estimatedPrice: 3500, status: 'CANCELLED', createdMinutesAgo: 7200, scenario: 'cancelled-before-matching' },

  // ───────────────────────── EXPIRED (2) ─────────────────────────
  { key: 'expired-1', customer: 9, town: 'COLVA', category: 'electrical', skills: ['fan-repair'], title: 'Fan capacitor replacement', description: 'No workers accepted within the offer window.', urgency: 'TODAY', estimatedPrice: 300, status: 'EXPIRED', createdMinutesAgo: 2880, scenario: 'no-eligible-worker-nearby — led to expiry' },
  { key: 'expired-2', customer: 10, town: 'CANACONA', category: 'ac-repair', skills: ['ac-servicing'], title: 'AC servicing in Canacona', description: 'No nearby AC technician accepted in time.', urgency: 'FLEXIBLE', estimatedPrice: 700, status: 'EXPIRED', createdMinutesAgo: 4320, scenario: 'no-eligible-worker-nearby — led to expiry' },
];

/** Conversation scripts: key → message list (sender: customer or worker). */
export interface SeedConversationDef {
  jobKey: string;
  /** fraction of messages left unread by the recipient (0 = all read) */
  unreadRatio: number;
  messages: Array<{ from: 'customer' | 'worker'; text: string; minutesAfterAssignment: number }>;
}

export const SEED_CONVERSATIONS: SeedConversationDef[] = [
  {
    jobKey: 'accepted-demo',
    unreadRatio: 0.25,
    messages: [
      { from: 'customer', text: 'Hi, the tap in the bathroom needs replacing. I already bought the new one.', minutesAfterAssignment: 2 },
      { from: 'worker', text: 'I’ve accepted the job. I should reach around 4 PM.', minutesAfterAssignment: 6 },
      { from: 'customer', text: 'Okay, please call when you reach.', minutesAfterAssignment: 8 },
      { from: 'worker', text: 'I’m near the building. Please keep the new tap ready.', minutesAfterAssignment: 40 },
    ],
  },
  {
    jobKey: 'enroute-demo',
    unreadRatio: 0.5,
    messages: [
      { from: 'customer', text: 'The leak got worse, water is dripping faster now.', minutesAfterAssignment: 5 },
      { from: 'worker', text: 'I’m on my way, leaving Panaji market now. About 15 minutes.', minutesAfterAssignment: 12 },
      { from: 'customer', text: 'Thanks, gate is open, it’s the first floor.', minutesAfterAssignment: 20 },
      { from: 'worker', text: 'Noted, see you shortly.', minutesAfterAssignment: 26 },
    ],
  },
  {
    jobKey: 'inprogress-demo',
    unreadRatio: 0,
    messages: [
      { from: 'worker', text: 'Started the work. Might need to cut a small section of the pipe.', minutesAfterAssignment: 15 },
      { from: 'customer', text: 'Okay, please clean up after cutting.', minutesAfterAssignment: 18 },
      { from: 'worker', text: 'Will do. Should be done in about an hour.', minutesAfterAssignment: 22 },
    ],
  },
  {
    jobKey: 'done-demo-reviewable',
    unreadRatio: 0,
    messages: [
      { from: 'customer', text: 'Hi, the sink is leaking under the cabinet.', minutesAfterAssignment: 3 },
      { from: 'worker', text: 'I can come by this evening. Will check the drain pipe joint.', minutesAfterAssignment: 10 },
      { from: 'customer', text: 'Great, see you in the evening.', minutesAfterAssignment: 12 },
    ],
  },
  {
    jobKey: 'done-1',
    unreadRatio: 0,
    messages: [
      { from: 'customer', text: 'The tap drips even when fully closed.', minutesAfterAssignment: 5 },
      { from: 'worker', text: 'Probably the washer. I’ll bring spares.', minutesAfterAssignment: 12 },
    ],
  },
  {
    jobKey: 'done-7',
    unreadRatio: 0,
    messages: [
      { from: 'customer', text: 'Frost keeps building up in the freezer.', minutesAfterAssignment: 6 },
      { from: 'worker', text: 'Likely the thermostat. I’ll test and replace if needed.', minutesAfterAssignment: 15 },
    ],
  },
];

/** Review plan for completed jobs (workerN → ratings/comments). */
export interface SeedReviewDef {
  jobKey: string;
  rating: number;
  quality?: number;
  punctuality?: number;
  communication?: number;
  comment: string;
}

export const SEED_REVIEWS: SeedReviewDef[] = [
  { jobKey: 'done-1', rating: 5, quality: 5, punctuality: 5, communication: 5, comment: 'Arrived on time and fixed the leak quickly.' },
  { jobKey: 'done-2', rating: 4, quality: 4, punctuality: 4, communication: 5, comment: 'Work was neat and the issue is resolved.' },
  { jobKey: 'done-3', rating: 5, quality: 5, punctuality: 4, communication: 5, comment: 'Good communication and professional work.' },
  { jobKey: 'done-4', rating: 4, quality: 4, punctuality: 3, communication: 4, comment: 'Repair worked but arrival was later than expected.' },
  { jobKey: 'done-5', rating: 5, quality: 5, punctuality: 5, communication: 5, comment: 'AC service was thorough. Explained everything clearly.' },
  { jobKey: 'done-6', rating: 4, quality: 5, punctuality: 4, communication: 4, comment: 'Solid work on the tank pipe.' },
  { jobKey: 'done-7', rating: 3, quality: 3, punctuality: 3, communication: 4, comment: 'Fixed the thermostat but had to visit twice.' },
  { jobKey: 'done-8', rating: 5, quality: 5, punctuality: 5, communication: 4, comment: 'Quick gas refill and cooling is back.' },
  { jobKey: 'done-9', rating: 4, quality: 4, punctuality: 4, communication: 4, comment: 'Neat paint touch-up.' },
  { jobKey: 'done-10', rating: 5, quality: 5, punctuality: 4, communication: 5, comment: 'Garden lights look great.' },
  { jobKey: 'done-11', rating: 3, quality: 3, punctuality: 4, communication: 3, comment: 'Weld was okay but had to follow up for the visit.' },
  { jobKey: 'done-12', rating: 4, quality: 4, punctuality: 5, communication: 4, comment: 'Helpful with the heavy shifting.' },
  { jobKey: 'done-13', rating: 5, quality: 5, punctuality: 5, communication: 5, comment: 'Chairs look as good as new.' },
  { jobKey: 'done-14', rating: 4, quality: 4, punctuality: 4, communication: 5, comment: 'Mixer works fine now.' },
  { jobKey: 'done-16', rating: 5, quality: 5, punctuality: 5, communication: 5, comment: 'Fast lock replacement.' },
];

/** Expense plan for demo worker (amounts in RUPEES — builder converts to paise). */
export interface SeedExpenseDef {
  workerN: number;
  jobKey?: string;
  category: 'FUEL' | 'MATERIAL' | 'PARKING' | 'TOOL' | 'PLATFORM_FEE' | 'OTHER';
  amountRupees: number;
  note: string;
  minutesAgo: number;
}

export const SEED_EXPENSES: SeedExpenseDef[] = [
  { workerN: 1, jobKey: 'done-demo-reviewable', category: 'MATERIAL', amountRupees: 120, note: 'Pipe joint sealant', minutesAgo: 4100 },
  { workerN: 1, jobKey: 'done-1', category: 'MATERIAL', amountRupees: 60, note: 'Tap washer set', minutesAgo: 5500 },
  { workerN: 1, jobKey: 'done-1', category: 'FUEL', amountRupees: 130, note: 'Petrol for the day', minutesAgo: 5450 },
  { workerN: 1, jobKey: 'done-16', category: 'FUEL', amountRupees: 110, note: 'Fuel across Panaji visits', minutesAgo: 800 },
  { workerN: 1, category: 'TOOL', amountRupees: 450, note: 'New pipe wrench', minutesAgo: 9000 },
  { workerN: 1, category: 'PARKING', amountRupees: 40, note: 'Market parking', minutesAgo: 4300 },
  { workerN: 2, jobKey: 'done-2', category: 'MATERIAL', amountRupees: 90, note: 'Fan capacitor', minutesAgo: 7000 },
  { workerN: 19, jobKey: 'done-7', category: 'MATERIAL', amountRupees: 260, note: 'Thermostat unit', minutesAgo: 14000 },
  { workerN: 19, category: 'FUEL', amountRupees: 150, note: 'Margao–Vasco trips', minutesAgo: 13000 },
];
