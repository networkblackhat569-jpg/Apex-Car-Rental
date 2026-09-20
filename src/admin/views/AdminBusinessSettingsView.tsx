import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Save,
  Database,
  CheckCircle2,
  Globe,
  Share2,
} from 'lucide-react';
import { BusinessSettings } from '../../types';
import { api } from '../../services/api';

interface AdminBusinessSettingsViewProps {
  onSettingsUpdated: (settings: BusinessSettings) => void;
  onToast: (msg: string) => void;
}

export function AdminBusinessSettingsView({
  onSettingsUpdated,
  onToast,
}: AdminBusinessSettingsViewProps) {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  // Supabase optional credentials
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseBucket, setSupabaseBucket] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getBusinessSettings();
      setSettings(data);
      setBusinessName(data.business_name || '');
      setTagline(data.tagline || '');
      setLogoUrl(data.logo_url || '');
      setPhone(data.phone || '');
      setWhatsappNumber(data.whatsapp_number || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      setCity(data.city || '');
      setOperatingHours(data.operating_hours || '');
      setCurrency(data.currency || 'PKR');
      setFacebookUrl(data.facebook_url || '');
      setInstagramUrl(data.instagram_url || '');
      setMapsUrl(data.maps_url || '');
      setSupabaseUrl(data.supabase_url || '');
      setSupabaseAnonKey(data.supabase_anon_key || '');
      setSupabaseBucket(data.supabase_bucket || '');
    } catch (err) {
      console.error('Failed to load business settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Partial<BusinessSettings> = {
        business_name: businessName,
        tagline,
        logo_url: logoUrl,
        phone,
        whatsapp_number: whatsappNumber,
        email,
        address,
        city,
        operating_hours: operatingHours,
        currency,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        maps_url: mapsUrl,
        supabase_url: supabaseUrl || null,
        supabase_anon_key: supabaseAnonKey || null,
        supabase_bucket: supabaseBucket || null,
      };

      const updated = await api.updateBusinessSettings(payload);
      setSettings(updated);
      onSettingsUpdated(updated);
      onToast('Business settings saved successfully!');
    } catch (err: any) {
      onToast(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-neutral-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading business settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Company & Operational Settings</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Changes made here instantly update the public website headers, footers, WhatsApp booking triggers, and contact links.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Brand Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Apex Luxury Car Rental"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Premium Executive & Chauffeur Fleet"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Custom Logo Image URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://... or /logo.png"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Contact Numbers & WhatsApp Channels */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <Phone className="w-4 h-4 text-amber-400" />
            <span>Customer Contact & Booking Channels</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Official Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-neutral-500 mt-1">Displays on header & click-to-call buttons</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                WhatsApp Dispatch Number *
              </label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                All vehicle "Book on WhatsApp" CTAs route directly to this number
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Customer Support Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@apexrentacar.com"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Base Currency</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="PKR"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Location & Showroom */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Showroom & Operating Timings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Office / Showroom Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 14-C, Main Boulevard, DHA Phase 6"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">City & Region *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore / Islamabad / Karachi, Pakistan"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="24/7 Dispatch & Support Available"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Google Maps Pin URL</label>
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>Social Media Presence</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Facebook Page URL</label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/apexrentacar"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Instagram Profile URL</label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/apexrentacar"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Optional External Supabase Sync Configuration */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-amber-400" />
              <span>External Cloud Sync (Optional Supabase Configuration)</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
              Local SQLite Active
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            The platform currently runs on a high-performance local SQLite persistent database. If you wish to connect your external Supabase project for multi-region redundancy or storage buckets, configure credentials below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Supabase Project URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Supabase Storage Bucket</label>
              <input
                type="text"
                value={supabaseBucket}
                onChange={(e) => setSupabaseBucket(e.target.value)}
                placeholder="vehicle-photos"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Supabase Anon Key</label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end">
          <button
            id="btn-save-business-settings"
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Business Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
