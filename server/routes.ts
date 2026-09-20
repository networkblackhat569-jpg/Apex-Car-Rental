import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { queryAll, queryOne, runSql } from './db';
import { generateToken, requireAdmin, bcrypt } from './auth';

export const apiRouter = Router();

// Multer storage setup
const uploadDir = path.join(process.cwd(), 'uploads', 'vehicles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'vehicle-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Helper to populate vehicle images and features
function formatVehicle(v: any) {
  const images = queryAll(
    'SELECT id, url, image_type, label, display_order, verified_match FROM vehicle_images WHERE vehicle_id = ? ORDER BY display_order ASC',
    [v.id]
  );
  const featuresRows = queryAll(
    'SELECT feature_name FROM vehicle_features WHERE vehicle_id = ?',
    [v.id]
  );
  const features = featuresRows.map((f: any) => f.feature_name);

  // Gallery mapping for backward and modal compatibility
  const primaryImg = images.find((img: any) => img.image_type === 'primary')?.url || v.primary_image || (images[0]?.url ?? '/images/toyota-corolla.jpg');
  const frontImg = images.find((img: any) => img.image_type === 'exterior_front' || img.image_type === 'primary')?.url || primaryImg;
  const sideImg = images.find((img: any) => img.image_type === 'exterior_side')?.url || primaryImg;
  const rearImg = images.find((img: any) => img.image_type === 'exterior_rear')?.url || primaryImg;
  const interiorImg = images.find((img: any) => img.image_type?.startsWith('interior'))?.url || primaryImg;

  const resolvedFuelType = v.fuel_type || v.fuel || 'Petrol';
  const resolvedFuelPolicy = v.fuel_policy || 'Fuel Included';

  return {
    ...v,
    fuel: resolvedFuelType,
    fuelType: resolvedFuelType,
    fuel_type: resolvedFuelType,
    fuelPolicy: resolvedFuelPolicy,
    fuel_policy: resolvedFuelPolicy,
    isActive: Boolean(v.is_active),
    isFeatured: Boolean(v.is_featured),
    pricePerDay: v.price_per_day,
    weeklyPrice: v.price_per_week,
    monthlyPrice: v.price_per_month,
    securityDeposit: v.security_deposit,
    mileageLimit: v.mileage_limit,
    extraKmRate: v.extra_km_rate,
    strictModelCode: v.strict_model_code,
    detailedDescription: v.detailed_description,
    rentalTerms: v.rental_terms,
    primaryImage: primaryImg,
    image: primaryImg, // Public website uses .image
    availability: v.status === 'available' ? 'Available' : v.status === 'booked' ? 'Booked' : 'Maintenance',
    displayOrder: v.display_order,
    engineCapacity: v.engine,
    hasAC: true,
    fuelAverage: v.category === 'SUV' ? '9-12 km/L' : '14-17 km/L',
    images,
    features,
    gallery: {
      front: frontImg,
      side: sideImg,
      rear: rearImg,
      interior: interiorImg,
    },
  };
}

// ==========================================
// 1. AUTHENTICATION & SETUP ROUTES
// ==========================================

// Check if initial admin setup is required
apiRouter.get('/admin/setup-status', (req: Request, res: Response) => {
  try {
    const adminCount = queryOne('SELECT COUNT(*) as count FROM admin_users');
    const hasAdmin = (adminCount?.count ?? 0) > 0;
    res.json({ hasAdmin });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify setup status' });
  }
});

// Initial Setup Mode (Only when database has NO admin accounts)
apiRouter.post('/admin/setup', (req: Request, res: Response) => {
  try {
    const adminCount = queryOne('SELECT COUNT(*) as count FROM admin_users');
    if ((adminCount?.count ?? 0) > 0) {
      return res.status(403).json({ error: 'Admin setup has already been completed. This endpoint is disabled.' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const id = 'admin-' + Date.now();
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'admin';
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO admin_users (id, username, email, password_hash, name, role, created_at, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, username, email.toLowerCase().trim(), passwordHash, name.trim(), 'admin', now]
    );

    const token = generateToken({
      id,
      username,
      email: email.toLowerCase().trim(),
      role: 'admin',
      name: name.trim(),
      mustChangePassword: false,
    });

    res.json({
      success: true,
      token,
      user: {
        id,
        username,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: 'admin',
        mustChangePassword: false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to complete initial admin setup' });
  }
});

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const user = queryOne(
      'SELECT * FROM admin_users WHERE username = ? OR email = ?',
      [username.trim(), username.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify username and password.' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const now = new Date().toISOString();
    runSql('UPDATE admin_users SET last_login = ? WHERE id = ?', [now, user.id]);

    const mustChangePassword = Boolean(user.must_change_password);

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      mustChangePassword,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Current User / Session Check
apiRouter.get('/auth/me', requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).adminUser;
  res.json({
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      mustChangePassword: Boolean(admin.must_change_password),
    },
  });
});

// Mandatory / Regular Change Password
apiRouter.post('/admin/change-password', requireAdmin, (req: Request, res: Response) => {
  try {
    const admin = (req as any).adminUser;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirm password do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const existing = queryOne('SELECT password_hash FROM admin_users WHERE id = ?', [admin.id]);
    if (!existing || !bcrypt.compareSync(currentPassword, existing.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect. Please verify and try again.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    runSql('UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [
      newHash,
      admin.id,
    ]);

    res.json({
      success: true,
      message: 'Password updated successfully',
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        mustChangePassword: false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to change password' });
  }
});

// Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// Update Admin Profile / Password
apiRouter.put('/auth/profile', requireAdmin, (req: Request, res: Response) => {
  try {
    const admin = (req as any).adminUser;
    const { name, email, currentPassword, newPassword } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      const existing = queryOne('SELECT password_hash FROM admin_users WHERE id = ?', [admin.id]);
      if (!existing || !bcrypt.compareSync(currentPassword, existing.password_hash)) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      const newHash = bcrypt.hashSync(newPassword, 10);
      runSql('UPDATE admin_users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [
        name,
        email.toLowerCase(),
        newHash,
        admin.id,
      ]);
    } else {
      runSql('UPDATE admin_users SET name = ?, email = ? WHERE id = ?', [name, email.toLowerCase(), admin.id]);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// ==========================================
// 2. BUSINESS SETTINGS
// ==========================================

apiRouter.get('/business-settings', (req: Request, res: Response) => {
  try {
    const settings = queryOne('SELECT * FROM business_settings LIMIT 1');
    res.json(settings || {});
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve business settings' });
  }
});

apiRouter.put('/business-settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      business_name,
      tagline,
      logo_url,
      phone,
      whatsapp_number,
      email,
      address,
      city,
      operating_hours,
      currency,
      facebook_url,
      instagram_url,
      maps_url,
      supabase_url,
      supabase_anon_key,
      supabase_bucket,
    } = req.body;

    const existing = queryOne('SELECT id FROM business_settings LIMIT 1');
    const now = new Date().toISOString();

    if (existing) {
      runSql(
        `UPDATE business_settings SET
          business_name = ?, tagline = ?, logo_url = ?, phone = ?, whatsapp_number = ?,
          email = ?, address = ?, city = ?, operating_hours = ?, currency = ?,
          facebook_url = ?, instagram_url = ?, maps_url = ?, supabase_url = ?,
          supabase_anon_key = ?, supabase_bucket = ?, updated_at = ?
        WHERE id = ?`,
        [
          business_name,
          tagline,
          logo_url,
          phone,
          whatsapp_number,
          email,
          address,
          city,
          operating_hours,
          currency || 'PKR',
          facebook_url,
          instagram_url,
          maps_url,
          supabase_url,
          supabase_anon_key,
          supabase_bucket,
          now,
          existing.id,
        ]
      );
    } else {
      runSql(
        `INSERT INTO business_settings (
          id, business_name, tagline, logo_url, phone, whatsapp_number, email,
          address, city, operating_hours, currency, facebook_url, instagram_url,
          maps_url, supabase_url, supabase_anon_key, supabase_bucket, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          business_name,
          tagline,
          logo_url,
          phone,
          whatsapp_number,
          email,
          address,
          city,
          operating_hours,
          currency || 'PKR',
          facebook_url,
          instagram_url,
          maps_url,
          supabase_url,
          supabase_anon_key,
          supabase_bucket,
          now,
        ]
      );
    }

    const updated = queryOne('SELECT * FROM business_settings LIMIT 1');
    res.json(updated);
  } catch (err: any) {
    console.error('Update business settings error:', err);
    res.status(500).json({ error: 'Failed to update business settings' });
  }
});

// ==========================================
// 3. HOMEPAGE SETTINGS
// ==========================================

apiRouter.get('/homepage-settings', (req: Request, res: Response) => {
  try {
    const settings = queryOne('SELECT * FROM homepage_settings LIMIT 1');
    res.json(settings || {});
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve homepage settings' });
  }
});

apiRouter.put('/homepage-settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      hero_badge,
      hero_title,
      hero_subtitle,
      stat_vehicles,
      stat_satisfaction,
      stat_matching,
      stat_experience,
      trust_heading,
      trust_description,
    } = req.body;

    const existing = queryOne('SELECT id FROM homepage_settings LIMIT 1');
    const now = new Date().toISOString();

    if (existing) {
      runSql(
        `UPDATE homepage_settings SET
          hero_badge = ?, hero_title = ?, hero_subtitle = ?, stat_vehicles = ?,
          stat_satisfaction = ?, stat_matching = ?, stat_experience = ?,
          trust_heading = ?, trust_description = ?, updated_at = ?
        WHERE id = ?`,
        [
          hero_badge,
          hero_title,
          hero_subtitle,
          stat_vehicles,
          stat_satisfaction,
          stat_matching,
          stat_experience,
          trust_heading,
          trust_description,
          now,
          existing.id,
        ]
      );
    } else {
      runSql(
        `INSERT INTO homepage_settings (
          id, hero_badge, hero_title, hero_subtitle, stat_vehicles,
          stat_satisfaction, stat_matching, stat_experience, trust_heading,
          trust_description, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          hero_badge,
          hero_title,
          hero_subtitle,
          stat_vehicles,
          stat_satisfaction,
          stat_matching,
          stat_experience,
          trust_heading,
          trust_description,
          now,
        ]
      );
    }

    const updated = queryOne('SELECT * FROM homepage_settings LIMIT 1');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update homepage settings' });
  }
});

// ==========================================
// 4. SEO SETTINGS
// ==========================================

apiRouter.get('/seo-settings', (req: Request, res: Response) => {
  try {
    const settings = queryOne('SELECT * FROM seo_settings LIMIT 1');
    res.json(settings || {});
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve SEO settings' });
  }
});

apiRouter.put('/seo-settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      meta_title,
      meta_description,
      meta_keywords,
      og_title,
      og_description,
      og_image,
      canonical_url,
    } = req.body;

    const existing = queryOne('SELECT id FROM seo_settings LIMIT 1');
    const now = new Date().toISOString();

    if (existing) {
      runSql(
        `UPDATE seo_settings SET
          meta_title = ?, meta_description = ?, meta_keywords = ?,
          og_title = ?, og_description = ?, og_image = ?,
          canonical_url = ?, updated_at = ?
        WHERE id = ?`,
        [
          meta_title,
          meta_description,
          meta_keywords,
          og_title,
          og_description,
          og_image,
          canonical_url,
          now,
          existing.id,
        ]
      );
    } else {
      runSql(
        `INSERT INTO seo_settings (
          id, meta_title, meta_description, meta_keywords,
          og_title, og_description, og_image, canonical_url, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'default',
          meta_title,
          meta_description,
          meta_keywords,
          og_title,
          og_description,
          og_image,
          canonical_url,
          now,
        ]
      );
    }

    const updated = queryOne('SELECT * FROM seo_settings LIMIT 1');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update SEO settings' });
  }
});

// ==========================================
// 5. VEHICLE MANAGEMENT (CRUD)
// ==========================================

// Get all vehicles
apiRouter.get('/vehicles', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.all === 'true';
    const category = req.query.category as string;
    const search = (req.query.search as string)?.toLowerCase().trim();

    let sql = 'SELECT * FROM vehicles';
    const conditions: string[] = [];
    const params: any[] = [];

    if (!includeInactive) {
      conditions.push('is_active = 1');
    }

    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(LOWER(name) LIKE ? OR LOWER(model) LIKE ? OR LOWER(category) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY display_order ASC, created_at DESC';

    const rawVehicles = queryAll(sql, params);
    const populated = rawVehicles.map(formatVehicle);

    res.json(populated);
  } catch (err: any) {
    console.error('Fetch vehicles error:', err);
    res.status(500).json({ error: 'Failed to load vehicles from database' });
  }
});

// Get single vehicle by ID
apiRouter.get('/vehicles/:id', (req: Request, res: Response) => {
  try {
    const vehicle = queryOne('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(formatVehicle(vehicle));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve vehicle' });
  }
});

// Create new vehicle
apiRouter.post('/vehicles', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      name,
      model,
      year,
      category,
      transmission,
      fuel,
      fuelType,
      fuel_type,
      fuelPolicy,
      fuel_policy,
      seats,
      engine,
      pricePerDay,
      price_per_day,
      pricePerWeek,
      price_per_week,
      pricePerMonth,
      price_per_month,
      securityDeposit,
      security_deposit,
      mileageLimit,
      mileage_limit,
      extraKmRate,
      extra_km_rate,
      color,
      luggage,
      status = 'available',
      isActive = 1,
      is_active = 1,
      isFeatured = 0,
      is_featured = 0,
      strictModelCode,
      strict_model_code,
      description,
      detailedDescription,
      detailed_description,
      rentalTerms,
      rental_terms,
      primaryImage,
      primary_image,
      image,
      images = [],
      features = [],
    } = req.body;

    if (!name || !model || !year || !category) {
      return res.status(400).json({ error: 'Name, model, year, and category are required' });
    }

    const id = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + year + '-' + Date.now().toString().slice(-4));
    const now = new Date().toISOString();

    const maxOrderRow = queryOne('SELECT MAX(display_order) as maxOrder FROM vehicles');
    const displayOrder = (maxOrderRow?.maxOrder || 0) + 1;

    const chosenPrimaryImage = primaryImage || primary_image || image || (images[0]?.url) || '/images/toyota-corolla.jpg';
    const chosenFuelType = fuelType || fuel_type || fuel || 'Petrol';
    const chosenFuelPolicy = fuelPolicy || fuel_policy || 'Fuel Included';

    runSql(
      `INSERT INTO vehicles (
        id, name, model, year, category, transmission, fuel, fuel_type, fuel_policy, seats, engine,
        price_per_day, price_per_week, price_per_month, security_deposit,
        mileage_limit, extra_km_rate, color, luggage, status, is_active,
        is_featured, display_order, strict_model_code, description,
        detailed_description, rental_terms, primary_image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        model,
        year,
        category,
        transmission || 'Automatic',
        chosenFuelType,
        chosenFuelType,
        chosenFuelPolicy,
        Number(seats) || 5,
        engine || '',
        pricePerDay || price_per_day || 'PKR 6,000',
        pricePerWeek || price_per_week || '',
        pricePerMonth || price_per_month || '',
        securityDeposit || security_deposit || 'PKR 25,000',
        mileageLimit || mileage_limit || '200 km/day',
        extraKmRate || extra_km_rate || 'PKR 30/km',
        color || 'White / Black',
        luggage || '2-3 Large Suitcases',
        status,
        isActive !== undefined ? (isActive ? 1 : 0) : is_active ? 1 : 0,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : is_featured ? 1 : 0,
        displayOrder,
        strictModelCode || strict_model_code || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description || 'Comfortable executive car for personal and business rental.',
        detailedDescription || detailed_description || '',
        rentalTerms || rental_terms || 'Valid CNIC/Passport & Driver License required. Refundable deposit applicable.',
        chosenPrimaryImage,
        now,
        now,
      ]
    );

    // Insert images
    if (Array.isArray(images) && images.length > 0) {
      let order = 1;
      for (const img of images) {
        const imgId = `${id}-img-${Date.now()}-${order}`;
        runSql(
          `INSERT INTO vehicle_images (id, vehicle_id, url, image_type, label, display_order, verified_match, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            imgId,
            id,
            typeof img === 'string' ? img : img.url,
            (typeof img === 'object' && img.image_type) || (typeof img === 'object' && img.type) || (order === 1 ? 'primary' : 'gallery'),
            (typeof img === 'object' && img.label) || `Photo ${order}`,
            order,
            1,
            now,
          ]
        );
        order++;
      }
    } else {
      // Create at least primary image record
      runSql(
        `INSERT INTO vehicle_images (id, vehicle_id, url, image_type, label, display_order, verified_match, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`${id}-img-primary`, id, chosenPrimaryImage, 'primary', 'Main Photo', 1, 1, now]
      );
    }

    // Insert features
    if (Array.isArray(features)) {
      let featOrder = 1;
      for (const feat of features) {
        if (feat && feat.trim()) {
          runSql(
            `INSERT INTO vehicle_features (id, vehicle_id, feature_name)
             VALUES (?, ?, ?)`,
            [`${id}-feat-${featOrder}`, id, feat.trim()]
          );
          featOrder++;
        }
      }
    }

    const created = queryOne('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.status(201).json(formatVehicle(created));
  } catch (err: any) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ error: err.message || 'Failed to create vehicle' });
  }
});

// Update vehicle
apiRouter.put('/vehicles/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const {
      name,
      model,
      year,
      category,
      transmission,
      fuel,
      fuelType,
      fuel_type,
      fuelPolicy,
      fuel_policy,
      seats,
      engine,
      pricePerDay,
      price_per_day,
      pricePerWeek,
      price_per_week,
      pricePerMonth,
      price_per_month,
      securityDeposit,
      security_deposit,
      mileageLimit,
      mileage_limit,
      extraKmRate,
      extra_km_rate,
      color,
      luggage,
      status,
      isActive,
      is_active,
      isFeatured,
      is_featured,
      displayOrder,
      display_order,
      strictModelCode,
      strict_model_code,
      description,
      detailedDescription,
      detailed_description,
      rentalTerms,
      rental_terms,
      primaryImage,
      primary_image,
      features,
    } = req.body;

    const now = new Date().toISOString();
    const updatedFuelType = fuelType ?? fuel_type ?? fuel ?? existing.fuel_type ?? existing.fuel;
    const updatedFuelPolicy = fuelPolicy ?? fuel_policy ?? existing.fuel_policy ?? 'Fuel Included';

    runSql(
      `UPDATE vehicles SET
        name = ?, model = ?, year = ?, category = ?, transmission = ?, fuel = ?,
        fuel_type = ?, fuel_policy = ?,
        seats = ?, engine = ?, price_per_day = ?, price_per_week = ?,
        price_per_month = ?, security_deposit = ?, mileage_limit = ?,
        extra_km_rate = ?, color = ?, luggage = ?, status = ?, is_active = ?,
        is_featured = ?, display_order = ?, strict_model_code = ?,
        description = ?, detailed_description = ?, rental_terms = ?,
        primary_image = ?, updated_at = ?
      WHERE id = ?`,
      [
        name ?? existing.name,
        model ?? existing.model,
        year ?? existing.year,
        category ?? existing.category,
        transmission ?? existing.transmission,
        updatedFuelType,
        updatedFuelType,
        updatedFuelPolicy,
        seats !== undefined ? Number(seats) : existing.seats,
        engine ?? existing.engine,
        pricePerDay ?? price_per_day ?? existing.price_per_day,
        pricePerWeek ?? price_per_week ?? existing.price_per_week,
        pricePerMonth ?? price_per_month ?? existing.price_per_month,
        securityDeposit ?? security_deposit ?? existing.security_deposit,
        mileageLimit ?? mileage_limit ?? existing.mileage_limit,
        extraKmRate ?? extra_km_rate ?? existing.extra_km_rate,
        color ?? existing.color,
        luggage ?? existing.luggage,
        status ?? existing.status,
        isActive !== undefined ? (isActive ? 1 : 0) : is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
        isFeatured !== undefined ? (isFeatured ? 1 : 0) : is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
        displayOrder ?? display_order ?? existing.display_order,
        strictModelCode ?? strict_model_code ?? existing.strict_model_code,
        description ?? existing.description,
        detailedDescription ?? detailed_description ?? existing.detailed_description,
        rentalTerms ?? rental_terms ?? existing.rental_terms,
        primaryImage ?? primary_image ?? existing.primary_image,
        now,
        id,
      ]
    );

    // Update features if provided
    if (Array.isArray(features)) {
      runSql('DELETE FROM vehicle_features WHERE vehicle_id = ?', [id]);
      let featOrder = 1;
      for (const feat of features) {
        if (feat && feat.trim()) {
          runSql(
            'INSERT INTO vehicle_features (id, vehicle_id, feature_name) VALUES (?, ?, ?)',
            [`${id}-feat-${Date.now()}-${featOrder}`, id, feat.trim()]
          );
          featOrder++;
        }
      }
    }

    const updated = queryOne('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.json(formatVehicle(updated));
  } catch (err: any) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ error: err.message || 'Failed to update vehicle' });
  }
});

