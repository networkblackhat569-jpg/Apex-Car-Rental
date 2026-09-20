import React from 'react';
import { Vehicle } from '../types';
import { getWhatsAppBookingUrl } from '../data/vehicles';
import { MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';

interface StickyMobileBookingCTAProps {
  featuredVehicle: Vehicle;
  onViewDetails: (v: Vehicle) => void;
}

export const StickyMobileBookingCTA: React.FC<StickyMobileBookingCTAProps> = ({
  featuredVehicle,
  onViewDetails,
}) => {
  const whatsAppUrl = getWhatsAppBookingUrl(featuredVehicle.name);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl p-3 shadow-2xl">
      <div className="flex items-center justify-between space-x-3">
        {/* Vehicle snapshot */}
        <div 
          onClick={() => onViewDetails(featuredVehicle)}
          className="flex items-center space-x-2.5 overflow-hidden cursor-pointer"
        >
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
            <img
              src={featuredVehicle.image}
              alt={featuredVehicle.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate flex items-center space-x-1">
              <span>{featuredVehicle.name}</span>
              <ShieldCheck className="h-3 w-3 text-amber-400 flex-shrink-0 inline" />
            </p>
            <p className="text-[11px] font-semibold text-amber-400">
              {featuredVehicle.pricePerDay} <span className="text-[9px] text-neutral-400 font-normal">/ day</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <a
          id="sticky-mobile-whatsapp-btn"
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95 flex-shrink-0"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Book Now</span>
        </a>
      </div>
    </div>
  );
};
