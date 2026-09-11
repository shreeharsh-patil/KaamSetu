import { ServiceCategoryModel } from '../../modules/service-categories/service-category.model.js';
import { SkillModel } from '../../modules/skills/skill.model.js';
import { logger } from '../../config/index.js';

interface SeedSkill {
  name: string;
  slug: string;
  translations: Record<string, string>;
}

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  translations: Record<string, string>;
  skills: SeedSkill[];
}

export const INITIAL_CATEGORIES: SeedCategory[] = [
  {
    name: 'Electrician',
    slug: 'electrician',
    description: 'Electrical repairs, wiring, fittings, switchboards, and appliances',
    icon: 'zap',
    displayOrder: 1,
    translations: {
      en: 'Electrician',
      hi: 'इलेक्ट्रीशियन / बिजली मिस्त्री',
      mr: 'इलेक्ट्रीशियन / वायरमन',
    },
    skills: [
      {
        name: 'Wiring & Rewiring',
        slug: 'wiring-and-rewiring',
        translations: {
          en: 'Wiring & Rewiring',
          hi: 'वायरिंग और री-वायरिंग',
          mr: 'वायरिंग आणि री-वायरिंग',
        },
      },
      {
        name: 'Switchboard & MCB Repair',
        slug: 'switchboard-mcb-repair',
        translations: {
          en: 'Switchboard & MCB Repair',
          hi: 'स्विचबोर्ड और एमसीबी रिपेयर',
          mr: 'स्विचबोर्ड आणि एमसीबी दुरुस्ती',
        },
      },
      {
        name: 'Fan & Light Installation',
        slug: 'fan-light-installation',
        translations: {
          en: 'Fan & Light Installation',
          hi: 'पंखा और लाइट फिटिंग',
          mr: 'पंखा आणि लाईट बसवणे',
        },
      },
      {
        name: 'Inverter & Battery Setup',
        slug: 'inverter-battery-setup',
        translations: {
          en: 'Inverter & Battery Setup',
          hi: 'इन्वर्टर और बैटरी सेटअप',
          mr: 'इन्व्हर्टर आणि बॅटरी सेटअप',
        },
      },
    ],
  },
  {
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'Pipe leaks, tap repairs, sanitary fittings, tank cleaning and drainage',
    icon: 'droplet',
    displayOrder: 2,
    translations: {
      en: 'Plumbing',
      hi: 'प्लंबर / नल मिस्त्री',
      mr: 'प्लंबर / नळ कारागीर',
    },
    skills: [
      {
        name: 'Pipe Leakage Repair',
        slug: 'pipe-leakage-repair',
        translations: {
          en: 'Pipe Leakage Repair',
          hi: 'पाइप लीकेज रिपेयर',
          mr: 'पाईप गळती दुरुस्ती',
        },
      },
      {
        name: 'Tap & Shower Fitting',
        slug: 'tap-shower-fitting',
        translations: {
          en: 'Tap & Shower Fitting',
          hi: 'नल और शावर फिटिंग',
          mr: 'नळ आणि शॉवर बसवणे',
        },
      },
      {
        name: 'Drain Cleaning & Unclogging',
        slug: 'drain-cleaning',
        translations: {
          en: 'Drain Cleaning & Unclogging',
          hi: 'नाली और ड्रेन सफाई',
          mr: 'ड्रेनेज स्वच्छता आणि मोकळे करणे',
        },
      },
      {
        name: 'Water Tank Installation',
        slug: 'water-tank-installation',
        translations: {
          en: 'Water Tank Installation',
          hi: 'पानी की टंकी फिटिंग व सफाई',
          mr: 'पाण्याची टाकी बसवणे व स्वच्छता',
        },
      },
    ],
  },
  {
    name: 'Carpentry',
    slug: 'carpentry',
    description: 'Furniture repair, door locks, modular fittings, and custom woodwork',
    icon: 'hammer',
    displayOrder: 3,
    translations: {
      en: 'Carpentry',
      hi: 'बढ़ई / कारपेंटर',
      mr: 'सुतारकाम / कारपेंटर',
    },
    skills: [
      {
        name: 'Furniture Repair & Assembly',
        slug: 'furniture-repair-assembly',
        translations: {
          en: 'Furniture Repair & Assembly',
          hi: 'फर्नीचर मरम्मत व असेंबली',
          mr: 'फर्निचर दुरुस्ती आणि जुळवणी',
        },
      },
      {
        name: 'Door & Window Fitting',
        slug: 'door-window-fitting',
        translations: {
          en: 'Door & Window Fitting',
          hi: 'दरवाजा और खिड़की फिटिंग',
          mr: 'दरवाजे आणि खिडक्या बसवणे',
        },
      },
      {
        name: 'Lock Installation & Repair',
        slug: 'lock-installation-repair',
        translations: {
          en: 'Lock Installation & Repair',
          hi: 'ताला लगाना और मरम्मत',
          mr: 'कुलूप बसवणे आणि दुरुस्ती',
        },
      },
    ],
  },
  {
    name: 'Painting',
    slug: 'painting',
    description: 'Interior and exterior home painting, waterproofing and polishing',
    icon: 'brush',
    displayOrder: 4,
    translations: {
      en: 'Painting',
      hi: 'पेंटर / रंगाई मिस्त्री',
      mr: 'रंगकाम / पेंटर',
    },
    skills: [
      {
        name: 'Interior Wall Painting',
        slug: 'interior-wall-painting',
        translations: {
          en: 'Interior Wall Painting',
          hi: 'कमरे की रंगाई (इंटीरियर)',
          mr: 'घरातील भिंतींचे रंगकाम',
        },
      },
      {
        name: 'Waterproofing Solutions',
        slug: 'waterproofing-solutions',
        translations: {
          en: 'Waterproofing Solutions',
          hi: 'वॉटरप्रूफिंग समाधान',
          mr: 'वॉटरप्रूफिंग उपाय',
        },
      },
    ],
  },
  {
    name: 'Appliance Repair',
    slug: 'appliance-repair',
    description: 'AC, Refrigerator, Washing Machine, Microwave and RO servicing',
    icon: 'cpu',
    displayOrder: 5,
    translations: {
      en: 'Appliance Repair',
      hi: 'उपकरण मरम्मत (एसी, फ्रिज)',
      mr: 'घरगुती उपकरणे दुरुस्ती',
    },
    skills: [
      {
        name: 'AC Service & Gas Refill',
        slug: 'ac-service-gas-refill',
        translations: {
          en: 'AC Service & Gas Refill',
          hi: 'एसी सर्विस और गैस रीफिल',
          mr: 'एसी सर्व्हिसिंग आणि गॅस भरणे',
        },
      },
      {
        name: 'Refrigerator Repair',
        slug: 'refrigerator-repair',
        translations: {
          en: 'Refrigerator Repair',
          hi: 'फ्रिज मरम्मत',
          mr: 'रेफ्रिजरेटर दुरुस्ती',
        },
      },
      {
        name: 'Washing Machine Repair',
        slug: 'washing-machine-repair',
        translations: {
          en: 'Washing Machine Repair',
          hi: 'वॉशिंग मशीन मरम्मत',
          mr: 'वॉशिंग मशीन दुरुस्ती',
        },
      },
    ],
  },
];

/**
 * Idempotently seeds initial categories and associated skills into the database.
 */
export async function seedCategoriesAndSkills(): Promise<void> {
  logger.info('Seeding initial service categories and skills...');

  for (const cat of INITIAL_CATEGORIES) {
    const categoryDoc = await ServiceCategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
          translations: cat.translations,
          active: true,
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    for (const skill of cat.skills) {
      await SkillModel.findOneAndUpdate(
        { slug: skill.slug },
        {
          $set: {
            name: skill.name,
            slug: skill.slug,
            categoryId: categoryDoc._id,
            translations: skill.translations,
            active: true,
            deletedAt: null,
          },
        },
        { upsert: true }
      );
    }
  }

  logger.info('Categories and skills successfully seeded');
}