// Quick status toggle
apiRouter.put('/vehicles/:id/status', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'available' | 'booked' | 'maintenance'
    if (!['available', 'booked', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    runSql('UPDATE vehicles SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), req.params.id]);
    res.json({ message: 'Status updated', status });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Quick active/inactive toggle
apiRouter.put('/vehicles/:id/toggle-active', requireAdmin, (req: Request, res: Response) => {
  try {
    const vehicle = queryOne('SELECT is_active FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    const newActive = vehicle.is_active ? 0 : 1;
    runSql('UPDATE vehicles SET is_active = ?, updated_at = ? WHERE id = ?', [newActive, new Date().toISOString(), req.params.id]);
    res.json({ message: 'Active status toggled', isActive: Boolean(newActive) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle active status' });
  }
});

// Quick featured toggle
apiRouter.put('/vehicles/:id/toggle-featured', requireAdmin, (req: Request, res: Response) => {
  try {
    const vehicle = queryOne('SELECT is_featured FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    const newFeatured = vehicle.is_featured ? 0 : 1;
    runSql('UPDATE vehicles SET is_featured = ?, updated_at = ? WHERE id = ?', [newFeatured, new Date().toISOString(), req.params.id]);
    res.json({ message: 'Featured status toggled', isFeatured: Boolean(newFeatured) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

// Duplicate vehicle
apiRouter.post('/vehicles/:id/duplicate', requireAdmin, (req: Request, res: Response) => {
  try {
    const original = queryOne('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!original) {
      return res.status(404).json({ error: 'Original vehicle not found' });
    }

    const newId = `${original.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-copy-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO vehicles (
        id, name, model, year, category, transmission, fuel, seats, engine,
        price_per_day, price_per_week, price_per_month, security_deposit,
        mileage_limit, extra_km_rate, color, luggage, status, is_active,
        is_featured, display_order, strict_model_code, description,
        detailed_description, rental_terms, primary_image, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        `${original.name} (Copy)`,
        original.model,
        original.year,
        original.category,
        original.transmission,
        original.fuel,
        original.seats,
        original.engine,
        original.price_per_day,
        original.price_per_week,
        original.price_per_month,
        original.security_deposit,
        original.mileage_limit,
        original.extra_km_rate,
        original.color,
        original.luggage,
        'available',
        0, // Inactive by default so admin can review
        0,
        original.display_order + 1,
        original.strict_model_code,
        original.description,
        original.detailed_description,
        original.rental_terms,
        original.primary_image,
        now,
        now,
      ]
    );

    // Duplicate images
    const originalImages = queryAll('SELECT * FROM vehicle_images WHERE vehicle_id = ?', [original.id]);
    for (const img of originalImages) {
      runSql(
        `INSERT INTO vehicle_images (id, vehicle_id, url, image_type, label, display_order, verified_match, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`${newId}-img-${Date.now()}-${img.display_order}`, newId, img.url, img.image_type, img.label, img.display_order, 1, now]
      );
    }

    // Duplicate features
    const originalFeatures = queryAll('SELECT * FROM vehicle_features WHERE vehicle_id = ?', [original.id]);
    for (const f of originalFeatures) {
      runSql(
        'INSERT INTO vehicle_features (id, vehicle_id, feature_name) VALUES (?, ?, ?)',
        [`${newId}-feat-${Date.now()}`, newId, f.feature_name]
      );
    }

    const created = queryOne('SELECT * FROM vehicles WHERE id = ?', [newId]);
    res.status(201).json(formatVehicle(created));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to duplicate vehicle' });
  }
});

// Reorder vehicles
apiRouter.put('/vehicles/reorder', requireAdmin, (req: Request, res: Response) => {
  try {
    const { orderList } = req.body; // Array of { id, displayOrder }
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ error: 'orderList array is required' });
    }

    for (const item of orderList) {
      runSql('UPDATE vehicles SET display_order = ? WHERE id = ?', [item.displayOrder, item.id]);
    }

    res.json({ message: 'Vehicles reordered successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reorder vehicles' });
  }
});

// Delete vehicle
apiRouter.delete('/vehicles/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT id, name FROM vehicles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Cascade deletes handle vehicle_images and vehicle_features
    runSql('DELETE FROM vehicles WHERE id = ?', [id]);
    res.json({ message: `Vehicle "${existing.name}" deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ==========================================
// 6. VEHICLE PHOTOS & RELATIONAL INTEGRITY
// ==========================================

// Get photos for a specific vehicle
apiRouter.get('/vehicles/:id/images', (req: Request, res: Response) => {
  try {
    const images = queryAll(
      'SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY display_order ASC, created_at ASC',
      [req.params.id]
    );
    res.json(images);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve vehicle images' });
  }
});

// Add photo to a specific vehicle
apiRouter.post('/vehicles/:id/images', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = queryOne('SELECT id, name, strict_model_code FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const { url, image_type = 'gallery', label = 'Photo', is_primary = false, verified_match = 1 } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const imgId = `${id}-img-${Date.now()}`;
    const now = new Date().toISOString();

    const maxOrderRow = queryOne('SELECT MAX(display_order) as maxOrder FROM vehicle_images WHERE vehicle_id = ?', [id]);
    const displayOrder = (maxOrderRow?.maxOrder || 0) + 1;

    runSql(
      `INSERT INTO vehicle_images (id, vehicle_id, url, image_type, label, display_order, verified_match, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [imgId, id, url, is_primary ? 'primary' : image_type, label, displayOrder, verified_match ? 1 : 0, now]
    );

    if (is_primary) {
      // Demote existing primary image
      runSql("UPDATE vehicle_images SET image_type = 'gallery' WHERE vehicle_id = ? AND id != ?", [id, imgId]);
      runSql('UPDATE vehicles SET primary_image = ?, updated_at = ? WHERE id = ?', [url, now, id]);
    }

    res.status(201).json({
      id: imgId,
      vehicle_id: id,
      url,
      image_type: is_primary ? 'primary' : image_type,
      label,
      display_order: displayOrder,
      verified_match: verified_match ? 1 : 0,
      created_at: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add image to vehicle' });
  }
});

// Set photo as primary
apiRouter.put('/vehicles/:id/images/:imageId/primary', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    const img = queryOne('SELECT * FROM vehicle_images WHERE id = ? AND vehicle_id = ?', [imageId, id]);
    if (!img) {
      return res.status(404).json({ error: 'Image not found for this vehicle' });
    }

    const now = new Date().toISOString();
    // Demote all to gallery
    runSql("UPDATE vehicle_images SET image_type = 'gallery' WHERE vehicle_id = ?", [id]);
    // Promote this one
    runSql("UPDATE vehicle_images SET image_type = 'primary' WHERE id = ?", [imageId]);
    // Update vehicle table primary_image
    runSql('UPDATE vehicles SET primary_image = ?, updated_at = ? WHERE id = ?', [img.url, now, id]);

    res.json({ message: 'Primary photo updated', primaryImageUrl: img.url });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to set primary image' });
  }
});

// Delete vehicle image
apiRouter.delete('/vehicles/:id/images/:imageId', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    const img = queryOne('SELECT * FROM vehicle_images WHERE id = ? AND vehicle_id = ?', [imageId, id]);
    if (!img) {
      return res.status(404).json({ error: 'Image not found for this vehicle' });
    }

    runSql('DELETE FROM vehicle_images WHERE id = ?', [imageId]);

    // If deleted image was primary, set next available image as primary
    if (img.image_type === 'primary') {
      const nextImg = queryOne('SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY display_order ASC LIMIT 1', [id]);
      if (nextImg) {
        runSql("UPDATE vehicle_images SET image_type = 'primary' WHERE id = ?", [nextImg.id]);
        runSql('UPDATE vehicles SET primary_image = ? WHERE id = ?', [nextImg.url, id]);
      }
    }

    res.json({ message: 'Image deleted from vehicle' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete vehicle image' });
  }
});

// Reorder vehicle images
apiRouter.put('/vehicles/:id/images/reorder', requireAdmin, (req: Request, res: Response) => {
  try {
    const { imageOrder } = req.body; // Array of { id, displayOrder }
    if (!Array.isArray(imageOrder)) {
      return res.status(400).json({ error: 'imageOrder array required' });
    }

    for (const item of imageOrder) {
      runSql('UPDATE vehicle_images SET display_order = ? WHERE id = ? AND vehicle_id = ?', [
        item.displayOrder,
        item.id,
        req.params.id,
      ]);
    }

    res.json({ message: 'Image order updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

// ==========================================
// 7. FILE UPLOAD & MEDIA MANAGER
// ==========================================

// Multipart form upload
apiRouter.post('/upload', requireAdmin, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const publicUrl = `/uploads/vehicles/${req.file.filename}`;
    const vehicleId = req.body.vehicleId || null;
    const now = new Date().toISOString();

    const mediaId = `media-${Date.now()}`;
    runSql(
      `INSERT INTO media_assets (id, filename, url, mime_type, size_bytes, assigned_vehicle_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mediaId, req.file.filename, publicUrl, req.file.mimetype, req.file.size, vehicleId, now]
    );

    res.json({
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      mediaId,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Base64 upload endpoint (useful for camera captures, paste, drag & drop)
apiRouter.post('/upload-base64', requireAdmin, (req: Request, res: Response) => {
  try {
    const { base64Data, filename = 'car-upload.jpg', vehicleId } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : 'image/jpeg';
    const rawData = matches ? matches[2] : base64Data;
    const buffer = Buffer.from(rawData, 'base64');

    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const savedName = 'vehicle-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    const filePath = path.join(uploadDir, savedName);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/vehicles/${savedName}`;
    const now = new Date().toISOString();

    const mediaId = `media-${Date.now()}`;
    runSql(
      `INSERT INTO media_assets (id, filename, url, mime_type, size_bytes, assigned_vehicle_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mediaId, savedName, publicUrl, mimeType, buffer.length, vehicleId || null, now]
    );

    res.json({
      url: publicUrl,
      filename: savedName,
      size: buffer.length,
      mimeType,
      mediaId,
    });
  } catch (err: any) {
    console.error('Base64 upload error:', err);
    res.status(500).json({ error: 'Failed to process base64 upload' });
  }
});

// List media assets
apiRouter.get('/media', requireAdmin, (req: Request, res: Response) => {
  try {
    const media = queryAll(`
      SELECT m.*, v.name as assigned_vehicle_name 
      FROM media_assets m
      LEFT JOIN vehicles v ON m.assigned_vehicle_id = v.id
      ORDER BY m.created_at DESC
    `);
    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch media assets' });
  }
});

// Delete media asset
apiRouter.delete('/media/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const asset = queryOne('SELECT * FROM media_assets WHERE id = ?', [req.params.id]);
    if (!asset) {
      return res.status(404).json({ error: 'Media asset not found' });
    }

    // Try deleting physical file
    const filePath = path.join(process.cwd(), asset.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete physical file:', filePath);
      }
    }

    runSql('DELETE FROM media_assets WHERE id = ?', [req.params.id]);
    res.json({ message: 'Media asset deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete media asset' });
  }
});

// ==========================================
// 8. BOOKING & ENQUIRY MANAGEMENT
// ==========================================

// Create booking enquiry (Public or WhatsApp tracking)
apiRouter.post('/enquiries', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customer_name,
      phone,
      whatsapp,
      email,
      vehicleId,
      vehicle_id,
      vehicleName,
      vehicle_name,
      pickupDate,
      pickup_date,
      returnDate,
      return_date,
      pickupLocation,
      pickup_location,
      driveOption,
      drive_option,
      message,
    } = req.body;

    const name = customerName || customer_name;
    const tel = phone || whatsapp;

    if (!name || !tel) {
      return res.status(400).json({ error: 'Customer name and phone/WhatsApp number are required' });
    }

    const id = `enq-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    runSql(
      `INSERT INTO enquiries (
        id, customer_name, phone, whatsapp, email, vehicle_id, vehicle_name,
        pickup_date, return_date, pickup_location, drive_option, message,
        status, admin_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        tel,
        whatsapp || tel,
        email || '',
        vehicleId || vehicle_id || '',
        vehicleName || vehicle_name || 'Vehicle Inquiry',
        pickupDate || pickup_date || '',
        returnDate || return_date || '',
        pickupLocation || pickup_location || 'Lahore, Pakistan',
        driveOption || drive_option || 'self_drive',
        message || 'Customer initiated booking via platform.',
        'new',
        '',
        now,
        now,
      ]
    );

    res.status(201).json({ id, message: 'Enquiry recorded successfully' });
  } catch (err: any) {
    console.error('Enquiry creation error:', err);
    res.status(500).json({ error: 'Failed to submit booking enquiry' });
  }
});

// List enquiries (Admin only)
apiRouter.get('/enquiries', requireAdmin, (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    let sql = 'SELECT * FROM enquiries';
    const params: any[] = [];

    if (status && status !== 'all') {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';
    const enquiries = queryAll(sql, params);
    res.json(enquiries);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// Update enquiry status and notes (Admin only)
apiRouter.put('/enquiries/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, admin_notes } = req.body;
    const existing = queryOne('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    const now = new Date().toISOString();
    runSql(
      'UPDATE enquiries SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?',
      [status ?? existing.status, admin_notes ?? existing.admin_notes, now, req.params.id]
    );

    const updated = queryOne('SELECT * FROM enquiries WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// Delete enquiry (Admin only)
apiRouter.delete('/enquiries/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    runSql('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Enquiry deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

// ==========================================
// 9. FAQ MANAGEMENT
// ==========================================

apiRouter.get('/faqs', (req: Request, res: Response) => {
  try {
    const includeUnpublished = req.query.all === 'true';
    let sql = 'SELECT * FROM faqs';
    if (!includeUnpublished) {
      sql += ' WHERE is_published = 1';
    }
    sql += ' ORDER BY display_order ASC, id ASC';
    const faqs = queryAll(sql);
    res.json(faqs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load FAQs' });
  }
});

apiRouter.post('/faqs', requireAdmin, (req: Request, res: Response) => {
  try {
    const { question, answer, category = 'General', display_order = 1, is_published = 1 } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const id = `faq-${Date.now()}`;
    runSql(
      'INSERT INTO faqs (id, question, answer, category, display_order, is_published) VALUES (?, ?, ?, ?, ?, ?)',
      [id, question, answer, category, Number(display_order) || 1, is_published ? 1 : 0]
    );

    const created = queryOne('SELECT * FROM faqs WHERE id = ?', [id]);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

apiRouter.put('/faqs/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { question, answer, category, display_order, is_published } = req.body;
    const existing = queryOne('SELECT * FROM faqs WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'FAQ not found' });

    runSql(
      'UPDATE faqs SET question = ?, answer = ?, category = ?, display_order = ?, is_published = ? WHERE id = ?',
      [
        question ?? existing.question,
        answer ?? existing.answer,
        category ?? existing.category,
        display_order !== undefined ? Number(display_order) : existing.display_order,
        is_published !== undefined ? (is_published ? 1 : 0) : existing.is_published,
        req.params.id,
      ]
    );

    const updated = queryOne('SELECT * FROM faqs WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

apiRouter.delete('/faqs/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    runSql('DELETE FROM faqs WHERE id = ?', [req.params.id]);
    res.json({ message: 'FAQ deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ==========================================
// 10. DASHBOARD ANALYTICS & OVERVIEW
// ==========================================

apiRouter.get('/admin/dashboard', requireAdmin, (req: Request, res: Response) => {
  try {
    const totalVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles');
    const activeVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles WHERE is_active = 1');
    const availableVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles WHERE status = "available" AND is_active = 1');
    const bookedVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles WHERE status = "booked"');
    const maintenanceVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles WHERE status = "maintenance"');
    const unavailableVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles WHERE is_active = 0 OR status != "available"');
    const featuredVehiclesRow = queryOne('SELECT COUNT(*) as count FROM vehicles WHERE is_featured = 1 AND is_active = 1');

    const totalEnquiriesRow = queryOne('SELECT COUNT(*) as count FROM enquiries');
    const newEnquiriesRow = queryOne('SELECT COUNT(*) as count FROM enquiries WHERE status = "new"');
    const confirmedEnquiriesRow = queryOne('SELECT COUNT(*) as count FROM enquiries WHERE status = "confirmed"');

    const recentEnquiries = queryAll('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 6');
    const vehiclesList = queryAll('SELECT id, name, model, year, category, status, is_active, price_per_day, primary_image FROM vehicles ORDER BY display_order ASC LIMIT 8');

    res.json({
      counts: {
        totalVehicles: totalVehiclesRow?.count || 0,
        activeVehicles: activeVehiclesRow?.count || 0,
        availableVehicles: availableVehiclesRow?.count || 0,
        bookedVehicles: bookedVehiclesRow?.count || 0,
        maintenanceVehicles: maintenanceVehiclesRow?.count || 0,
        unavailableVehicles: unavailableVehiclesRow?.count || 0,
        featuredVehicles: featuredVehiclesRow?.count || 0,
        totalEnquiries: totalEnquiriesRow?.count || 0,
        newEnquiries: newEnquiriesRow?.count || 0,
        confirmedEnquiries: confirmedEnquiriesRow?.count || 0,
      },
      recentEnquiries,
      fleetSummary: vehiclesList.map(v => ({
        ...v,
        isActive: Boolean(v.is_active),
        pricePerDay: v.price_per_day,
        primaryImage: v.primary_image
      })),
    });
  } catch (err: any) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});
