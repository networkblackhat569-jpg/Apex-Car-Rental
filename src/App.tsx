import React, { useState, useEffect, useMemo } from 'react';
import { initialVehicles } from './data/vehicles';
import { Vehicle, BusinessSettings, HomepageSettings } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VehicleCard } from './components/VehicleCard';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { VehicleVerifierModal } from './components/VehicleVerifierModal';
import { ConciergeChat } from './components/ConciergeChat';
import { StickyMobileBookingCTA } from './components/StickyMobileBookingCTA';
import { RentalPolicySection } from './components/RentalPolicySection';
import { CustomerBookingModal } from './components/CustomerBookingModal';
import { AdminDashboard } from './admin/AdminDashboard';
import {
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Car,
  FilterX,
  Phone,
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
  Award,
  Users,
} from 'lucide-react';

export default function App() {
  // Navigation / View mode: check URL on init for /admin or #admin
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin')
      );
    }
    return false;
  });

  // Fleet data from backend API
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);

  // Customer UI Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeModalVehicle, setActiveModalVehicle] = useState<Vehicle | null>(null);
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync route changes (Back/Forward buttons or hash changes)
  useEffect(() => {
    const handleLocationChange = () => {
      const shouldBeAdmin =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin');
      setIsAdminRoute(shouldBeAdmin);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = '#admin';
    setIsAdminRoute(true);
  };

  const navigateToPublic = () => {
    window.location.hash = '';
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
    setIsAdminRoute(false);
  };

  // Fetch live public data from backend API
  const fetchPublicData = async () => {
    try {
      const [fleetData, bSettings, hSettings] = await Promise.all([
        api.getVehicles(),
        api.getBusinessSettings().catch(() => null),
        api.getHomepageSettings().catch(() => null),
      ]);

      if (fleetData && fleetData.length > 0) {
        setVehicles(fleetData);
      }
      if (bSettings) setBusinessSettings(bSettings);
      if (hSettings) setHomepageSettings(hSettings);
    } catch (err) {
      console.warn('Using local fallback fleet catalog:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);

  // Filter categories
  const categories = useMemo(() => {
    const cats = new Set<string>(['All']);
    vehicles.forEach((v) => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.fuel && v.fuel.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [vehicles, selectedCategory, searchQuery]);

  // Dynamic WhatsApp contact number
  const publicWhatsApp = businessSettings?.whatsapp_number || '923001234567';
  const publicPhone = businessSettings?.phone || '+92 (300) 123-4567';
  const publicEmail = businessSettings?.email || 'reservations@apexrentacar.pk';
  const publicAddress = businessSettings?.address || 'Islamabad & Lahore, Pakistan';

  // IF ADMIN ROUTE ACTIVE: Render secure admin portal!
  if (isAdminRoute) {
    return (
      <AdminDashboard
        onExitAdmin={navigateToPublic}
        onRefreshPublicData={fetchPublicData}
      />
    );
  }

  // PUBLIC CUSTOMER-FACING LUXURY RENTAL SITE
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-amber-500/40 bg-neutral-900/95 px-4 py-2.5 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenVerifier={() => setIsVerifierOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAdmin={navigateToAdmin}
        totalVehicles={vehicles.length}
      />

      {/* Cinematic Hero */}
      <Hero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        homepageSettings={homepageSettings}
      />

      {/* Proof Points Strip (Configurable via Admin Homepage settings) */}
      <div className="border-b border-neutral-800/80 bg-neutral-900/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-white font-serif">
                {homepageSettings?.stat_vehicles || `${vehicles.length}+ Cars`}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Verified Fleet Scale</p>
            </div>
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-serif">
                {homepageSettings?.stat_matching || '100% Guaranteed'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Strict Model Match</p>
            </div>
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-white font-serif">
                {homepageSettings?.stat_satisfaction || '99.4%'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Client Satisfaction</p>
            </div>
            <div className="p-3">
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-serif">
                {homepageSettings?.stat_experience || '12+ Years'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">Automotive Hospitality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Catalog Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-neutral-800/80">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Dedicated Exact Model Fleet</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
              Available Vehicles for Immediate Booking
            </h2>
          </div>

          <div className="mt-3 sm:mt-0 flex items-center space-x-3 text-xs text-neutral-400">
            <span>
              Showing {filteredVehicles.length} of {vehicles.length} vehicles
            </span>
            <span className="h-1 w-1 rounded-full bg-neutral-700" />
            <span className="text-emerald-400 font-medium">Model Match Guaranteed</span>
          </div>
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onViewDetails={(v) => setActiveModalVehicle(v)}
                onBookNow={(v) => setBookingVehicle(v)}
              />
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-12 text-center my-8">
            <FilterX className="mx-auto h-12 w-12 text-neutral-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No matching vehicles found</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-4">
              We couldn't find any vehicle matching "{searchQuery}" in category "{selectedCategory}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Strict Matching Policy & Rental Terms Section */}
      <RentalPolicySection />

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 pt-12 pb-16 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Column 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold text-lg font-serif">
                <Car className="h-5 w-5 text-amber-400" />
                <span>
                  APEX <span className="text-amber-400 font-sans font-light">CAR RENTAL</span>
                </span>
              </div>
              <p className="text-neutral-400 leading-relaxed text-xs">
                Pakistan's premier rent-a-car agency with uncompromising exact vehicle model matching. Serving Islamabad, Rawalpindi, Lahore, and Karachi.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold">
                  Zero Generic Substitutions Guarantee
                </span>
              </div>
            </div>

            {/* Column 2: Fleet Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Featured Fleet
              </h4>
              <ul className="space-y-2 text-neutral-400">
                {vehicles.slice(0, 6).map((car) => (
                  <li key={car.id}>
                    <button
                      onClick={() => {
                        setActiveModalVehicle(car);
                      }}
                      className="hover:text-amber-300 transition-colors text-left"
                    >
                      {car.name} ({car.year})
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Hotline & Reservations
              </h4>
              <ul className="space-y-2.5 text-neutral-400">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-neutral-200">{publicPhone}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <a
                    href={`https://wa.me/${publicWhatsApp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-emerald-400 underline"
                  >
                    WhatsApp Direct Booking
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span>{publicEmail}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span>{publicAddress}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span>24/7 Handover & Roadside Support</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Quality Commitment & Staff Portal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Vehicle Integrity
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                Every vehicle listed is thoroughly sanitized, fully insured, mechanically inspected, and visually authenticated before handover.
              </p>
              <button
                id="footer-verify-btn"
                onClick={() => setIsVerifierOpen(true)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 hover:border-amber-500/40 p-2.5 text-xs font-semibold text-neutral-200 flex items-center justify-center space-x-2 transition-colors mb-3"
              >
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span>Verify Fleet Photos with AI</span>
              </button>

              {/* Discreet Staff Portal Link */}
              <button
                id="footer-admin-login-btn"
                onClick={navigateToAdmin}
                className="w-full flex items-center justify-center space-x-2 py-2 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-600" />
                <span>Client Staff Portal & Fleet Admin</span>
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500">
            <p>
              © {new Date().getFullYear()} Apex Car Rental. All rights reserved. Strict vehicle model matching enforced.
            </p>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span>Managed via Apex Control Platform</span>
              <button
                onClick={navigateToAdmin}
                className="text-neutral-500 hover:text-amber-400 underline"
              >
                Admin Login
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Dedicated Vehicle Detail Modal */}
      {activeModalVehicle && (
        <VehicleDetailModal
          vehicle={activeModalVehicle}
          onClose={() => setActiveModalVehicle(null)}
          onBookNow={(v) => {
            setActiveModalVehicle(null);
            setBookingVehicle(v);
          }}
          onSaveToKeepNote={(v) => {
            showToast(`Copied ${v.name} rental checklist for Google Keep`);
          }}
        />
      )}

      {/* Customer Reservation & WhatsApp Enquiry Modal */}
      {bookingVehicle && (
        <CustomerBookingModal
          vehicle={bookingVehicle}
          whatsappNumber={publicWhatsApp}
          onClose={() => setBookingVehicle(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* AI Vehicle Image Verifier Modal */}
      <VehicleVerifierModal
        isOpen={isVerifierOpen}
        onClose={() => setIsVerifierOpen(false)}
        vehicles={vehicles}
      />

      {/* Gemini Fleet Concierge Chat */}
      <ConciergeChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Sticky Mobile Booking CTA */}
      {vehicles.length > 0 && (
        <StickyMobileBookingCTA
          featuredVehicle={vehicles[0]}
          onViewDetails={(v) => setActiveModalVehicle(v)}
        />
      )}

      {/* Floating Concierge Chat trigger on desktop */}
      {!isChatOpen && (
        <button
          id="floating-chat-trigger"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center space-x-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-xs font-bold text-neutral-950 shadow-xl shadow-amber-950/40 hover:from-amber-400 hover:to-amber-500 transition-all hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
          <span>Fleet Concierge</span>
        </button>
      )}
    </div>
  );
}
