import React, { useEffect, useState } from 'react';
import {
  Car,
  CheckCircle2,
  Clock,
  Wrench,
  MessageSquareQuote,
  PlusCircle,
  Building2,
  ExternalLink,
  ChevronRight,
  Phone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardMetrics, Enquiry } from '../../types';
import { api } from '../../services/api';
import { AdminTab } from '../AdminLayout';

interface AdminDashboardViewProps {
  onNavigateTab: (tab: AdminTab) => void;
  onOpenAddVehicle: () => void;
  onOpenPublicSite: () => void;
}

export function AdminDashboardView({
  onNavigateTab,
  onOpenAddVehicle,
  onOpenPublicSite,
}: AdminDashboardViewProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const counts = metrics?.counts || {
    totalVehicles: 0,
    activeVehicles: 0,
    availableVehicles: 0,
    bookedVehicles: 0,
    maintenanceVehicles: 0,
    totalEnquiries: 0,
    newEnquiries: 0,
    confirmedEnquiries: 0,
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-800/90 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Fleet Operations</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Executive Fleet Management Console</h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
              All vehicle records, specifications, client photos, and customer reservations are synchronized in the persistent database.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="dash-btn-add-vehicle"
              onClick={onOpenAddVehicle}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
            <button
              id="dash-btn-preview"
              onClick={onOpenPublicSite}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors border border-neutral-700"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Preview Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400">Total Fleet</span>
            <div className="p-2 rounded-xl bg-neutral-800 text-amber-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{counts.totalVehicles}</span>
            <span className="text-[11px] text-emerald-400 font-medium">({counts.activeVehicles} active)</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Verified models in database</p>
        </div>

        {/* Available Right Now */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400">Available Now</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{counts.availableVehicles}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Ready for dispatch</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Instant customer handover</p>
        </div>

        {/* Booked / In Maintenance */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400">On Rental / Maint.</span>
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{counts.bookedVehicles + counts.maintenanceVehicles}</span>
            <span className="text-[11px] text-amber-400 font-medium">{counts.bookedVehicles} Booked</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">{counts.maintenanceVehicles} in scheduled service</p>
        </div>

        {/* Inquiries / Bookings */}
        <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-400">Inquiries Received</span>
            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{counts.totalEnquiries}</span>
            {counts.newEnquiries > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                {counts.newEnquiries} NEW
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Web form & WhatsApp leads</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('vehicles')}
          className="p-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Manage Vehicles</p>
              <p className="text-[11px] text-neutral-400">CRUD specs, pricing, status</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          onClick={() => onNavigateTab('media')}
          className="p-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Photos & Verification</p>
              <p className="text-[11px] text-neutral-400">Strict model image matching</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          onClick={() => onNavigateTab('enquiries')}
          className="p-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Customer Enquiries</p>
              <p className="text-[11px] text-neutral-400">Reply via WhatsApp & call</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          onClick={() => onNavigateTab('business')}
          className="p-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Business Settings</p>
              <p className="text-[11px] text-neutral-400">Phone, WhatsApp, address</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-amber-400 transition-colors" />
        </button>
      </div>

      {/* Recent Enquiries & Fleet Overview split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enquiries Table (2 Cols) */}
        <div className="lg:col-span-2 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Recent Booking Inquiries</h3>
              <p className="text-xs text-neutral-400">Customers requesting reservation or inquiry</p>
            </div>
            <button
              onClick={() => onNavigateTab('enquiries')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {metrics?.recentEnquiries && metrics.recentEnquiries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Dates / Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {metrics.recentEnquiries.map((enq) => {
                    const statusColors = {
                      new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
                      completed: 'bg-neutral-700/40 text-neutral-300 border-neutral-600/30',
                    };
                    const colorClass = statusColors[enq.status] || statusColors.new;

                    return (
                      <tr key={enq.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3">
                          <p className="font-semibold text-white">{enq.customer_name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">{enq.phone}</p>
                        </td>
                        <td className="py-3">
                          <span className="font-medium text-neutral-200">{enq.vehicle_name}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-neutral-400">
                            {enq.pickup_date ? `${enq.pickup_date}` : 'Immediate'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${colorClass}`}>
                            {enq.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1">
                          {enq.whatsapp && (
                            <a
                              href={`https://wa.me/${enq.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello ${enq.customer_name}, thank you for your booking enquiry for ${enq.vehicle_name} at Apex Car Rental. How may we assist with your reservation?`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-400"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={`tel:${enq.phone}`}
                            className="inline-flex p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200"
                            title="Call Customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-500 text-xs">
              <MessageSquareQuote className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
              <p>No customer enquiries recorded yet.</p>
              <p className="text-[11px] text-neutral-600 mt-1">Bookings from the public website will appear here in real-time.</p>
            </div>
          )}
        </div>

        {/* Fleet Summary Card (1 Col) */}
        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Fleet Quick Glance</h3>
                <p className="text-xs text-neutral-400">Available vehicles in system</p>
              </div>
              <button
                onClick={() => onNavigateTab('vehicles')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Fleet Table →
              </button>
            </div>

            <div className="space-y-3">
              {(metrics?.fleetSummary || []).slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={v.primaryImage}
                      alt={v.name}
                      className="w-10 h-8 rounded-lg object-cover bg-neutral-800 border border-neutral-700/60 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{v.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{v.pricePerDay}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 capitalize ${
                      v.status === 'available'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : v.status === 'booked'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Exact Matching Rule Enforced</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
