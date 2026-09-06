import bcrypt from 'bcryptjs';
import { User, Product, Category, Order } from '../types/index.js';

export const initialCategories: Category[] = [
  {
    id: 'cat_electronics',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    description: 'Next-gen audio, smart home devices, gadgets, and computing essentials',
    itemCount: 6
  },
  {
    id: 'cat_fashion',
    name: 'Fashion & Apparel',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
    description: 'Premium curated wardrobe essentials, outerwear, and designer apparel',
    itemCount: 5
  },
  {
    id: 'cat_shoes',
    name: 'Footwear & Shoes',
    slug: 'shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    description: 'Athletic runners, ergonomic trainers, and handcrafted leather footwear',
    itemCount: 4
  },
  {
    id: 'cat_accessories',
    name: 'Watches & Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    description: 'Precision mechanical timepieces, sunglasses, and leather bags',
    itemCount: 4
  },
  {
    id: 'cat_home',
    name: 'Home & Living',
    slug: 'home-living',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    description: 'Nordic minimalist decor, artisan ceramics, and smart living amenities',
    itemCount: 3
  },
  {
    id: 'cat_books',
    name: 'Books & Stationery',
    slug: 'books',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
    description: 'Bestselling design, architecture, science, and hardcover collector books',
    itemCount: 2
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'AeroPulse Wireless Studio Headphones',
    description: 'Engineered with custom 40mm beryllium drivers, active hybrid noise cancellation, 45-hour battery life, and ultra-plush memory foam earcups for unmatched sonic clarity.',
    price: 14999.00,
    originalPrice: 18999.00,
    discount: 21,
    category: 'Electronics',
    brand: 'AeroPulse',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'
    ],
    stock: 24,
    rating: 4.8,
    numReviews: 128,
    featured: true,
    isBestSeller: true,
    tags: ['audio', 'wireless', 'anc', 'bluetooth'],
    specs: {
      'Driver Size': '40mm Beryllium',
      'Battery Life': '45 Hours',
      'Connectivity': 'Bluetooth 5.3 / 3.5mm Aux',
      'Weight': '245g'
    },
    reviews: [
      {
        id: 'rev_1',
        userId: 'usr_cust1',
        userName: 'Rahul Sharma',
        rating: 5,
        comment: 'The noise cancellation completely blocks out Mumbai metro bustle. Bass is deep, rich, and tightly controlled.',
        createdAt: '2026-08-10T14:20:00Z'
      },
      {
        id: 'rev_2',
        userId: 'usr_cust2',
        userName: 'Priya Patel',
        rating: 5,
        comment: 'Impeccable build quality and the battery truly lasts for days of work calls and music.',
        createdAt: '2026-08-14T09:12:00Z'
      }
    ],
    createdAt: '2026-07-01T10:00:00Z'
  },
  {
    id: 'prod_2',
    name: 'Chronos Horizon Titanium Smartwatch',
    description: 'Aerospace-grade titanium chassis with a sapphire crystal AMOLED screen, optical heart rate sensor, dual-frequency GPS, and up to 14 days of battery reserve.',
    price: 24999.00,
    originalPrice: 29999.00,
    discount: 17,
    category: 'Watches & Accessories',
    brand: 'Chronos',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'
    ],
    stock: 15,
    rating: 4.9,
    numReviews: 94,
    featured: true,
    isBestSeller: true,
    tags: ['smartwatch', 'titanium', 'fitness', 'luxury'],
    specs: {
      'Chassis': 'Grade 5 Titanium',
      'Display': '1.43" AMOLED 466x466',
      'Water Resistance': '50M / 5 ATM',
      'Battery': 'Up to 14 Days'
    },
    reviews: [
      {
        id: 'rev_3',
        userId: 'usr_cust1',
        userName: 'Vikram Sethi',
        rating: 5,
        comment: 'Pure luxury feel on the wrist. GPS tracks my morning marathon training with pinpoint accuracy.',
        createdAt: '2026-08-05T18:30:00Z'
      }
    ],
    createdAt: '2026-07-03T11:30:00Z'
  },
  {
    id: 'prod_3',
    name: 'Velocity Crimson Pro Running Sneakers',
    description: 'Engineered with responsive carbon fiber flight plates, breathable dual-layer knit mesh, and hyper-cushion foam for maximum energy rebound on every stride.',
    price: 7999.00,
    originalPrice: 9999.00,
    discount: 20,
    category: 'Footwear & Shoes',
    brand: 'Velocity Sport',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80'
    ],
    stock: 18,
    rating: 4.7,
    numReviews: 210,
    featured: true,
    isBestSeller: true,
    tags: ['running', 'sneakers', 'cushioned', 'shoes'],
    specs: {
      'Sole Material': 'Carbon-infused EVA Foam',
      'Upper': 'Seamless FlyKnit Mesh',
      'Drop': '8mm Heel-to-Toe',
      'Arch Support': 'Neutral to High'
    },
    createdAt: '2026-07-05T09:00:00Z'
  },
  {
    id: 'prod_4',
    name: 'Artisan Raw Selvedge Denim Jacket',
    description: 'Crafted from 14.5oz Japanese organic cotton selvedge denim. Tailored fit with antique brass buttons, deep welt pockets, and contrasting chain-stitch detailing.',
    price: 8499.00,
    originalPrice: 9999.00,
    discount: 15,
    category: 'Fashion & Apparel',
    brand: 'Kuroki Heritage',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80',
      'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800&q=80'
    ],
    stock: 9,
    rating: 4.6,
    numReviews: 43,
    featured: false,
    isBestSeller: false,
    tags: ['denim', 'jacket', 'japanese', 'selvedge'],
    specs: {
      'Material': '100% Organic Cotton 14.5oz',
      'Origin': 'Okayama, Japan',
      'Fit': 'Structured Classic Slim'
    },
    createdAt: '2026-07-08T15:10:00Z'
  },
  {
    id: 'prod_5',
    name: 'Lumix Omni 4K Creator Mirrorless Camera',
    description: 'Compact cinema-quality 24.2MP full-frame mirrorless camera with 6K 30p open gate recording, 5-axis Dual I.S. 2 image stabilization, and real-time phase detection AF.',
    price: 124999.00,
    originalPrice: 139999.00,
    discount: 11,
    category: 'Electronics',
    brand: 'Optix Prime',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80'
    ],
    stock: 5,
    rating: 4.9,
    numReviews: 67,
    featured: true,
    isBestSeller: false,
    tags: ['camera', '4k', 'mirrorless', 'photography'],
    specs: {
      'Sensor': '24.2 MP Full-Frame BSI CMOS',
      'Video': '6K 10-bit 4:2:2 Internal',
      'Stabilization': '5-Axis In-Body (6.5 Stops)',
      'Mount': 'L-Mount'
    },
    createdAt: '2026-07-10T12:00:00Z'
  },
  {
    id: 'prod_6',
    name: 'Minimalist Matte Ceramic Table Lamp',
    description: 'Hand-thrown sand clay base finished in textural warm off-white glaze with a textured linen shade. Emits an ethereal, relaxing 2700K warm glow.',
    price: 3499.00,
    originalPrice: 4499.00,
    discount: 22,
    category: 'Home & Living',
    brand: 'Nordic Calm',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80'
    ],
    stock: 14,
    rating: 4.8,
    numReviews: 51,
    featured: false,
    isBestSeller: true,
    tags: ['lamp', 'ceramic', 'decor', 'lighting'],
    specs: {
      'Base': 'Stoneware Ceramic',
      'Shade': '100% Belgian Linen',
      'Socket': 'E26 / Dimmable LED included',
      'Dimensions': '14" H x 9" W'
    },
    createdAt: '2026-07-12T16:45:00Z'
  },
  {
    id: 'prod_7',
    name: 'Vanguard Vintage Leather Weekend Duffle',
    description: 'Full-grain vegetable-tanned Italian pull-up leather that patinas beautifully with time. Features dedicated shoe compartment, water-resistant twill lining, and brass hardware.',
    price: 11999.00,
    originalPrice: 14999.00,
    discount: 20,
    category: 'Watches & Accessories',
    brand: 'Vanguard Crafts',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'
    ],
    stock: 8,
    rating: 4.9,
    numReviews: 88,
    featured: true,
    isBestSeller: false,
    tags: ['leather', 'duffle', 'travel', 'bag'],
    specs: {
      'Leather': 'Full-grain Tuscan Cowhide',
      'Capacity': '42 Liters (Cabin Approved)',
      'Hardware': 'Solid Antiqued Brass'
    },
    createdAt: '2026-07-15T08:30:00Z'
  },
  {
    id: 'prod_8',
    name: 'Solace 100% Merino Wool Relaxed Knit Sweater',
    description: 'Spun from ultra-fine 19.5-micron Australian merino wool. Naturally thermoregulating, silky soft against skin, and ribbed at collar and cuffs for everyday elegance.',
    price: 6499.00,
    originalPrice: 7999.00,
    discount: 19,
    category: 'Fashion & Apparel',
    brand: 'Solace Studio',
    images: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80'
    ],
    stock: 20,
    rating: 4.7,
    numReviews: 76,
    featured: false,
    isBestSeller: true,
    tags: ['merino', 'sweater', 'wool', 'knitwear'],
    specs: {
      'Composition': '100% Pure Extrafine Merino',
      'Care': 'Hand wash or dry clean',
      'Fit': 'Modern Relaxed Silhouette'
    },
    createdAt: '2026-07-18T14:15:00Z'
  },
  {
    id: 'prod_9',
    name: 'Precision Mechanical Gaming Keyboard (RGB)',
    description: 'Hot-swappable custom lubricated linear switches, CNC anodized aluminum plate, sound-dampening silicone gasket mount, and vibrant per-key south-facing RGB illumination.',
    price: 6999.00,
    originalPrice: 8499.00,
    discount: 18,
    category: 'Electronics',
    brand: 'AeroPulse',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80'
    ],
    stock: 11,
    rating: 4.8,
    numReviews: 142,
    featured: false,
    isBestSeller: false,
    tags: ['keyboard', 'gaming', 'mechanical', 'custom'],
    specs: {
      'Layout': '75% Compact (82 Keys)',
      'Switches': 'Gateron Oil King Pre-lubed',
      'Keycaps': 'Double-shot PBT Cherry Profile',
      'Connectivity': 'Tri-mode (2.4G / BT 5.1 / Type-C)'
    },
    createdAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'prod_10',
    name: 'Classic Oxford Heritage Brogue Shoes',
    description: 'Goodyear-welted full-grain calfskin leather dress shoes with decorative brogue perforations, stacked wooden heel, and breathable leather insole.',
    price: 9999.00,
    originalPrice: 12499.00,
    discount: 20,
    category: 'Footwear & Shoes',
    brand: 'Kuroki Heritage',
    images: [
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80',
      'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80'
    ],
    stock: 7,
    rating: 4.9,
    numReviews: 64,
    featured: false,
    isBestSeller: false,
    tags: ['brogues', 'oxford', 'leather', 'formal'],
    specs: {
      'Construction': 'Goodyear Welt 360°',
      'Upper': 'Full-grain French Calfskin',
      'Sole': 'Oak Bark Tanned Leather'
    },
    createdAt: '2026-07-22T13:30:00Z'
  },
  {
    id: 'prod_11',
    name: 'Aroma Infusion Espresso Machine Pro',
    description: 'Dual PID temperature controlled commercial 58mm portafilter espresso machine with 15-bar Italian pump, high-pressure steam wand, and integrated conical burr grinder.',
    price: 34999.00,
    originalPrice: 42999.00,
    discount: 19,
    category: 'Home & Living',
    brand: 'AromaCraft',
    images: [
      'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80'
    ],
    stock: 4,
    rating: 4.9,
    numReviews: 95,
    featured: true,
    isBestSeller: true,
    tags: ['espresso', 'coffee', 'kitchen', 'home'],
    specs: {
      'Pump Pressure': '15 Bar Italian ULKA',
      'Boiler': 'ThermoJet Fast Heat 3s',
      'Water Tank': '2.2L Removable'
    },
    createdAt: '2026-07-25T11:00:00Z'
  },
  {
    id: 'prod_12',
    name: 'The Architecture of Tomorrow (Collector Hardcover)',
    description: 'A visual compendium featuring 450 pages of world-renowned sustainable modernist structures, architectural drawings, high-gloss photography, and essays by Pritzker laureates.',
    price: 2499.00,
    originalPrice: 3200.00,
    discount: 22,
    category: 'Books & Stationery',
    brand: 'Monocle Press',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'
    ],
    stock: 30,
    rating: 4.8,
    numReviews: 38,
    featured: false,
    isBestSeller: false,
    tags: ['books', 'architecture', 'design', 'hardcover'],
    specs: {
      'Binding': 'Hardcover Clothbound with Foil Stamping',
      'Pages': '456 Heavyweight Satin Paper',
      'Language': 'English'
    },
    createdAt: '2026-07-27T09:40:00Z'
  },
  {
    id: 'prod_13',
    name: 'Aviator Eclipse Polarized Sunglasses',
    description: 'Hand-polished Japanese acetate brow line paired with lightweight titanium arms and scratch-resistant polarized glass lenses providing 100% UVA/UVB protection.',
    price: 7499.00,
    originalPrice: 8999.00,
    discount: 17,
    category: 'Watches & Accessories',
    brand: 'Vanguard Crafts',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80'
    ],
    stock: 22,
    rating: 4.7,
    numReviews: 53,
    featured: false,
    isBestSeller: false,
    tags: ['sunglasses', 'polarized', 'eyewear'],
    specs: {
      'Frame': 'Beta-Titanium & Cellulose Acetate',
      'Lens': 'Category 3 Polarized Mineral Glass',
      'Fit': 'Medium Universal'
    },
    createdAt: '2026-07-30T17:00:00Z'
  },
  {
    id: 'prod_14',
    name: 'Apex Pure Carbon Wireless Ergonomic Mouse',
    description: 'Sub-49g ultralight wireless gaming and productivity mouse with PixArt 3395 26,000 DPI sensor, optical microswitches, and 80-hour continuous battery life.',
    price: 4499.00,
    originalPrice: 5499.00,
    discount: 18,
    category: 'Electronics',
    brand: 'AeroPulse',
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80'
    ],
    stock: 19,
    rating: 4.8,
    numReviews: 114,
    featured: false,
    isBestSeller: true,
    tags: ['mouse', 'wireless', 'ergonomic', 'gaming'],
    specs: {
      'Weight': '48.5g',
      'Sensor': 'PAW3395 (26,000 DPI, 650 IPS)',
      'Polling Rate': 'Up to 4000Hz compatible'
    },
    createdAt: '2026-08-01T12:20:00Z'
  },
  {
    id: 'prod_15',
    name: 'Silk Linen Resort Camp Collar Shirt',
    description: 'Breezy lightweight blend of 65% French flax linen and 35% mulberry silk. Relaxed boxy drape with mother-of-pearl buttons, perfect for elevated summer leisure.',
    price: 4999.00,
    originalPrice: 5999.00,
    discount: 17,
    category: 'Fashion & Apparel',
    brand: 'Solace Studio',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'
    ],
    stock: 16,
    rating: 4.6,
    numReviews: 39,
    featured: false,
    isBestSeller: false,
    tags: ['shirt', 'linen', 'summer', 'fashion'],
    specs: {
      'Blend': '65% French Linen / 35% Mulberry Silk',
      'Cut': 'Relaxed Camp Collar Boxy'
    },
    createdAt: '2026-08-03T15:00:00Z'
  },
  {
    id: 'prod_16',
    name: 'Stratus Trail Low-Top Waterproof Hiking Shoes',
    description: 'Vibram Megagrip traction outsole combined with a waterproof GORE-TEX breathable membrane and reinforced TPU mudguard for all-weather trail resilience.',
    price: 8999.00,
    originalPrice: 10999.00,
    discount: 18,
    category: 'Footwear & Shoes',
    brand: 'Velocity Sport',
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80',
      'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&q=80'
    ],
    stock: 12,
    rating: 4.8,
    numReviews: 87,
    featured: false,
    isBestSeller: false,
    tags: ['hiking', 'shoes', 'waterproof', 'outdoor'],
    specs: {
      'Membrane': 'GORE-TEX Extended Comfort',
      'Outsole': 'Vibram Megagrip 5mm Lugs'
    },
    createdAt: '2026-08-04T10:10:00Z'
  },
  {
    id: 'prod_17',
    name: 'Artisan Brass Fountain Pen & Leather Journal Gift Set',
    description: 'Precision machined solid raw brass fountain pen with stainless steel fine nib, complemented by a refillable 240-page A5 Italian leather notebook with 100gsm fountain-friendly paper.',
    price: 3299.00,
    originalPrice: 3999.00,
    discount: 18,
    category: 'Books & Stationery',
    brand: 'Monocle Press',
    images: [
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80'
    ],
    stock: 25,
    rating: 4.9,
    numReviews: 49,
    featured: true,
    isBestSeller: false,
    tags: ['stationery', 'fountain pen', 'journal', 'leather'],
    specs: {
      'Pen Weight': '45g Solid Brass',
      'Paper': '240 Pages 100gsm Acid-Free Ivory'
    },
    createdAt: '2026-08-06T14:30:00Z'
  },
  {
    id: 'prod_18',
    name: 'Aura Soundbar Pro Dolby Atmos 3D',
    description: 'Sleek 5.1.2 channel soundbar with wireless subwoofer, upward-firing height channels, eARC HDMI support, and crystal clear speech enhancement dialogue mode.',
    price: 24999.00,
    originalPrice: 29999.00,
    discount: 17,
    category: 'Electronics',
    brand: 'AeroPulse',
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
    ],
    stock: 8,
    rating: 4.8,
    numReviews: 73,
    featured: false,
    isBestSeller: false,
    tags: ['soundbar', 'audio', 'home theater', 'dolby atmos'],
    specs: {
      'Channels': '5.1.2 Dolby Atmos & DTS:X',
      'Power': '480W Total Output',
      'Inputs': 'HDMI eARC, Optical, Bluetooth, AirPlay 2'
    },
    createdAt: '2026-08-08T11:15:00Z'
  },
  {
    id: 'prod_19',
    name: 'Heritage Trench Coat with Storm Flap',
    description: 'Double-breasted weatherproof cotton gabardine trench coat featuring raglan sleeves, throat latch, horn buttons, and a signature checked interior lining.',
    price: 16999.00,
    originalPrice: 19999.00,
    discount: 15,
    category: 'Fashion & Apparel',
    brand: 'Kuroki Heritage',
    images: [
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'
    ],
    stock: 6,
    rating: 4.9,
    numReviews: 31,
    featured: false,
    isBestSeller: false,
    tags: ['coat', 'trench', 'outerwear', 'fashion'],
    specs: {
      'Material': '100% Water-Repellent Cotton Gabardine',
      'Closure': 'Double-Breasted Horn Buttons'
    },
    createdAt: '2026-08-10T16:00:00Z'
  },
  {
    id: 'prod_20',
    name: 'Sculptural Cast Iron Dutch Oven (5.5 Qt)',
    description: 'Heavy enamel-coated cast iron with self-basting lid spikes, superior heat retention, and satin black interior for effortless searing and slow braising.',
    price: 6999.00,
    originalPrice: 8499.00,
    discount: 18,
    category: 'Home & Living',
    brand: 'AromaCraft',
    images: [
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80'
    ],
    stock: 14,
    rating: 4.9,
    numReviews: 102,
    featured: false,
    isBestSeller: true,
    tags: ['cookware', 'kitchen', 'dutch oven', 'cast iron'],
    specs: {
      'Capacity': '5.5 Quarts (5.2 Liters)',
      'Oven Safe': 'Up to 500°F (260°C)'
    },
    createdAt: '2026-08-12T09:30:00Z'
  }
];

