export interface VehiclePhotos {
  front?: string;
  side?: string;
  rear?: string;
  interior?: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id?: string;
  vehicleId?: string;
  url: string;
  image_type?: 'primary' | 'gallery' | 'exterior_front' | 'exterior_side' | 'exterior_rear' | 'interior_dash' | 'interior_cabin';
  type?: string;
  label?: string;
  display_order?: number;
  displayOrder?: number;
  verified_match?: number | boolean;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  brand?: string;
  model: string;
  year: string;
  category: string;
  transmission: string;
  seats: number;
  fuel: string;
  fuelType?: 'Petrol' | 'Diesel' | 'CNG' | 'Hybrid' | 'Electric' | 'Other' | string;
  fuel_type?: string;
  fuelPolicy?: 'Fuel Included' | 'Fuel Not Included' | 'Customer Pays Fuel' | 'Full Tank / Return Full' | 'Custom' | string;
  fuel_policy?: string;
  engine?: string;
  pricePerDay: string;
  price_per_day?: string;
  weeklyPrice?: string;
  pricePerWeek?: string;
  price_per_week?: string;
  monthlyPrice?: string;
  pricePerMonth?: string;
  price_per_month?: string;
  securityDeposit?: string;
  security_deposit?: string;
  mileageLimit?: string;
  mileage_limit?: string;
  extraKmRate?: string;
  extra_km_rate?: string;
  color?: string;
  luggage?: string;
  image: string; // Canonical primary image matching exact model
  primaryImage?: string;
  primary_image?: string;
  description: string;
  detailedDescription?: string;
  detailed_description?: string;
  features: string[];
  availability: 'Available' | 'Reserved' | 'In Maintenance' | 'Booked' | 'Maintenance';
  status?: 'available' | 'booked' | 'maintenance';
  isActive?: boolean;
  is_active?: number | boolean;
  isFeatured?: boolean;
  is_featured?: number | boolean;
  displayOrder?: number;
  display_order?: number;
  rentalTerms: string;
  rental_terms?: string;
  strictModelCode: string;
  strict_model_code?: string;
  images?: VehicleImage[];
  clientPhotos?: VehiclePhotos;
  gallery?: VehiclePhotos;
  engineCapacity?: string;
  fuelAverage?: string;
  hasAC?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessSettings {
  id?: string;
  business_name: string;
  tagline?: string;
  logo_url?: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  city: string;
  operating_hours: string;
  currency: string;
  facebook_url?: string;
  instagram_url?: string;
  maps_url?: string;
  supabase_url?: string | null;
  supabase_anon_key?: string | null;
  supabase_bucket?: string | null;
  updated_at?: string;
}

export interface HomepageSettings {
  id?: string;
  hero_badge?: string;
  hero_title?: string;
  hero_subtitle?: string;
  stat_vehicles?: string;
  stat_satisfaction?: string;
  stat_matching?: string;
  stat_experience?: string;
  trust_heading?: string;
  trust_description?: string;
  updated_at?: string;
}

export interface SeoSettings {
  id?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  updated_at?: string;
}

export interface Enquiry {
  id: string;
  customer_name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  vehicle_id?: string;
  vehicle_name: string;
  pickup_date?: string;
  return_date?: string;
  pickup_location?: string;
  drive_option?: 'self_drive' | 'with_driver';
  message?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'cancelled' | 'completed';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
  is_published: number | boolean;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mime_type?: string;
  size_bytes?: number;
  assigned_vehicle_id?: string;
  assigned_vehicle_name?: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
  must_change_password?: number | boolean;
}

export interface DashboardMetrics {
  counts: {
    totalVehicles: number;
    activeVehicles: number;
    availableVehicles: number;
    bookedVehicles: number;
    maintenanceVehicles: number;
    unavailableVehicles?: number;
    featuredVehicles?: number;
    totalEnquiries: number;
    newEnquiries: number;
    confirmedEnquiries: number;
  };
  recentEnquiries: Enquiry[];
  fleetSummary: Array<{
    id: string;
    name: string;
    model: string;
    year: string;
    category: string;
    status: string;
    isActive: boolean;
    pricePerDay: string;
    primaryImage: string;
  }>;
}

export interface VerificationResult {
  isMatch: boolean;
  detectedModel: string;
  claimedModel: string;
  confidence: number;
  explanation: string;
  visualCheckmarks: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedVehicles?: string[];
}
