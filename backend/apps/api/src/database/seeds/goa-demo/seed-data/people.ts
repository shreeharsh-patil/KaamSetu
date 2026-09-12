/**
 * Goa demo seed data — synthetic people.
 *
 * SAFETY: every person here is fictional. Names are invented, phone numbers use
 * reserved test ranges (+91 99000 0xxx), and address lines are generic
 * neighbourhood descriptions, never real residences.
 */
import type { GoaLocationKey } from './goa-locations.js';

/** Reserved, deterministic, obviously synthetic phone plan (10 digits after +91). */
export const DEMO_PHONES = {
  customer: (n: number) => `+919900001${String(n).padStart(3, '0')}`,
  worker: (n: number) => `+919900002${String(n).padStart(3, '0')}`,
  admin: '+919900009001',
} as const;

export interface SeedWorkerDef {
  /** 1-based, drives phone + jitter deterministically */
  n: number;
  displayName: string;
  town: GoaLocationKey;
  /** category slug (must exist in categories.ts) */
  category: string;
  /** skill slugs under that category (at least one) */
  skills: string[];
  experienceYears: number;
  languages: string[];
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  verification: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  serviceRadiusKm: number;
  /** rupees per hour */
  hourlyRate: number;
  bio: string;
}

const EN_HI_KOK = ['en', 'hi', 'kok'];
const EN_HI_MR = ['en', 'hi', 'mr'];
const EN_HI = ['en', 'hi'];