export const getInitialUsers = (): User[] => {
  const salt = bcrypt.genSaltSync(10);
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@shopsphere.com').toLowerCase().trim();
  const adminPhone = process.env.ADMIN_PHONE || '+91 98201 92834';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  return [
    {
      id: 'usr_admin',
      name: 'Admin Supervisor',
      email: adminEmail,
      password: bcrypt.hashSync(adminPassword, salt),
      role: 'admin',
      authProvider: 'local',
      isActive: true,
      emailVerified: true,
      lastLogin: new Date().toISOString(),
      phone: adminPhone,
      failedLoginAttempts: 0,
      twoFactorEnabled: true,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      address: {
        fullName: 'Admin Supervisor',
        phone: adminPhone,
        street: '100 BKC Avenue, Suite 400',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400051',
        country: 'India',
        isDefault: true,
        label: 'Work'
      },
      addresses: [
        {
          id: 'addr_adm_1',
          fullName: 'Admin Supervisor',
          phone: adminPhone,
          street: '100 BKC Avenue, Suite 400',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400051',
          country: 'India',
          isDefault: true,
          label: 'HQ Office'
        }
      ],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-08-24T00:00:00Z'
    },
    {
      id: 'usr_cust1',
      name: 'Rahul Sharma',
      email: 'customer@shopsphere.com',
      password: bcrypt.hashSync('customer123', salt),
      role: 'customer',
      authProvider: 'local',
      isActive: true,
      emailVerified: true,
      lastLogin: '2026-08-24T02:00:00Z',
      phone: '+91 98438 90123',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      address: {
        fullName: 'Rahul Sharma',
        phone: '+91 98438 90123',
        street: '742 Silver Oak Heights, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400050',
        country: 'India',
        isDefault: true,
        label: 'Home'
      },
      addresses: [
        {
          id: 'addr_cust1_1',
          fullName: 'Rahul Sharma',
          phone: '+91 98438 90123',
          street: '742 Silver Oak Heights, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400050',
          country: 'India',
          isDefault: true,
          label: 'Home Residence'
        },
        {
          id: 'addr_cust1_2',
          fullName: 'Rahul Sharma (Office)',
          phone: '+91 98438 90123',
          street: '402 Nesco Tech Park, Western Express Hwy, Goregaon East',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400063',
          country: 'India',
          isDefault: false,
          label: 'Office Tech Park'
        }
      ],
      createdAt: '2026-07-01T12:00:00Z',
      updatedAt: '2026-08-24T00:00:00Z'
    },
    {
      id: 'usr_cust2',
      name: 'Priya Patel',
      email: 'sophia@example.com',
      password: bcrypt.hashSync('password123', salt),
      role: 'customer',
      authProvider: 'local',
      isActive: true,
      emailVerified: true,
      lastLogin: '2026-08-20T15:30:00Z',
      phone: '+91 98789 23456',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      address: {
        fullName: 'Priya Patel',
        phone: '+91 98789 23456',
        street: '350 Brigade Road, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038',
        country: 'India',
        isDefault: true,
        label: 'Home'
      },
      addresses: [
        {
          id: 'addr_cust2_1',
          fullName: 'Priya Patel',
          phone: '+91 98789 23456',
          street: '350 Brigade Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          zipCode: '560038',
          country: 'India',
          isDefault: true,
          label: 'Home'
        }
      ],
      createdAt: '2026-07-15T15:30:00Z',
      updatedAt: '2026-08-20T15:30:00Z'
    }
  ];
};

