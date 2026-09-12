/**
 * Goa demo seed data — categories & skills.
 *
 * Slugs intentionally mirror the categories/skills the existing base seed
 * (src/database/seeds/index.ts) already upserts, plus extra categories. Slugs
 * are deterministic and unique-indexed, so running the Goa seed after the base
 * seed (or vice versa) updates in place — existing IDs are always preserved.
 */
export interface SeedSkillDef {
  name: string;
  slug: string;
  translations: Record<string, string>;
}

export interface SeedCategoryDef {
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  translations: Record<string, string>;
  skills: SeedSkillDef[];
}

export const GOA_CATEGORIES: SeedCategoryDef[] = [
  {
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'Pipe leaks, tap repairs, sanitary fittings, tank cleaning and drainage',
    icon: 'droplet',
    displayOrder: 2,
    translations: { en: 'Plumbing', hi: 'प्लंबर / नल मिस्त्री', mr: 'प्लंबर / नळ कारागीर' },
    skills: [
      { name: 'Tap Repair', slug: 'tap-repair', translations: { en: 'Tap Repair', hi: 'नल मरम्मत', mr: 'नळ दुरुस्ती' } },
      { name: 'Pipe Leak Repair', slug: 'pipe-leak-repair', translations: { en: 'Pipe Leak Repair', hi: 'पाइप लीक मरम्मत', mr: 'पाईप गळती दुरुस्ती' } },
      { name: 'Sink Repair', slug: 'sink-repair', translations: { en: 'Sink Repair', hi: 'सिंक मरम्मत', mr: 'सिंक दुरुस्ती' } },
      { name: 'Toilet Repair', slug: 'toilet-repair', translations: { en: 'Toilet Repair', hi: 'टॉयलेट मरम्मत', mr: 'शौचालय दुरुस्ती' } },
      { name: 'Water Tank Plumbing', slug: 'water-tank-plumbing', translations: { en: 'Water Tank Plumbing', hi: 'पानी की टंकी प्लंबिंग', mr: 'पाण्याची टाकी प्लंबिंग' } },
      { name: 'Drain Blockage', slug: 'drain-blockage', translations: { en: 'Drain Blockage', hi: 'नाली जाम', mr: 'गटार जाम' } },
    ],
  },
  {
    name: 'Electrician',
    slug: 'electrician',
    description: 'Electrical repairs, wiring, fittings, switchboards, and appliances',
    icon: 'zap',
    displayOrder: 1,
    translations: { en: 'Electrician', hi: 'इलेक्ट्रीशियन / बिजली मिस्त्री', mr: 'इलेक्ट्रीशियन / वायरमन' },
    skills: [
      { name: 'Fan Repair', slug: 'fan-repair', translations: { en: 'Fan Repair', hi: 'पंखा मरम्मत', mr: 'पंखा दुरुस्ती' } },
      { name: 'Switch Repair', slug: 'switch-repair', translations: { en: 'Switch Repair', hi: 'स्विच मरम्मत', mr: 'स्विच दुरुस्ती' } },
      { name: 'Wiring', slug: 'wiring', translations: { en: 'Wiring', hi: 'वायरिंग', mr: 'वायरिंग' } },
      { name: 'Socket Repair', slug: 'socket-repair', translations: { en: 'Socket Repair', hi: 'सॉकेट मरम्मत', mr: 'सॉकेट दुरुस्ती' } },
      { name: 'MCB Repair', slug: 'mcb-repair', translations: { en: 'MCB Repair', hi: 'एमसीबी मरम्मत', mr: 'एमसीबी दुरुस्ती' } },
      { name: 'Light Installation', slug: 'light-installation', translations: { en: 'Light Installation', hi: 'लाइट फिटिंग', mr: 'लाईट बसवणे' } },
    ],
  },
  {
    name: 'Carpentry',
    slug: 'carpentry',
    description: 'Furniture repair, door locks, modular fittings, and custom woodwork',
    icon: 'hammer',
    displayOrder: 3,
    translations: { en: 'Carpentry', hi: 'बढ़ई / कारपेंटर', mr: 'सुतारकाम / कारपेंटर' },
    skills: [
      { name: 'Door Repair', slug: 'door-repair', translations: { en: 'Door Repair', hi: 'दरवाजा मरम्मत', mr: 'दरवाजा दुरुस्ती' } },
      { name: 'Furniture Repair', slug: 'furniture-repair', translations: { en: 'Furniture Repair', hi: 'फर्नीचर मरम्मत', mr: 'फर्निचर दुरुस्ती' } },
      { name: 'Lock Fitting', slug: 'lock-fitting', translations: { en: 'Lock Fitting', hi: 'ताला लगाना', mr: 'कुलूप बसवणे' } },
      { name: 'Shelf Installation', slug: 'shelf-installation', translations: { en: 'Shelf Installation', hi: 'शेल्फ लगाना', mr: 'शेल्फ बसवणे' } },
      { name: 'Woodwork', slug: 'woodwork', translations: { en: 'Woodwork', hi: 'लकड़ी का काम', mr: 'सुतारकाम' } },
    ],
  },
  {
    name: 'Painting',
    slug: 'painting',
    description: 'Interior and exterior home painting, waterproofing and polishing',
    icon: 'brush',
    displayOrder: 4,
    translations: { en: 'Painting', hi: 'पेंटर / रंगाई मिस्त्री', mr: 'रंगकाम / पेंटर' },
    skills: [
      { name: 'Interior Painting', slug: 'interior-painting', translations: { en: 'Interior Painting', hi: 'इंटीरियर पेंटिंग', mr: 'आतील रंगकाम' } },
      { name: 'Exterior Painting', slug: 'exterior-painting', translations: { en: 'Exterior Painting', hi: 'एक्सटीरियर पेंटिंग', mr: 'बाहेरील रंगकाम' } },
      { name: 'Wall Touch-up', slug: 'wall-touch-up', translations: { en: 'Wall Touch-up', hi: 'दीवार टच-अप', mr: 'भिंत टच-अप' } },
      { name: 'Waterproof Coating', slug: 'waterproof-coating', translations: { en: 'Waterproof Coating', hi: 'वॉटरप्रूफ कोटिंग', mr: 'वॉटरप्रूफ कोटिंग' } },
    ],
  },
  {
    name: 'AC Repair',
    slug: 'ac-repair',
    description: 'Air conditioner servicing, installation and gas refills',
    icon: 'wind',
    displayOrder: 6,
    translations: { en: 'AC Repair', hi: 'एसी मरम्मत', mr: 'एसी दुरुस्ती' },
    skills: [
      { name: 'AC Servicing', slug: 'ac-servicing', translations: { en: 'AC Servicing', hi: 'एसी सर्विसिंग', mr: 'एसी सर्व्हिसिंग' } },
      { name: 'AC Installation', slug: 'ac-installation', translations: { en: 'AC Installation', hi: 'एसी इंस्टॉलेशन', mr: 'एसी बसवणे' } },
      { name: 'Cooling Issue', slug: 'cooling-issue', translations: { en: 'Cooling Issue', hi: 'कूलिंग समस्या', mr: 'थंडीची समस्या' } },
      { name: 'Gas Refill', slug: 'gas-refill', translations: { en: 'Gas Refill', hi: 'गैस रीफिल', mr: 'गॅस भरणे' } },
    ],
  },
  {
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    description: 'AC, Refrigerator, Washing Machine, Microwave and RO servicing',
    icon: 'cpu',
    displayOrder: 5,
    translations: { en: 'Appliance Repair', hi: 'उपकरण मरम्मत (एसी, फ्रिज)', mr: 'घरगुती उपकरणे दुरुस्ती' },
    skills: [
      { name: 'Washing Machine Repair', slug: 'washing-machine-repair', translations: { en: 'Washing Machine Repair', hi: 'वॉशिंग मशीन मरम्मत', mr: 'वॉशिंग मशीन दुरुस्ती' } },
      { name: 'Refrigerator Repair', slug: 'refrigerator-repair', translations: { en: 'Refrigerator Repair', hi: 'फ्रिज मरम्मत', mr: 'रेफ्रिजरेटर दुरुस्ती' } },
      { name: 'Mixer Repair', slug: 'mixer-repair', translations: { en: 'Mixer Repair', hi: 'मिक्सी मरम्मत', mr: 'मिक्सर दुरुस्ती' } },
      { name: 'Water Purifier Repair', slug: 'water-purifier-repair', translations: { en: 'Water Purifier Repair', hi: 'वॉटर प्यूरीफायर मरम्मत', mr: 'पाणी शुद्धीकरण यंत्र दुरुस्ती' } },
    ],
  },
  {
    name: 'Welding',
    slug: 'welding',
    description: 'Gates, grills, metal fabrication and structural welding work',
    icon: 'flame',
    displayOrder: 7,
    translations: { en: 'Welding', hi: 'वेल्डिंग', mr: 'वेल्डिंग' },
    skills: [
      { name: 'Gate Welding', slug: 'gate-welding', translations: { en: 'Gate Welding', hi: 'गेट वेल्डिंग', mr: 'दरवाजा वेल्डिंग' } },
      { name: 'Metal Fabrication', slug: 'metal-fabrication', translations: { en: 'Metal Fabrication', hi: 'मेटल फैब्रिकेशन', mr: 'धातू काम' } },
      { name: 'Grill Repair', slug: 'grill-repair', translations: { en: 'Grill Repair', hi: 'ग्रिल मरम्मत', mr: 'ग्रिल दुरुस्ती' } },
    ],
  },
  {
    name: 'Home Cleaning',
    slug: 'home-cleaning',
    description: 'Deep cleaning, bathroom and kitchen cleaning, sofa and carpet shampooing',
    icon: 'sparkles',
    displayOrder: 8,
    translations: { en: 'Home Cleaning', hi: 'घर की सफाई', mr: 'घर स्वच्छता' },
    skills: [
      { name: 'Deep Cleaning', slug: 'deep-cleaning', translations: { en: 'Deep Cleaning', hi: 'डीप क्लीनिंग', mr: 'खोल सफाई' } },
      { name: 'Bathroom Cleaning', slug: 'bathroom-cleaning', translations: { en: 'Bathroom Cleaning', hi: 'बाथरूम सफाई', mr: 'स्नानगृह सफाई' } },
      { name: 'Kitchen Cleaning', slug: 'kitchen-cleaning', translations: { en: 'Kitchen Cleaning', hi: 'रसोई सफाई', mr: 'स्वयंपाकघर सफाई' } },
    ],
  },
  {
    name: 'Motorbike Repair',
    slug: 'motorbike-repair',
    description: 'Two-wheeler servicing, puncture repair, battery and brake work',
    icon: 'bike',
    displayOrder: 9,
    translations: { en: 'Motorbike Repair', hi: 'बाइक मरम्मत', mr: 'दुचाकी दुरुस्ती' },
    skills: [
      { name: 'Bike Servicing', slug: 'bike-servicing', translations: { en: 'Bike Servicing', hi: 'बाइक सर्विसिंग', mr: 'दुचाकी सर्व्हिसिंग' } },
      { name: 'Puncture Repair', slug: 'puncture-repair', translations: { en: 'Puncture Repair', hi: 'पंक्चर मरम्मत', mr: 'पंक्चर दुरुस्ती' } },
      { name: 'Battery Replacement', slug: 'battery-replacement', translations: { en: 'Battery Replacement', hi: 'बैटरी बदलना', mr: 'बॅटरी बदल' } },
    ],
  },
  {
    name: 'General Handyman',
    slug: 'general-handyman',
    description: 'Odd jobs, furniture shifting, curtain rods, minor fixes around the house',
    icon: 'wrench',
    displayOrder: 10,
    translations: { en: 'General Handyman', hi: 'हैंडीमैन / ऑलराउंडर', mr: 'कसूरवार कारागीर' },
    skills: [
      { name: 'Furniture Shifting', slug: 'furniture-shifting', translations: { en: 'Furniture Shifting', hi: 'फर्नीचर शिफ्टिंग', mr: 'फर्निचर हलवणे' } },
      { name: 'Curtain Rod Fitting', slug: 'curtain-rod-fitting', translations: { en: 'Curtain Rod Fitting', hi: 'पर्दा रॉड लगाना', mr: 'पडदा रॉड बसवणे' } },
      { name: 'Minor Fixes', slug: 'minor-fixes', translations: { en: 'Minor Fixes', hi: 'छोटी मरम्मत', mr: 'छोट्या दुरुस्ती' } },
    ],
  },
];

/** Convenience lookups used by the seed builder. */
export const CATEGORY_SLUGS = {
  plumbing: 'plumbing',
  electrical: 'electrician',
  carpentry: 'carpentry',
  painting: 'painting',
  ac: 'ac-repair',
  appliance: 'appliance-repair',
  welding: 'welding',
  cleaning: 'home-cleaning',
  motorbike: 'motorbike-repair',
  handyman: 'general-handyman',
} as const;