export const SEED_WORKERS: SeedWorkerDef[] = [
  // ---- Panaji (4) ----
  { n: 1, displayName: 'Demo Plumber', town: 'PANAJI', category: 'plumbing', skills: ['tap-repair', 'pipe-leak-repair', 'sink-repair'], experienceYears: 8, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 250, bio: 'Plumbing repairs across Panaji. Licensed and insured.' },
  { n: 2, displayName: 'Amit Naik', town: 'PANAJI', category: 'electrician', skills: ['fan-repair', 'switch-repair', 'wiring', 'mcb-repair'], experienceYears: 11, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 300, bio: 'Electrician with a decade of house-wiring experience.' },
  { n: 3, displayName: 'Prakash Kerkar', town: 'PANAJI', category: 'carpentry', skills: ['door-repair', 'furniture-repair', 'lock-fitting'], experienceYears: 15, languages: EN_HI_KOK, availability: 'BUSY', verification: 'VERIFIED', serviceRadiusKm: 12, hourlyRate: 350, bio: 'Furniture and door work. Old Goa style woodwork a specialty.' },
  { n: 4, displayName: 'Sunil Gawas', town: 'PANAJI', category: 'plumbing', skills: ['tap-repair', 'pipe-leak-repair', 'toilet-repair'], experienceYears: 5, languages: EN_HI, availability: 'OFFLINE', verification: 'VERIFIED', serviceRadiusKm: 10, hourlyRate: 220, bio: 'Plumbing repairs. Evenings and weekends.' },

  // ---- Porvorim (3) ----
  { n: 5, displayName: 'Rohan Gaonkar', town: 'PORVORIM', category: 'plumbing', skills: ['pipe-leak-repair', 'drain-blockage', 'water-tank-plumbing'], experienceYears: 7, languages: EN_HI_MR, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 240, bio: 'Leak detection and drain work in Bardez taluka.' },
  { n: 6, displayName: 'Nilesh Sawant', town: 'PORVORIM', category: 'painting', skills: ['interior-painting', 'wall-touch-up', 'waterproof-coating'], experienceYears: 9, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 18, hourlyRate: 200, bio: 'Interior and exterior painting, waterproofing.' },
  { n: 7, displayName: 'Manoj Dessai', town: 'PORVORIM', category: 'ac-repair', skills: ['ac-servicing', 'cooling-issue', 'gas-refill'], experienceYears: 6, languages: EN_HI, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 400, bio: 'Split AC servicing and gas refill.' },

  // ---- Mapusa (3) ----
  { n: 8, displayName: 'Sameer Kamat', town: 'MAPUSA', category: 'plumbing', skills: ['pipe-leak-repair', 'sink-repair', 'toilet-repair'], experienceYears: 10, languages: EN_HI_MR, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 230, bio: 'Plumber serving Mapusa and surrounding areas.' },
  { n: 9, displayName: 'Vijay Shirodkar', town: 'MAPUSA', category: 'appliance-repair', skills: ['washing-machine-repair', 'refrigerator-repair', 'mixer-repair'], experienceYears: 12, languages: EN_HI_MR, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 320, bio: 'Home appliance repairs at your doorstep.' },
  { n: 10, displayName: 'Deepak Parsekar', town: 'MAPUSA', category: 'motorbike-repair', skills: ['bike-servicing', 'puncture-repair'], experienceYears: 8, languages: EN_HI_MR, availability: 'OFFLINE', verification: 'PENDING', serviceRadiusKm: 12, hourlyRate: 150, bio: 'Two-wheeler service and repair.' },

  // ---- Calangute / Candolim (3) ----
  { n: 11, displayName: 'Rahul Tari', town: 'CALANGUTE', category: 'ac-repair', skills: ['ac-servicing', 'ac-installation', 'cooling-issue'], experienceYears: 7, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 420, bio: 'AC service for homes and guesthouses in the coastal belt.' },
  { n: 12, displayName: 'Ajay Bandekar', town: 'CALANGUTE', category: 'electrical', skills: ['light-installation', 'socket-repair', 'wiring'], experienceYears: 5, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 12, hourlyRate: 260, bio: 'Light fittings and small electrical jobs.' },
  { n: 13, displayName: 'Sanjay Velip', town: 'CANDOLIM', category: 'painting', skills: ['exterior-painting', 'interior-painting'], experienceYears: 14, languages: EN_HI_KOK, availability: 'BUSY', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 280, bio: 'Painting contractor, coastal-grade coatings.' },

  // ---- Bicholim / Old Goa (2) ----
  { n: 14, displayName: 'Ganesh Bhat', town: 'BICHOLIM', category: 'welding', skills: ['gate-welding', 'metal-fabrication', 'grill-repair'], experienceYears: 10, languages: EN_HI_MR, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 25, hourlyRate: 300, bio: 'Gates, grills and structural welding.' },
  { n: 15, displayName: 'Mahesh Volvoikar', town: 'OLD_GOA', category: 'general-handyman', skills: ['minor-fixes', 'curtain-rod-fitting', 'furniture-shifting'], experienceYears: 4, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'UNVERIFIED', serviceRadiusKm: 15, hourlyRate: 180, bio: 'Odd jobs and small repairs around Old Goa.' },

  // ---- Ponda (3) ----
  { n: 16, displayName: 'Ramesh Faldesai', town: 'PONDA', category: 'carpentry', skills: ['door-repair', 'shelf-installation', 'woodwork'], experienceYears: 12, languages: EN_HI_MR, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 300, bio: 'Carpenter in Ponda. Doors, shelves, custom woodwork.' },
  { n: 17, displayName: 'Kishor Naik', town: 'PONDA', category: 'plumbing', skills: ['drain-blockage', 'toilet-repair', 'water-tank-plumbing'], experienceYears: 6, languages: EN_HI_MR, availability: 'AVAILABLE', verification: 'PENDING', serviceRadiusKm: 18, hourlyRate: 210, bio: 'Drainage and sanitation work.' },
  { n: 18, displayName: 'Tukaram Gaude', town: 'PONDA', category: 'electrical', skills: ['wiring', 'mcb-repair', 'fan-repair'], experienceYears: 9, languages: EN_HI_MR, availability: 'OFFLINE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 240, bio: 'House wiring and MCB work.' },

  // ---- Margao (4) ----
  { n: 19, displayName: 'João Fernandes', town: 'MARGAO', category: 'appliance-repair', skills: ['washing-machine-repair', 'refrigerator-repair', 'water-purifier-repair'], experienceYears: 11, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 330, bio: 'Appliance repair across Salcete.' },
  { n: 20, displayName: 'Suresh Dessai', town: 'MARGAO', category: 'plumbing', skills: ['pipe-leak-repair', 'tap-repair', 'sink-repair'], experienceYears: 13, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 250, bio: 'Senior plumber serving Margao and surroundings.' },
  { n: 21, displayName: 'Pandurang Kamat', town: 'MARGAO', category: 'painting', skills: ['interior-painting', 'exterior-painting', 'waterproof-coating'], experienceYears: 8, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 18, hourlyRate: 220, bio: 'Painting and waterproofing contractor.' },
  { n: 22, displayName: 'Zé Cardozo', town: 'MARGAO', category: 'general-handyman', skills: ['minor-fixes', 'furniture-shifting'], experienceYears: 3, languages: ['en', 'kok', 'hi'], availability: 'AVAILABLE', verification: 'UNVERIFIED', serviceRadiusKm: 10, hourlyRate: 170, bio: 'Handyman for small jobs in Margao.' },

  // ---- Vasco (3) ----
  { n: 23, displayName: 'Iqbal Sheikh', town: 'VASCO', category: 'ac-repair', skills: ['ac-servicing', 'ac-installation', 'gas-refill', 'cooling-issue'], experienceYears: 10, languages: EN_HI, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 400, bio: 'AC technician near the port area.' },
  { n: 24, displayName: 'Babu Kavlekar', town: 'VASCO', category: 'welding', skills: ['gate-welding', 'grill-repair'], experienceYears: 7, languages: EN_HI_KOK, availability: 'BUSY', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 280, bio: 'Welding repairs in Vasco and Chicalim.' },
  { n: 25, displayName: 'Nitin Dhargalkar', town: 'VASCO', category: 'motorbike-repair', skills: ['bike-servicing', 'battery-replacement', 'puncture-repair'], experienceYears: 9, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 15, hourlyRate: 160, bio: 'Two-wheeler servicing near Bogmalo road.' },

  // ---- Verna (2) ----
  { n: 26, displayName: 'Cajetan D’Souza', town: 'VERNA', category: 'electrical', skills: ['wiring', 'light-installation'], experienceYears: 6, languages: ['en', 'kok', 'hi'], availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 260, bio: 'Wiring and fittings around the Verna industrial estate.' },
  { n: 27, displayName: 'Minguel Barreto', town: 'VERNA', category: 'carpentry', skills: ['furniture-repair', 'lock-fitting', 'woodwork'], experienceYears: 16, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 320, bio: 'Furniture maker and repairer, 16 years experience.' },

  // ---- Colva (1) ----
  { n: 28, displayName: 'Avinash Cutinho', town: 'COLVA', category: 'home-cleaning', skills: ['deep-cleaning', 'bathroom-cleaning', 'kitchen-cleaning'], experienceYears: 4, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'PENDING', serviceRadiusKm: 15, hourlyRate: 190, bio: 'Home deep cleaning in the Colva–Benaulim belt.' },

  // ---- Cuncolim (1) ----
  { n: 29, displayName: 'Raju Gaonkar', town: 'CUNCOLIM', category: 'appliance-repair', skills: ['mixer-repair', 'washing-machine-repair'], experienceYears: 5, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 20, hourlyRate: 220, bio: 'Small appliance repairs, Cuncolim and Quepem side.' },

  // ---- Canacona (2) ----
  { n: 30, displayName: 'Sachin Pagi', town: 'CANACONA', category: 'plumbing', skills: ['drain-blockage', 'pipe-leak-repair', 'tap-repair'], experienceYears: 6, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'VERIFIED', serviceRadiusKm: 25, hourlyRate: 200, bio: 'Plumber serving Canacona taluka. Wide service radius.' },
  { n: 31, displayName: 'Ganpat Velip', town: 'CANACONA', category: 'general-handyman', skills: ['minor-fixes', 'furniture-shifting', 'curtain-rod-fitting'], experienceYears: 2, languages: EN_HI_KOK, availability: 'AVAILABLE', verification: 'UNVERIFIED', serviceRadiusKm: 20, hourlyRate: 160, bio: 'Handyman based in Canacona.' },
];

export interface SeedCustomerDef {
  n: number;
  displayName: string;
  town: GoaLocationKey;
  /** Saved addresses; first is the default. */
  addresses: Array<{
    label: string;
    line: string;
    city: string;
    pincode: string;
  }>;
}

export const SEED_CUSTOMERS: SeedCustomerDef[] = [
  {
    n: 1, displayName: 'Demo Customer', town: 'PANAJI',
    addresses: [
      { label: 'Home', line: 'Near Miramar Junction, Ground floor', city: 'Panaji', pincode: '403001' },
      { label: 'Office', line: '2nd floor, EDC Complex, Patto', city: 'Panaji', pincode: '403001' },
    ],
  },
  { n: 2, displayName: 'Ananya Rao', town: 'PANAJI', addresses: [{ label: 'Home', line: 'Behind Dona Paula road, blue gate', city: 'Panaji', pincode: '403004' }] },
  { n: 3, displayName: 'Meera Joshi', town: 'PORVORIM', addresses: [{ label: 'Home', line: 'Socorro plateau, near the church', city: 'Porvorim', pincode: '403501' }] },
  { n: 4, displayName: 'Riya Desai', town: 'MAPUSA', addresses: [{ label: 'Home', line: 'Altinho hill lane, yellow house', city: 'Mapusa', pincode: '403507' }] },
  { n: 5, displayName: 'Karan Mehta', town: 'CALANGUTE', addresses: [{ label: 'Home', line: 'Off Baga road, 200m from the junction', city: 'Calangute', pincode: '403516' }] },
  { n: 6, displayName: 'Neha Verma', town: 'PONDA', addresses: [{ label: 'Home', line: 'Farmagudi, near the college', city: 'Ponda', pincode: '403401' }] },
  { n: 7, displayName: 'Arjun Shah', town: 'MARGAO', addresses: [{ label: 'Home', line: 'Aquem, opposite the bus stop', city: 'Margao', pincode: '403601' }] },
  { n: 8, displayName: 'Priya Kulkarni', town: 'VASCO', addresses: [{ label: 'Home', line: 'Chicalim, near the garden', city: 'Vasco da Gama', pincode: '403802' }] },
  { n: 9, displayName: 'Aditya Rao', town: 'COLVA', addresses: [{ label: 'Home', line: 'Sernabatim, third lane from the beach road', city: 'Colva', pincode: '403708' }] },
  { n: 10, displayName: 'Sneha Patil', town: 'CANACONA', addresses: [{ label: 'Home', line: 'Chaudi, above the provision store', city: 'Canacona', pincode: '403702' }] },
  { n: 11, displayName: 'Rahul Sharma', town: 'CANDOLIM', addresses: [{ label: 'Home', line: 'Off the Candolim main road, white gate', city: 'Candolim', pincode: '403515' }] },
  { n: 12, displayName: 'Deepa Kamat', town: 'VERNA', addresses: [{ label: 'Home', line: 'Verna spring, near the chapel', city: 'Verna', pincode: '403722' }] },
];
