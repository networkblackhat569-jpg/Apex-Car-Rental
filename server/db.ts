import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let db: Database;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'car_rental.sqlite');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const VEHICLES_UPLOADS_DIR = path.join(UPLOADS_DIR, 'vehicles');
const MEDIA_UPLOADS_DIR = path.join(UPLOADS_DIR, 'media');

// Ensure necessary directories exist
[DATA_DIR, UPLOADS_DIR, VEHICLES_UPLOADS_DIR, MEDIA_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Save database to disk
export function saveDb(): void {
  try {
    if (db) {
      const binaryData = db.export();
      const buffer = Buffer.from(binaryData);
      fs.writeFileSync(DB_FILE, buffer);
    }
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

// Helper to run statements
export function runSql(sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDb();
}

// Helper to query multiple rows
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

// Helper to query a single row
export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Initialize SQLite schema and initial seed
export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from:', DB_FILE);
    } catch (err) {
      console.warn('Corrupt DB file encountered, creating fresh database...', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('Created new in-memory SQLite database, will save to:', DB_FILE);
  }

  // Enforce foreign key constraints
  db.run('PRAGMA foreign_keys = ON;');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL,
      last_login TEXT,
      must_change_password INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      tagline TEXT,
      logo_url TEXT,
      phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      operating_hours TEXT NOT NULL,
      currency TEXT DEFAULT 'PKR',
      facebook_url TEXT,
      instagram_url TEXT,
      maps_url TEXT,
      supabase_url TEXT,
      supabase_anon_key TEXT,
      supabase_bucket TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS homepage_settings (
      id TEXT PRIMARY KEY,
      hero_badge TEXT,
      hero_title TEXT,
      hero_subtitle TEXT,
      stat_vehicles TEXT,
      stat_satisfaction TEXT,
      stat_matching TEXT,
      stat_experience TEXT,
      trust_heading TEXT,
      trust_description TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seo_settings (
      id TEXT PRIMARY KEY,
      meta_title TEXT,
      meta_description TEXT,
      meta_keywords TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      canonical_url TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      year TEXT NOT NULL,
      category TEXT NOT NULL,
      transmission TEXT NOT NULL,
      fuel TEXT NOT NULL,
      fuel_type TEXT DEFAULT 'Petrol',
      fuel_policy TEXT DEFAULT 'Fuel Included',
      seats INTEGER NOT NULL,
      engine TEXT,
      price_per_day TEXT NOT NULL,
      price_per_week TEXT,
      price_per_month TEXT,
      security_deposit TEXT,
      mileage_limit TEXT,
      extra_km_rate TEXT,
      color TEXT,
      luggage TEXT,
      status TEXT DEFAULT 'available',
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      strict_model_code TEXT NOT NULL,
      description TEXT,
      detailed_description TEXT,
      rental_terms TEXT,
      primary_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicle_images (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      url TEXT NOT NULL,
      image_type TEXT DEFAULT 'gallery',
      label TEXT,
      display_order INTEGER DEFAULT 0,
      verified_match INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vehicle_features (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      vehicle_id TEXT,
      vehicle_name TEXT NOT NULL,
      pickup_date TEXT,
      return_date TEXT,
      pickup_location TEXT,
      drive_option TEXT DEFAULT 'self_drive',
      message TEXT,
      status TEXT DEFAULT 'new',
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      display_order INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER,
      assigned_vehicle_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Run schema migrations for existing databases
  try {
    db.run("ALTER TABLE vehicles ADD COLUMN fuel_type TEXT DEFAULT 'Petrol';");
  } catch (e) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE vehicles ADD COLUMN fuel_policy TEXT DEFAULT 'Fuel Included';");
  } catch (e) {
    // Column already exists
  }
  try {
    db.run("ALTER TABLE admin_users ADD COLUMN must_change_password INTEGER DEFAULT 0;");
  } catch (e) {
    // Column already exists
  }

  // Populate fuel_type and fuel_policy from existing vehicles
  try {
    db.run(`
      UPDATE vehicles
      SET fuel_type = CASE
        WHEN fuel LIKE '%Diesel%' THEN 'Diesel'
        WHEN fuel LIKE '%Hybrid%' THEN 'Hybrid'
        WHEN fuel LIKE '%CNG%' THEN 'CNG'
        WHEN fuel LIKE '%Electric%' THEN 'Electric'
        ELSE 'Petrol'
      END
      WHERE fuel_type IS NULL OR fuel_type = '';
    `);
    db.run(`
      UPDATE vehicles
      SET fuel_policy = 'Fuel Included'
      WHERE fuel_policy IS NULL OR fuel_policy = '';
    `);
  } catch (e) {
    // Ignore migration sync errors
  }

  // Seed default Admin User if none exists
  const existingAdmin = queryOne('SELECT id FROM admin_users LIMIT 1');
  if (!existingAdmin) {
    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
    db.run(
      `INSERT INTO admin_users (id, username, email, password_hash, name, role, created_at, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['admin-1', 'admin', 'admin@apexrentacar.com', defaultPasswordHash, 'Apex Fleet Manager', 'admin', new Date().toISOString(), 1]
    );
    console.log('Seeded initial admin account');
  }

  // Seed default Business Settings if none exists
  const existingBusiness = queryOne('SELECT id FROM business_settings LIMIT 1');
  if (!existingBusiness) {
    db.run(
      `INSERT INTO business_settings (
        id, business_name, tagline, logo_url, phone, whatsapp_number, email, 
        address, city, operating_hours, currency, facebook_url, instagram_url, 
        maps_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        'Apex Luxury Car Rental',
        'Strict Model-Matched Fleet & VIP Chauffeur Service',
        '/assets/logo.png',
        '+92 300 1234567',
        '+923001234567',
        'concierge@apexrentacar.com',
        'Main Boulevard, Gulberg III, Lahore, Pakistan',
        'Lahore',
        'Mon - Sun: 24/7 Concierge Support',
        'PKR',
        'https://facebook.com/apexrentacar',
        'https://instagram.com/apexrentacar',
        'https://maps.google.com/?q=Lahore+Pakistan',
        new Date().toISOString()
      ]
    );
    console.log('Seeded default business settings');
  }

  // Seed default Homepage Settings if none exists
  const existingHomepage = queryOne('SELECT id FROM homepage_settings LIMIT 1');
  if (!existingHomepage) {
    db.run(
      `INSERT INTO homepage_settings (
        id, hero_badge, hero_title, hero_subtitle, stat_vehicles, 
        stat_satisfaction, stat_matching, stat_experience, trust_heading, 
        trust_description, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        '100% Guaranteed Model Matching',
        'Experience Pakistan’s Finest Fleet with Zero Substitution',
        'Reserve pristine, verified sedans and flagship SUVs. The exact car you inspect on your screen is the exact car delivered to your doorstep.',
        '50+',
        '99.4%',
        '100%',
        '12+ Yrs',
        'Why Discerning Travelers Choose Apex',
        'Unlike conventional car rentals that hand over a different car upon arrival, Apex guarantees exact vehicle specifications, certified sanitation, and transparent pricing with no hidden charges.',
        new Date().toISOString()
      ]
    );
    console.log('Seeded default homepage settings');
  }

  // Seed default SEO Settings
  const existingSeo = queryOne('SELECT id FROM seo_settings LIMIT 1');
  if (!existingSeo) {
    db.run(
      `INSERT INTO seo_settings (
        id, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        'Apex Car Rental | Premium Rent-a-Car with Verified Vehicle Matching',
        'Rent Toyota Corolla, Civic RS Turbo, Yaris, Fortuner Legender and Sportage with guaranteed model matching, transparent rates, and instant WhatsApp booking in Pakistan.',
        'rent a car lahore, rent a car pakistan, luxury car rental, toyota corolla rent, honda civic rent, fortuner legender rental',
        'Apex Car Rental - Verified Fleet & WhatsApp Reservations',
        'Explore our luxury verified fleet with zero substitutions and immediate 24/7 delivery.',
        '/images/toyota-corolla.jpg',
        'https://apexrentacar.com',
        new Date().toISOString()
      ]
    );
  }

  // Seed default FAQs
  const existingFaqs = queryOne('SELECT id FROM faqs LIMIT 1');
  if (!existingFaqs) {
    const defaultFaqs = [
      {
        id: 'faq-1',
        question: 'What documents are required to rent a vehicle?',
        answer: 'For Pakistani citizens: Original CNIC and a valid Pakistani Driving License. For Overseas Pakistanis and Foreign Guests: Original Passport, valid International/National Driving Permit, and return ticket copy.',
        category: 'Requirements',
        order: 1
      },
      {
        id: 'faq-2',
        question: 'Do you guarantee the exact vehicle shown on the website?',
        answer: 'Yes! Apex upholds a strict 100% Model Matching policy. The vehicle model, generation, and specifications you book are precisely what will be handed over to you.',
        category: 'Fleet & Matching',
        order: 2
      },
      {
        id: 'faq-3',
        question: 'Are self-drive and chauffeur-driven options available?',
        answer: 'Both options are available across our entire fleet. Professional, vetted executive chauffeurs in uniform can be requested for city or out-station trips.',
        category: 'Services',
        order: 3
      },
      {
        id: 'faq-4',
        question: 'How is the security deposit managed?',
        answer: 'A refundable security deposit is collected upon vehicle handover via bank transfer, credit card pre-authorization, or cash. It is promptly refunded after vehicle return and post-inspection clearance.',
        category: 'Payment & Deposit',
        order: 4
      }
    ];

    for (const faq of defaultFaqs) {
      db.run(
        `INSERT INTO faqs (id, question, answer, category, display_order, is_published)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [faq.id, faq.question, faq.answer, faq.category, faq.order, 1]
      );
    }
    console.log('Seeded default FAQs');
  }

  // Seed initial vehicles if none exist
  const existingVehicles = queryOne('SELECT id FROM vehicles LIMIT 1');
  if (!existingVehicles) {
    const seedVehicles = [
      {
        id: 'toyota-corolla-2024',
        name: 'Toyota Corolla',
        model: 'Toyota Corolla Altis 1.6',
        year: '2024',
        category: 'Sedan',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        engine: '1598 cc Dual VVT-i',
        price_per_day: 'PKR 6,500',
        price_per_week: 'PKR 42,000',
        price_per_month: 'PKR 165,000',
        security_deposit: 'PKR 25,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 30/km',
        color: 'Super White / Attitude Black',
        luggage: '3 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 1,
        display_order: 1,
        strict_model_code: 'toyota-corolla',
        description: 'The definitive standard in dependable luxury. Refined suspension, generous trunk capacity, and whisper-quiet cabin for smooth executive transit and family journeys.',
        detailed_description: 'The Toyota Corolla Altis 1.6 is equipped with Toyota Dual VVT-i engineering delivering optimal thermal efficiency and seamless urban and highway performance. Every vehicle undergoes a 50-point inspection before dispatch.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 25,000.',
        primary_image: '/images/toyota-corolla.jpg',
        images: [
          { url: '/images/toyota-corolla.jpg', type: 'primary', label: 'Exterior Front 3/4' },
          { url: '/images/toyota-corolla.jpg', type: 'exterior_side', label: 'Exterior Profile' },
          { url: '/images/toyota-corolla.jpg', type: 'exterior_rear', label: 'Rear Styling' },
          { url: '/images/toyota-corolla.jpg', type: 'interior_dash', label: 'Cockpit & Console' }
        ],
        features: [
          'Dual-Zone Auto Climate Control',
          'Infotainment with Apple CarPlay & Android Auto',
          'Rear Camera with Dynamic Guidelines',
          'Cruise Control & Eco Drive Mode',
          '7 SRS Airbags & ABS with EBD',
          'Push Button Start & Smart Keyless Entry'
        ]
      },
      {
        id: 'toyota-yaris-2024',
        name: 'Toyota Yaris',
        model: 'Toyota Yaris ATIV X CVT',
        year: '2024',
        category: 'Compact Sedan',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        engine: '1329 cc Dual VVT-i',
        price_per_day: 'PKR 5,500',
        price_per_week: 'PKR 35,000',
        price_per_month: 'PKR 140,000',
        security_deposit: 'PKR 20,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 25/km',
        color: 'Silver Metallic',
        luggage: '2 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 0,
        display_order: 2,
        strict_model_code: 'toyota-yaris',
        description: 'Agile, ultra fuel-efficient, and effortless to maneuver through congested urban centers. Packed with modern connectivity and comfort for everyday commutes.',
        detailed_description: 'Toyota Yaris ATIV X features a high-efficiency 7-speed sequential CVT transmission, soft-touch dashboard trimming, and class-leading inner headroom.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 20,000.',
        primary_image: '/images/toyota-yaris.jpg',
        images: [
          { url: '/images/toyota-yaris.jpg', type: 'primary', label: 'Front Exterior' },
          { url: '/images/toyota-yaris.jpg', type: 'exterior_side', label: 'Side Profile' },
          { url: '/images/toyota-yaris.jpg', type: 'interior_dash', label: 'Dashboard & Steering' }
        ],
        features: [
          'Digital Multi-Information Display',
          'High-Efficiency CVT with 7-Speed Sequential Shift',
          'Steering-Mounted Media Controls',
          'Reverse Parking Sensors & Camera',
          'Traction Control & Hill-Start Assist',
          'Chilled Glovebox & Premium Fabric Seats'
        ]
      },
      {
        id: 'honda-civic-2024',
        name: 'Honda Civic',
        model: 'Honda Civic RS 1.5L Turbo',
        year: '2024',
        category: 'Sedan',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        engine: '1.5L VTEC Turbocharged',
        price_per_day: 'PKR 9,500',
        price_per_week: 'PKR 62,000',
        price_per_month: 'PKR 245,000',
        security_deposit: 'PKR 35,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 45/km',
        color: 'Meteoroid Gray Metallic',
        luggage: '3 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 1,
        display_order: 3,
        strict_model_code: 'honda-civic',
        description: 'Dynamic sports sedan styling with turbocharged performance. Boasts Honda SENSING driver-assist technology, low center of gravity, and a commanding executive road presence.',
        detailed_description: 'The Civic RS 11th Generation features dual exhaust tailpipe garnish, black-accented aerodynamic spoilers, paddle shifters, and wireless smartphone integration.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 35,000.',
        primary_image: '/images/honda-civic.jpg',
        images: [
          { url: '/images/honda-civic.jpg', type: 'primary', label: 'Dynamic Front Angle' },
          { url: '/images/honda-civic.jpg', type: 'exterior_side', label: 'Side Fastback Silhouette' },
          { url: '/images/honda-civic.jpg', type: 'interior_dash', label: 'Honeycomb Grille Cockpit' }
        ],
        features: [
          '1.5L VTEC Turbocharged Powertrain',
          'Honda SENSING Suite (Adaptive Cruise & Lane Keep)',
          '10.2-inch Full Digital Driver Display',
          'Wireless Apple CarPlay & Qi Smartphone Charger',
          'Electric Sunroof & Dual Exhaust Garnish',
          'Premium 8-Speaker Audio System'
        ]
      },
      {
        id: 'honda-city-2024',
        name: 'Honda City',
        model: 'Honda City Aspire 1.5 CVT',
        year: '2024',
        category: 'Sedan',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        engine: '1497 cc i-VTEC',
        price_per_day: 'PKR 6,000',
        price_per_week: 'PKR 39,000',
        price_per_month: 'PKR 155,000',
        security_deposit: 'PKR 25,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 30/km',
        color: 'Urban Titanium',
        luggage: '3 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 0,
        display_order: 4,
        strict_model_code: 'honda-city',
        description: 'Top-of-the-line Aspire trim with leather seating, premium alloy wheels, and class-leading rear passenger legroom. A balanced blend of prestige and thrift.',
        detailed_description: 'Equipped with Honda i-VTEC powerplant, 9-inch advanced capacitive infotainment, auto retractable mirrors, and push-start convenience.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 25,000.',
        primary_image: '/images/honda-city.jpg',
        images: [
          { url: '/images/honda-city.jpg', type: 'primary', label: 'Front Grille & LED DRL' },
          { url: '/images/honda-city.jpg', type: 'exterior_side', label: 'Aspire Alloys Profile' },
          { url: '/images/honda-city.jpg', type: 'interior_dash', label: 'Leather Cabin Interior' }
        ],
        features: [
          'Aspire Exclusive Leather Upholstery',
          '9-inch Advanced Capacitive Display',
          'Automatic Climate Control System',
          'Retractable Side Mirrors with Turn Signals',
          'Smart Keyless Entry with Trunk Opener',
          'Front & Rear Armrests with Cup Holders'
        ]
      },
      {
        id: 'kia-sportage-2024',
        name: 'Kia Sportage',
        model: 'Kia Sportage AWD Alpha/AWD',
        year: '2024',
        category: 'SUV',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        engine: '1999 cc Nu 2.0L MPI',
        price_per_day: 'PKR 11,000',
        price_per_week: 'PKR 72,000',
        price_per_month: 'PKR 280,000',
        security_deposit: 'PKR 40,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 50/km',
        color: 'Clear White / Panthera Metal',
        luggage: '4 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 1,
        display_order: 5,
        strict_model_code: 'kia-sportage',
        description: 'Elevated luxury compact crossover featuring an expansive panoramic sunroof, intelligent all-wheel-drive grip, and ample cargo volume for northern scenic tours.',
        detailed_description: 'With Dynamax AWD capability, power tailgate, drive mode select, and elevated ground clearance, the Sportage effortlessly navigates metropolitan avenues and mountain switchbacks.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 40,000.',
        primary_image: '/images/kia-sportage.jpg',
        images: [
          { url: '/images/kia-sportage.jpg', type: 'primary', label: 'Tiger Nose Front Fascia' },
          { url: '/images/kia-sportage.jpg', type: 'exterior_side', label: 'AWD Elevated Stance' },
          { url: '/images/kia-sportage.jpg', type: 'interior_dash', label: 'Panoramic Sunroof & Cockpit' }
        ],
        features: [
          'Intelligent All-Wheel Drive (AWD)',
          'Expansive Panoramic Power Sunroof',
          'Bi-Xenon Projection Headlamps with Ice-Cube DRLs',
          'Power Tailgate with Smart Release',
          'Electronic Parking Brake with Auto Hold',
          'Dual Zone Climate Control with Cluster Ionizer'
        ]
      },
      {
        id: 'toyota-fortuner-2024',
        name: 'Toyota Fortuner',
        model: 'Toyota Fortuner Legender 2.8L Sigma 4',
        year: '2024',
        category: 'SUV',
        transmission: 'Automatic',
        fuel: 'Diesel',
        seats: 7,
        engine: '2755 cc 1GD-FTV Turbo Diesel',
        price_per_day: 'PKR 18,500',
        price_per_week: 'PKR 120,000',
        price_per_month: 'PKR 480,000',
        security_deposit: 'PKR 60,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 75/km',
        color: 'Attitude Black / Super White',
        luggage: '5 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 1,
        display_order: 6,
        strict_model_code: 'toyota-fortuner',
        description: 'Flagship 7-seater body-on-frame 4x4. Dominate any terrain with commanding authority, bespoke Legender aerodynamic body kit, and uncompromising VIP security presence.',
        detailed_description: 'Delivering 500 Nm of robust diesel torque through a heavy-duty 4x4 transfer case, rear differential lock, paddle shifters, and dual-tone maroon/black leather interior.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 60,000.',
        primary_image: '/images/toyota-fortuner.jpg',
        images: [
          { url: '/images/toyota-fortuner.jpg', type: 'primary', label: 'Legender Aggressive Grille' },
          { url: '/images/toyota-fortuner.jpg', type: 'exterior_side', label: '7-Seater 4x4 Profile' },
          { url: '/images/toyota-fortuner.jpg', type: 'interior_dash', label: 'VIP Executive Cabin' }
        ],
        features: [
          'Sigma 4 Real 4WD with Rear Differential Lock',
          'Bespoke Legender Aerodynamic Front & Rear Bumpers',
          'Dual-Tone Premium Perforated Leather Seats',
          'Kick-Sensor Powered Smart Tailgate',
          'Sequential LED Turn Signals & Quad-LED Headlamps',
          'Premium 11-Speaker JBL Audio System'
        ]
      },
      {
        id: 'toyota-grande-2024',
        name: 'Toyota Corolla Grande',
        model: 'Toyota Corolla Altis Grande 1.8 CVT-i',
        year: '2024',
        category: 'Sedan',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        engine: '1798 cc Dual VVT-i with Acoustic Control',
        price_per_day: 'PKR 7,500',
        price_per_week: 'PKR 49,000',
        price_per_month: 'PKR 190,000',
        security_deposit: 'PKR 30,000',
        mileage_limit: '200 km/day',
        extra_km_rate: 'PKR 35/km',
        color: 'Phantom Brown / Super White',
        luggage: '3 Large Suitcases',
        status: 'available',
        is_active: 1,
        is_featured: 1,
        display_order: 7,
        strict_model_code: 'toyota-grande',
        description: 'The pinnacle of the Corolla lineage. Features a power sunroof, plush ivory leather interior, paddle shifters, and an athletic 1.8L Dual VVT-i engine.',
        detailed_description: 'With Sport Drive Mode, leather-wrapped multifunction steering, acoustic windshield glass, and high-gloss 16-inch diamond-cut alloy wheels.',
        rental_terms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 30,000.',
        primary_image: '/images/toyota-grande.jpg',
        images: [
          { url: '/images/toyota-grande.jpg', type: 'primary', label: 'Grande Chrome Fascia' },
          { url: '/images/toyota-grande.jpg', type: 'exterior_side', label: 'Diamond-Cut Alloy Profile' },
          { url: '/images/toyota-grande.jpg', type: 'interior_dash', label: 'Ivory Leather & Sunroof' }
        ],
        features: [
          'Electric Tilt & Slide Sunroof',
          'Paddle Shifters & Sport Drive Mode',
          'Plush Ivory Leather Interior with Contrast Stitching',
          'Push-Start with Smart Keyless Entry',
          'Cruise Control & Vehicle Stability Control (VSC)',
          '9-inch In-Dash Infotainment with Bluetooth'
        ]
      }
    ];

    const now = new Date().toISOString();
    for (const v of seedVehicles) {
      db.run(
        `INSERT INTO vehicles (
          id, name, model, year, category, transmission, fuel, fuel_type, fuel_policy, seats, engine,
          price_per_day, price_per_week, price_per_month, security_deposit,
          mileage_limit, extra_km_rate, color, luggage, status, is_active,
          is_featured, display_order, strict_model_code, description,
          detailed_description, rental_terms, primary_image, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          v.id, v.name, v.model, v.year, v.category, v.transmission, v.fuel, v.fuel || 'Petrol', 'Fuel Included', v.seats, v.engine,
          v.price_per_day, v.price_per_week, v.price_per_month, v.security_deposit,
          v.mileage_limit, v.extra_km_rate, v.color, v.luggage, v.status, v.is_active,
          v.is_featured, v.display_order, v.strict_model_code, v.description,
          v.detailed_description, v.rental_terms, v.primary_image, now, now
        ]
      );

      // Seed images
      let imgOrder = 1;
      for (const img of v.images) {
        db.run(
          `INSERT INTO vehicle_images (id, vehicle_id, url, image_type, label, display_order, verified_match, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [`${v.id}-img-${imgOrder}`, v.id, img.url, img.type, img.label, imgOrder, 1, now]
        );
        imgOrder++;
      }

      // Seed features
      let featOrder = 1;
      for (const feat of v.features) {
        db.run(
          `INSERT INTO vehicle_features (id, vehicle_id, feature_name)
           VALUES (?, ?, ?)`,
          [`${v.id}-feat-${featOrder}`, v.id, feat]
        );
        featOrder++;
      }
    }
    console.log('Seeded 7 pristine default vehicles with images and features');
  }

  // Seed default media assets from the initial images
  const existingMedia = queryOne('SELECT id FROM media_assets LIMIT 1');
  if (!existingMedia) {
    const defaultMedia = [
      { id: 'media-1', filename: 'toyota-corolla.jpg', url: '/images/toyota-corolla.jpg', vehicle: 'toyota-corolla-2024' },
      { id: 'media-2', filename: 'toyota-yaris.jpg', url: '/images/toyota-yaris.jpg', vehicle: 'toyota-yaris-2024' },
      { id: 'media-3', filename: 'honda-civic.jpg', url: '/images/honda-civic.jpg', vehicle: 'honda-civic-2024' },
      { id: 'media-4', filename: 'honda-city.jpg', url: '/images/honda-city.jpg', vehicle: 'honda-city-2024' },
      { id: 'media-5', filename: 'kia-sportage.jpg', url: '/images/kia-sportage.jpg', vehicle: 'kia-sportage-2024' },
      { id: 'media-6', filename: 'toyota-fortuner.jpg', url: '/images/toyota-fortuner.jpg', vehicle: 'toyota-fortuner-2024' },
      { id: 'media-7', filename: 'toyota-grande.jpg', url: '/images/toyota-grande.jpg', vehicle: 'toyota-grande-2024' },
    ];
    const now = new Date().toISOString();
    for (const m of defaultMedia) {
      db.run(
        `INSERT INTO media_assets (id, filename, url, mime_type, size_bytes, assigned_vehicle_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.filename, m.url, 'image/jpeg', 245000, m.vehicle, now]
      );
    }
  }

  // Persist to disk
  saveDb();
  console.log('Database initialization and sync complete.');
}
