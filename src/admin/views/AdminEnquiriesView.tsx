import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Search,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  MapPin,
  Car,
  CheckCircle2,
  Trash2,
  Save,
  Clock,
  User,
} from 'lucide-react';
import { Enquiry } from '../../types';
import { api } from '../../services/api';

interface AdminEnquiriesViewProps {
  onToast: (msg: string) => void;
}

export function AdminEnquiriesView({ onToast }: AdminEnquiriesViewProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await api.getEnquiries(statusFilter);
      setEnquiries(data);
      // Initialize notes drafts
      const drafts: Record<string, string> = {};
      data.forEach((e) => {
        drafts[e.id] = e.admin_notes || '';
      });
      setNotesDrafts(drafts);
    } catch (err: any) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      const updated = await api.updateEnquiry(id, { status });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: updated.status } : e)));
      onToast(`Enquiry updated to ${status}`);
    } catch (err: any) {
      onToast('Failed to update status');
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      const admin_notes = notesDrafts[id] || '';
      await api.updateEnquiry(id, { admin_notes });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, admin_notes } : e)));
      onToast('Admin note saved');
    } catch (err: any) {
      onToast('Failed to save notes');
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!window.confirm(`Delete enquiry from "${customerName}"?`)) return;
    try {
      await api.deleteEnquiry(id);
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      onToast('Enquiry deleted');
    } catch (err: any) {
      onToast('Failed to delete enquiry');
    }
  };

  // Filtered by search
  const filtered = enquiries.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.customer_name.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      e.vehicle_name.toLowerCase().includes(q) ||
      (e.email && e.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Reservations & Enquiries</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Review customer bookings, launch instant WhatsApp replies, and log staff notes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'new', 'contacted', 'confirmed', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors border ${
                statusFilter === st
                  ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone, vehicle..."
          className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Enquiries List / Cards */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading customer enquiries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
          <MessageSquareQuote className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-400">No enquiries found</p>
          <p className="text-xs text-neutral-500 mt-1">
            New customer booking requests from the public site will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((enq) => {
            const statusBadgeColors = {
              new: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
              contacted: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
              confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
              completed: 'bg-neutral-800 text-neutral-400 border-neutral-700',
            };

            const whatsappMessage = encodeURIComponent(
              `Hello ${enq.customer_name},\n\nThank you for choosing Apex Luxury Car Rental. We have received your booking inquiry for the *${enq.vehicle_name}*.\n\n` +
                (enq.pickup_date ? `Pickup Date: ${enq.pickup_date}\n` : '') +
                (enq.return_date ? `Return Date: ${enq.return_date}\n` : '') +
                `\nWould you like us to finalize the reservation for you?`
            );

            return (
              <div
                key={enq.id}
                className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 shadow-lg backdrop-blur-sm space-y-4"
              >
                {/* Top Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-sm">{enq.customer_name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            statusBadgeColors[enq.status] || statusBadgeColors.new
                          }`}
                        >
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Received: {new Date(enq.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions (WhatsApp & Call & Status Selector) */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={enq.status}
                      onChange={(e) => handleUpdateStatus(enq.id, e.target.value)}
                      className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none"
                    >
                      <option value="new">New Inquiry</option>
                      <option value="contacted">Customer Contacted</option>
                      <option value="confirmed">Booking Confirmed</option>
                      <option value="completed">Completed / Returned</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <a
                      href={`https://wa.me/${(enq.whatsapp || enq.phone).replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 font-semibold text-xs border border-emerald-800/60 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${enq.phone}`}
                      className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleDelete(enq.id, enq.customer_name)}
                      className="p-1.5 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-700"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-neutral-500">Vehicle Requested</span>
                    <div className="flex items-center space-x-1.5 font-bold text-white">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <span>{enq.vehicle_name}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-neutral-500">Contact Number</span>
                    <p className="font-mono text-neutral-200">{enq.phone}</p>
                    {enq.email && <p className="text-neutral-400 text-[11px] truncate">{enq.email}</p>}
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-neutral-500">Rental Duration</span>
                    <p className="font-medium text-neutral-200">
                      {enq.pickup_date || 'TBD'} → {enq.return_date || 'TBD'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-neutral-500">Chauffeur / Location</span>
                    <p className="font-medium text-amber-400 capitalize">
                      {enq.drive_option === 'with_driver' ? 'With Chauffeur' : 'Self-Drive'}
                    </p>
                    <p className="text-neutral-400 text-[11px]">{enq.pickup_location || 'Showroom Pickup'}</p>
                  </div>
                </div>

                {/* Customer Message */}
                {enq.message && (
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-300">
                    <span className="font-semibold text-neutral-400 text-[11px] block mb-1">Customer Note:</span>
                    <p className="italic">"{enq.message}"</p>
                  </div>
                )}

                {/* Staff Internal Notes */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    value={notesDrafts[enq.id] ?? ''}
                    onChange={(e) =>
                      setNotesDrafts({
                        ...notesDrafts,
                        [enq.id]: e.target.value,
                      })
                    }
                    placeholder="Add internal staff note (e.g. Deposit collected, customer requested airport delivery)..."
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleSaveNotes(enq.id)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
