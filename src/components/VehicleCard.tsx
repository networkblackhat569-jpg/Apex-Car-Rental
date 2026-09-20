import React, { useState } from 'react';
import { Vehicle } from '../types';
import { getWhatsAppBookingUrl } from '../data/vehicles';
import { 
  Users, 
  Fuel, 
  Gauge, 
  Wind, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  ArrowRight,
  Camera,
  ShieldCheck
} from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onViewDetails: (vehicle: Vehicle) => void;
  onBookNow?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onViewDetails,
  onBookNow,
}) => {
  const [imageError, setImageError] = useState(false);

  // Client photo priority: if business owner uploaded a real client photo, use it over default
  const hasClientPhoto = Boolean(
    vehicle.clientPhotos?.front ||
    vehicle.clientPhotos?.side ||
    vehicle.clientPhotos?.rear ||
    vehicle.clientPhotos?.interior
  );

  const activeImageUrl = hasClientPhoto
    ? (vehicle.clientPhotos?.front || vehicle.clientPhotos?.side || vehicle.image)
    : vehicle.image;

  const whatsAppUrl = getWhatsAppBookingUrl(vehicle.name);

  return (
    <div
      id={`vehicle-card-${vehicle.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 transition-all duration-300 hover:border-amber-500/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Visual Header / Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
        {!imageError && activeImageUrl ? (
          <img
            src={activeImageUrl}
            alt={vehicle.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* FALLBACK RULE: If exact image is unavailable or fails, show professional placeholder */
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-amber-200">
              Correct vehicle photo required
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-[240px]">
              Strict matching policy: No generic substitutions permitted for {vehicle.name}.
            </p>
            <span className="mt-2 text-[11px] text-neutral-500">
              Vehicle image coming soon
            </span>
          </div>
        )}

        {/* Gradient overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Strict matching badge */}
          {hasClientPhoto ? (
            <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              <Camera className="h-3 w-3 mr-1" />
              Client Fleet Photo
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 rounded-full bg-neutral-900/90 border border-amber-500/40 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-amber-300 shadow-sm">
              <ShieldCheck className="h-3 w-3 mr-1 text-amber-400" />
              Exact Model Photo
            </span>
          )}

          {/* Availability badge */}
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              vehicle.availability === 'Available'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {vehicle.availability}
          </span>
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-md bg-neutral-900/80 border border-neutral-700/80 px-2 py-0.5 text-[11px] font-medium text-neutral-300 backdrop-blur-md">
            {vehicle.category}
          </span>
        </div>
      </div>

      {/* Vehicle Info Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Name and Model */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
              {vehicle.name}
            </h3>
            <span className="text-xs font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
              {vehicle.year}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            {vehicle.model}
          </p>
        </div>

        {/* Specifications Grid required by prompt: Year, Transmission, 5 Seats, AC, Petrol */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-neutral-800/80 text-xs text-neutral-300">
          <div className="flex items-center space-x-2">
            <Gauge className="h-3.5 w-3.5 text-amber-400/80" />
            <span>{vehicle.transmission}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-3.5 w-3.5 text-amber-400/80" />
            <span>{vehicle.seats} Seats</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wind className="h-3.5 w-3.5 text-cyan-400" />
            <span>AC Dual Climate</span>
          </div>
          <div className="flex items-center space-x-2">
            <Fuel className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
            <span className="truncate">{vehicle.fuelType || vehicle.fuel}{vehicle.fuelPolicy ? ` • ${vehicle.fuelPolicy}` : ''}</span>
          </div>
        </div>

        {/* Price display */}
        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block">
              Daily Rate
            </span>
            <span className="text-xl font-extrabold text-white">
              {vehicle.pricePerDay}
            </span>
            <span className="text-xs text-neutral-400 font-normal"> / day</span>
          </div>

          {vehicle.weeklyPrice && (
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Weekly Rate
              </span>
              <span className="text-xs font-semibold text-neutral-300">
                {vehicle.weeklyPrice}
              </span>
            </div>
          )}
        </div>

        {/* Actions: View Details & Book on WhatsApp */}
        <div className="mt-5 grid grid-cols-2 gap-2 pt-2">
          {/* View Details */}
          <button
            id={`btn-view-details-${vehicle.id}`}
            onClick={() => onViewDetails(vehicle)}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3 py-2.5 text-xs font-semibold text-neutral-200 transition-all hover:border-neutral-500 hover:bg-neutral-700 hover:text-white"
          >
            <span>View Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Book on WhatsApp / Reserve (Saves enquiry to DB and opens WhatsApp) */}
          {onBookNow ? (
            <button
              id={`btn-book-whatsapp-${vehicle.id}`}
              onClick={() => onBookNow(vehicle)}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-95"
              title={`Book ${vehicle.name} with exact model match`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
          ) : (
            <a
              id={`btn-book-whatsapp-${vehicle.id}`}
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-95"
              title={`Book ${vehicle.name} directly via WhatsApp`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