export const initialOrders: Order[] = [
  {
    id: 'ord_901234',
    orderNumber: 'ORD-901234',
    userId: 'usr_cust1',
    userName: 'Rahul Sharma',
    userEmail: 'customer@shopsphere.com',
    items: [
      {
        productId: 'prod_1',
        name: 'AeroPulse Wireless Studio Headphones',
        price: 14999.00,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        quantity: 1
      },
      {
        productId: 'prod_3',
        name: 'Velocity Crimson Pro Running Sneakers',
        price: 7999.00,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        quantity: 1
      }
    ],
    itemsPrice: 22998.00,
    shippingPrice: 0,
    taxPrice: 2759.76,
    discountPrice: 1000.00,
    totalAmount: 24757.76,
    shippingAddress: {
      fullName: 'Rahul Sharma',
      phone: '+91 98438 90123',
      street: '742 Silver Oak Heights, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India'
    },
    paymentMethod: 'Credit/Debit Card',
    paymentStatus: 'Paid',
    orderStatus: 'Out for Delivery',
    trackingNumber: 'TRK-IN-89241094',
    carrier: 'BlueDart Express',
    estimatedDelivery: '2026-08-24 (Today)',
    trackingTimeline: [
      {
        status: 'Order Placed',
        title: 'Order Placed & Confirmed',
        description: 'Your order was successfully placed and registered.',
        timestamp: '2026-08-22 08:30 AM',
        completed: true,
        current: false
      },
      {
        status: 'Confirmed',
        title: 'Payment Confirmed',
        description: 'Payment authorized via HDFC Card ending in 4242.',
        timestamp: '2026-08-22 08:32 AM',
        completed: true,
        current: false
      },
      {
        status: 'Processing',
        title: 'Order Packaged',
        description: 'Items assembled and scanned at Mumbai Kurla Hub.',
        timestamp: '2026-08-23 01:15 PM',
        completed: true,
        current: false
      },
      {
        status: 'Shipped',
        title: 'In Transit with Courier',
        description: 'Package departed Mumbai regional distribution center.',
        timestamp: '2026-08-24 04:45 AM',
        completed: true,
        current: false
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Package is on delivery vehicle with BlueDart courier for final delivery today by 5:00 PM.',
        timestamp: '2026-08-24 07:15 AM',
        completed: true,
        current: true
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        description: 'Package will be delivered and OTP verified.',
        completed: false,
        current: false
      }
    ],
    createdAt: '2026-08-22T08:30:00Z',
    updatedAt: '2026-08-24T07:15:00Z'
  },
  {
    id: 'ord_894120',
    orderNumber: 'ORD-894120',
    userId: 'usr_cust1',
    userName: 'Rahul Sharma',
    userEmail: 'customer@shopsphere.com',
    items: [
      {
        productId: 'prod_2',
        name: 'Chronos Horizon Titanium Smartwatch',
        price: 24999.00,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        quantity: 1
      }
    ],
    itemsPrice: 24999.00,
    shippingPrice: 0,
    taxPrice: 2999.88,
    discountPrice: 500.00,
    totalAmount: 27498.88,
    shippingAddress: {
      fullName: 'Rahul Sharma',
      phone: '+91 98438 90123',
      street: '742 Silver Oak Heights, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India'
    },
    paymentMethod: 'UPI / Google Pay',
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    trackingNumber: 'TRK-IN-77821034',
    carrier: 'Delhivery Express',
    estimatedDelivery: '2026-08-26',
    trackingTimeline: [
      {
        status: 'Order Placed',
        title: 'Order Placed',
        description: 'Your order was verified and queued.',
        timestamp: '2026-08-23 11:20 AM',
        completed: true,
        current: false
      },
      {
        status: 'Confirmed',
        title: 'Payment Confirmed',
        description: 'UPI transaction via Google Pay approved.',
        timestamp: '2026-08-23 11:21 AM',
        completed: true,
        current: false
      },
      {
        status: 'Processing',
        title: 'Quality Check & Packing',
        description: 'Product serial verified and packed into protective air-cushion box.',
        timestamp: '2026-08-23 04:10 PM',
        completed: true,
        current: false
      },
      {
        status: 'Shipped',
        title: 'Departed Facility',
        description: 'In transit with Delhivery Express tracking #TRK-IN-77821034.',
        timestamp: '2026-08-24 06:00 AM',
        completed: true,
        current: true
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Courier vehicle dispatch.',
        completed: false,
        current: false
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        description: 'Front door handover.',
        completed: false,
        current: false
      }
    ],
    createdAt: '2026-08-23T11:20:00Z',
    updatedAt: '2026-08-24T06:00:00Z'
  },
  {
    id: 'ord_761230',
    orderNumber: 'ORD-761230',
    userId: 'usr_cust1',
    userName: 'Rahul Sharma',
    userEmail: 'customer@shopsphere.com',
    items: [
      {
        productId: 'prod_6',
        name: 'Minimalist Matte Ceramic Table Lamp',
        price: 3499.00,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
        quantity: 2
      }
    ],
    itemsPrice: 6998.00,
    shippingPrice: 0,
    taxPrice: 839.76,
    discountPrice: 500.00,
    totalAmount: 7337.76,
    shippingAddress: {
      fullName: 'Rahul Sharma',
      phone: '+91 98438 90123',
      street: '742 Silver Oak Heights, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India'
    },
    paymentMethod: 'Credit/Debit Card',
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    trackingNumber: 'TRK-IN-55419082',
    carrier: 'DTDC Express',
    estimatedDelivery: '2026-08-28',
    trackingTimeline: [
      {
        status: 'Order Placed',
        title: 'Order Placed',
        description: 'Order received and recorded in fulfillment queue.',
        timestamp: '2026-08-24 01:10 AM',
        completed: true,
        current: false
      },
      {
        status: 'Confirmed',
        title: 'Payment Confirmed',
        description: 'Payment authorized.',
        timestamp: '2026-08-24 01:11 AM',
        completed: true,
        current: false
      },
      {
        status: 'Processing',
        title: 'Assembling & Packaging',
        description: 'Fragile glassware packaging underway.',
        timestamp: '2026-08-24 02:00 AM',
        completed: true,
        current: true
      },
      {
        status: 'Shipped',
        title: 'Handover to Courier',
        description: 'Label printed; awaiting carrier pickup.',
        completed: false,
        current: false
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Package on carrier van.',
        completed: false,
        current: false
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        description: 'Direct delivery at destination address.',
        completed: false,
        current: false
      }
    ],
    createdAt: '2026-08-24T01:10:00Z',
    updatedAt: '2026-08-24T02:00:00Z'
  },
  {
    id: 'ord_1001',
    orderNumber: 'SPH-892401',
    userId: 'usr_cust1',
    userName: 'Rahul Sharma',
    userEmail: 'customer@shopsphere.com',
    items: [
      {
        productId: 'prod_1',
        name: 'AeroPulse Wireless Studio Headphones',
        price: 14999.00,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        quantity: 1
      },
      {
        productId: 'prod_14',
        name: 'Apex Pure Carbon Wireless Ergonomic Mouse',
        price: 4499.00,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80',
        quantity: 1
      }
    ],
    itemsPrice: 19498.00,
    shippingPrice: 0,
    taxPrice: 2339.76,
    discountPrice: 1000.00,
    totalAmount: 20837.76,
    shippingAddress: {
      fullName: 'Rahul Sharma',
      phone: '+91 98438 90123',
      street: '742 Silver Oak Heights, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'India'
    },
    paymentMethod: 'Credit/Debit Card',
    paymentStatus: 'Paid',
    orderStatus: 'Shipped',
    trackingNumber: 'TRK-IN-98421094',
    carrier: 'BlueDart Express',
    estimatedDelivery: '2026-08-27',
    trackingTimeline: [
      {
        status: 'Order Placed',
        title: 'Order Placed',
        description: 'Your order was successfully received and verified.',
        timestamp: '2026-08-22 10:14 AM',
        completed: true,
        current: false
      },
      {
        status: 'Confirmed',
        title: 'Payment Confirmed',
        description: 'Payment verified via ICICI NetBanking.',
        timestamp: '2026-08-22 10:16 AM',
        completed: true,
        current: false
      },
      {
        status: 'Processing',
        title: 'Order Packaged',
        description: 'Items securely packed at Mumbai Hub.',
        timestamp: '2026-08-23 02:40 PM',
        completed: true,
        current: false
      },
      {
        status: 'Shipped',
        title: 'Handed to Carrier',
        description: 'In transit with BlueDart Express tracking #TRK-IN-98421094.',
        timestamp: '2026-08-24 07:15 AM',
        completed: true,
        current: true
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'Package will be on courier vehicle for delivery.',
        completed: false,
        current: false
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        description: 'Signed and delivered at front door.',
        completed: false,
        current: false
      }
    ],
    createdAt: '2026-08-22T10:14:00Z',
    updatedAt: '2026-08-24T07:15:00Z'
  },
  {
    id: 'ord_1002',
    orderNumber: 'SPH-892402',
    userId: 'usr_cust2',
    userName: 'Priya Patel',
    userEmail: 'sophia@example.com',
    items: [
      {
        productId: 'prod_2',
        name: 'Chronos Horizon Titanium Smartwatch',
        price: 24999.00,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        quantity: 1
      }
    ],
    itemsPrice: 24999.00,
    shippingPrice: 0,
    taxPrice: 2999.88,
    discountPrice: 0,
    totalAmount: 27998.88,
    shippingAddress: {
      fullName: 'Priya Patel',
      phone: '+91 98789 23456',
      street: '350 Brigade Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      country: 'India'
    },
    paymentMethod: 'UPI / Google Pay',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    trackingNumber: 'TRK-IN-11928472',
    carrier: 'Delhivery Express',
    estimatedDelivery: '2026-08-20',
    trackingTimeline: [
      {
        status: 'Order Placed',
        title: 'Order Placed',
        description: 'Order confirmed and registered.',
        timestamp: '2026-08-18 09:00 AM',
        completed: true,
        current: false
      },
      {
        status: 'Confirmed',
        title: 'Payment Confirmed',
        description: 'UPI payment verified.',
        timestamp: '2026-08-18 09:02 AM',
        completed: true,
        current: false
      },
      {
        status: 'Processing',
        title: 'Packaged & Inspected',
        description: 'Quality inspected and wrapped in protective seal.',
        timestamp: '2026-08-18 01:20 PM',
        completed: true,
        current: false
      },
      {
        status: 'Shipped',
        title: 'Shipped',
        description: 'Shipped from Bengaluru fulfillment facility.',
        timestamp: '2026-08-19 08:30 AM',
        completed: true,
        current: false
      },
      {
        status: 'Out for Delivery',
        title: 'Out for Delivery',
        description: 'On Delhivery vehicle for morning delivery.',
        timestamp: '2026-08-20 08:45 AM',
        completed: true,
        current: false
      },
      {
        status: 'Delivered',
        title: 'Delivered',
        description: 'Delivered safely and OTP confirmed.',
        timestamp: '2026-08-20 11:32 AM',
        completed: true,
        current: true
      }
    ],
    createdAt: '2026-08-18T09:00:00Z',
    updatedAt: '2026-08-20T11:32:00Z'
  }
];

