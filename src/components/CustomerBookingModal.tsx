import React, { useState } from 'react';
import {
  X,
  Calendar,
  MessageSquare,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { Vehicle } from '../types';
import { api } from '../services/api';

interface CustomerBookingModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  whatsappNumber?: string;
}

export function CustomerBookingModal({
  vehicle,
  onClose,
  onSuccess,
  whatsappNumber = '923001234567',
}: CustomerBookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Showroom Pickup (Lahore)');
  const [driveOption, setDriveOption] = useState<'self_drive' | 'with_driver'>('self_drive');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cleanWaNumber = whatsappNumber.replace(/[^0-9]/g, '') || '923001234567';

  const handleBooking = async (e: React.FormEvent, viaWhatsApp = false) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) return;

    setLoading(true);

    try {
      // Save enquiry to database
      await api.submitEnquiry({
        customerName: customerName.trim(),
        phone: phone.trim(),
        whatsapp: phone.trim(),
        email: email.trim() || undefined,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.name} (${vehicle.year})`,
        pickupDate: pickupDate || undefined,
        returnDate: returnDate || undefined,
        pickupLocation,
        driveOption,
        message: message.trim() || undefined,
      });

      setSubmitted(true);
      onSuccess(`Booking enquiry for ${vehicle.name} received! Our concierge will connect shortly.`);

      if (viaWhatsApp) {
        const text = encodeURIComponent(
          `*NEW APEX RESERVATION REQUEST*\n\n` +
            `*Vehicle:* ${vehicle.name} (${vehicle.year})\n` +
            `*Model:* ${vehicle.model}\n` +
            `*Rate:* ${vehicle.pricePerDay} / day\n` +
            `*Customer Name:* ${customerName}\n` +
            `*Phone:* ${phone}\n` +
            (pickupDate ? `*Pickup Date:* ${pickupDate}\n` : '') +
            (returnDate ? `*Return Date:* ${returnDate}\n` : '') +
            `*Drive Option:* ${driveOption === 'with_driver' ? 'With Chauffeur' : 'Self-Drive'}\n` +
            `*Pickup Location:* ${pickupLocation}\n` +
            (message ? `*Notes:* ${message}\n` : '') +
            `\n_Booking generated via Apex Luxury Car Rental Platform with Exact-Model Verification._`
        );
        window.open(`https://wa.me/${cleanWaNumber}?text=${text}`, '_blank');
      }

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit booking:', err);
      // Even if API fails, allow opening WhatsApp
      if (viaWhatsApp) {
        const text = encodeURIComponent(`Hello Apex, I want to rent ${vehicle.name} (${vehicle.model}).`);
        window.open(`https://wa.me/${cleanWaNumber}?text=${text}`, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Reserve {vehicle.name}</h3>
              <p className="text-[11px] text-neutral-400">
                Guaranteed exact {vehicle.model} delivery • {vehicle.pricePerDay} / day
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vehicle Preview Summary Strip */}
        <div className="px-6 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center space-x-4">
          <img
            src={vehicle.primaryImage || vehicle.image}
            alt={vehicle.name}
            className="w-16 h-11 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
            onError={(e) => {
              (e.target as any).src = '/images/toyota-corolla.jpg';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-xs truncate">{vehicle.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                {vehicle.year}
              </span>
            </div>
            <p className="text-[11px] text-amber-400 font-mono font-semibold">{vehicle.pricePerDay} / day</p>
          </div>
          <div className="hidden sm:flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exact Match</span>
          </div>
        </div>

        {/* Booking Form / Success State */}
        {submitted ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Reservation Enquiry Received!</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Your inquiry has been stored in our executive dispatch system. Our rental concierge will contact you on WhatsApp to confirm pickup details.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => handleBooking(e, false)} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tariq Khan"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  WhatsApp / Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Drive Preference *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDriveOption('self_drive')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                      driveOption === 'self_drive'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Self-Drive
                  </button>
                  <button
                    type="button"
                    onClick={() => setDriveOption('with_driver')}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                      driveOption === 'with_driver'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    With Chauffeur
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Pickup Date & Time
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Return Date & Time
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Pickup City / Delivery Address
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Showroom pickup or Airport/Hotel delivery address"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Special Requests or Notes
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Airport flight number, baby seat request, specific color..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Action Buttons: 1 WhatsApp Direct, 1 Online Booking */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleBooking(e, true)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Instant WhatsApp Booking</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Submit Reservation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