export const getInitialEmailLogs = () => [
  {
    id: 'eml_seed_1',
    to: 'customer@shopsphere.com',
    toName: 'Rahul Sharma',
    from: 'ShopSphere Notifications <notifications@shopsphere.com>',
    subject: 'Tracking Update: Order #ORD-901234 is Out for Delivery',
    category: 'shipment_tracking' as const,
    previewText: 'Status update for Order #ORD-901234: Package is on delivery vehicle with BlueDart courier for final delivery today.',
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 24px; border-radius: 12px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 24px;">ShopSphere</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Real-Time Shipment Tracking</p>
        </div>
        <div style="padding: 24px 0; text-align: center;">
          <span style="background: #fef3c7; color: #b45309; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Out for Delivery</span>
          <h1 style="font-size: 22px; color: #0f172a; margin: 16px 0 8px 0;">🛵 Out for Delivery Today!</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Courier driver is en route with your package from Mumbai Bandra hub.</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
          <table style="width: 100%;">
            <tr><td style="color: #64748b;">Order Number:</td><td style="text-align: right; font-weight: 700; color: #4f46e5;">#ORD-901234</td></tr>
            <tr><td style="color: #64748b;">Carrier:</td><td style="text-align: right; font-weight: 600;">BlueDart Express</td></tr>
            <tr><td style="color: #64748b;">Tracking ID:</td><td style="text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">TRK-IN-89241094</td></tr>
            <tr><td style="color: #64748b;">Estimated Arrival:</td><td style="text-align: right; font-weight: 600; color: #059669;">Today by 5:00 PM</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="#track-order" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">View Live Courier Map</a>
        </div>
      </div>
    `,
    textBody: 'Your order #ORD-901234 is Out for Delivery today via BlueDart Express (Tracking #TRK-IN-89241094).',
    status: 'delivered' as const,
    metadata: {
      orderId: 'ord_901234',
      orderNumber: 'ORD-901234',
      trackingNumber: 'TRK-IN-89241094',
      carrier: 'BlueDart Express',
      orderStatus: 'Out for Delivery'
    },
    sentAt: '2026-08-24T07:15:00Z',
    read: false
  },
  {
    id: 'eml_seed_2',
    to: 'customer@shopsphere.com',
    toName: 'Rahul Sharma',
    from: 'ShopSphere Notifications <notifications@shopsphere.com>',
    subject: 'Order Confirmed: #ORD-901234 (ShopSphere)',
    category: 'order_confirmation' as const,
    previewText: 'Thank you for your order #ORD-901234! We have received your payment of ₹24,757.76.',
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 24px; border-radius: 12px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 24px;">ShopSphere</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Order Receipt & Confirmation</p>
        </div>
        <div style="padding: 24px 0; text-align: center;">
          <span style="background: #ecfdf5; color: #047857; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Order Confirmed</span>
          <h1 style="font-size: 22px; color: #0f172a; margin: 16px 0 8px 0;">Thank You For Your Order!</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">Order <strong>#ORD-901234</strong> has been placed and confirmed.</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Order Details</div>
          <table style="width: 100%;">
            <tr><td style="padding: 6px 0;">AeroPulse Studio Headphones (x1)</td><td style="text-align: right; font-weight: 600;">₹14,999.00</td></tr>
            <tr><td style="padding: 6px 0;">Velocity Crimson Pro Sneakers (x1)</td><td style="text-align: right; font-weight: 600;">₹7,999.00</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Shipping (Standard)</td><td style="text-align: right; color: #059669; font-weight: 600;">FREE</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Taxes (GST 12%)</td><td style="text-align: right;">₹2,759.76</td></tr>
            <tr><td style="padding: 6px 0; color: #059669; font-weight: 600;">Coupon Discount</td><td style="text-align: right; color: #059669; font-weight: 600;">-₹1,000.00</td></tr>
            <tr style="border-top: 2px solid #e2e8f0; font-weight: 700; font-size: 15px;"><td style="padding-top: 10px;">Total Paid:</td><td style="padding-top: 10px; text-align: right; color: #4f46e5;">₹24,757.76</td></tr>
          </table>
        </div>
      </div>
    `,
    textBody: 'Thank you for your order #ORD-901234. Total: ₹24,757.76. Delivery to Bandra West, Mumbai.',
    status: 'delivered' as const,
    metadata: {
      orderId: 'ord_901234',
      orderNumber: 'ORD-901234',
      totalAmount: 24757.76,
      orderStatus: 'Confirmed'
    },
    sentAt: '2026-08-22T08:30:00Z',
    read: true
  },
  {
    id: 'eml_seed_3',
    to: 'customer@shopsphere.com',
    toName: 'Rahul Sharma',
    from: 'ShopSphere Notifications <notifications@shopsphere.com>',
    subject: 'Security Alert: New Sign-In to Your Account',
    category: 'security_alert' as const,
    previewText: 'A new session sign-in was detected for your ShopSphere customer account.',
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="background: #0f172a; padding: 20px; border-radius: 12px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 22px;">ShopSphere Security Center</h2>
        </div>
        <div style="padding: 20px 0; text-align: center;">
          <span style="background: #eff6ff; color: #1d4ed8; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Security Alert</span>
          <h1 style="font-size: 20px; color: #0f172a; margin: 16px 0 8px 0;">New Account Sign-In Detected</h1>
          <p style="color: #64748b; font-size: 14px; margin: 0;">We noticed a login to your account <strong>customer@shopsphere.com</strong>.</p>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
          <table style="width: 100%;">
            <tr><td style="color: #64748b;">Location:</td><td style="text-align: right; font-weight: 600;">Mumbai, Maharashtra, India</td></tr>
            <tr><td style="color: #64748b;">Device:</td><td style="text-align: right;">Chrome Browser / Desktop</td></tr>
            <tr><td style="color: #64748b;">Time:</td><td style="text-align: right;">24 Aug 2026, 02:00 AM IST</td></tr>
          </table>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">If this was you, no action is needed. If unrecognized, change your password immediately.</p>
      </div>
    `,
    textBody: 'Security Alert: New Sign-In to customer@shopsphere.com from Mumbai, India.',
    status: 'delivered' as const,
    metadata: {
      alertType: 'new_login',
      ipAddress: '103.21.124.89'
    },
    sentAt: '2026-08-24T02:00:00Z',
    read: true
  },
  {
    id: 'eml_seed_4',
    to: 'admin@shopsphere.com',
    toName: 'Admin Supervisor',
    from: 'ShopSphere Notifications <notifications@shopsphere.com>',
    subject: '[Security Code] 2FA Verification Code for Admin Console',
    category: '2fa_otp' as const,
    previewText: 'Your 2FA single-use verification code for Administrator login is 482910.',
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%); padding: 24px; border-radius: 12px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 24px;">ShopSphere Admin Security</h2>
        </div>
        <div style="padding: 24px 0; text-align: center;">
          <span style="background: #fffbeb; color: #b45309; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Two-Factor Authentication</span>
          <h1 style="font-size: 22px; color: #0f172a; margin: 16px 0 8px 0;">Admin 2FA Authorization Code</h1>
          <div style="background: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 14px; padding: 18px; display: inline-block; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #312e81;">482910</div>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 0;">Code valid for 5 minutes. Never share this code with anyone.</p>
        </div>
      </div>
    `,
    textBody: 'Your ShopSphere 2FA verification code is 482910.',
    status: 'delivered' as const,
    metadata: {
      otp: '482910'
    },
    sentAt: '2026-08-25T07:00:00Z',
    read: true
  }
];
