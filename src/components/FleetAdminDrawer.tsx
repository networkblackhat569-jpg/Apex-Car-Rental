import React, { useState } from 'react';
import { Vehicle, VehiclePhotos } from '../types';
import { 
  X, 
  SlidersHorizontal, 
  Camera, 
  Save, 
  AlertTriangle, 
  Check, 
  RotateCcw,
  Sparkles,
  Plus
} from 'lucide-react';

interface FleetAdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onUpdateVehicle: (updated: Vehicle) => void;
  onResetToDefaults: () => void;
}

export const FleetAdminDrawer: React.FC<FleetAdminDrawerProps> = ({
  isOpen,
  onClose,
  vehicles,
  onUpdateVehicle,
  onResetToDefaults,
}) => {
  if (!isOpen) return null;

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const [editName, setEditName] = useState(currentVehicle.name);
  const [editPrice, setEditPrice] = useState(currentVehicle.pricePerDay);
  const [editWeeklyPrice, setEditWeeklyPrice] = useState(currentVehicle.weeklyPrice || '');
  const [editYear, setEditYear] = useState(currentVehicle.year);
  const [editAvailability, setEditAvailability] = useState(currentVehicle.availability);
  const [editImage, setEditImage] = useState(currentVehicle.image);
  
  // Client Photos State
  const [clientFront, setClientFront] = useState(currentVehicle.clientPhotos?.front || '');
  const [clientSide, setClientSide] = useState(currentVehicle.clientPhotos?.side || '');
  const [clientRear, setClientRear] = useState(currentVehicle.clientPhotos?.rear || '');
  const [clientInterior, setClientInterior] = useState(currentVehicle.clientPhotos?.interior || '');

  // Update form whenever selected car changes
  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      setEditName(v.name);
      setEditPrice(v.pricePerDay);
      setEditWeeklyPrice(v.weeklyPrice || '');
      setEditYear(v.year);
      setEditAvailability(v.availability);
      setEditImage(v.image);
      setClientFront(v.clientPhotos?.front || '');
      setClientSide(v.clientPhotos?.side || '');
      setClientRear(v.clientPhotos?.rear || '');
      setClientInterior(v.clientPhotos?.interior || '');
    }
  };

  const handleSave = () => {
    const updatedClientPhotos: VehiclePhotos = {};
    if (clientFront) updatedClientPhotos.front = clientFront;
    if (clientSide) updatedClientPhotos.side = clientSide;
    if (clientRear) updatedClientPhotos.rear = clientRear;
    if (clientInterior) updatedClientPhotos.interior = clientInterior;

    const updated: Vehicle = {
      ...currentVehicle,
      name: editName,
      pricePerDay: editPrice,
      weeklyPrice: editWeeklyPrice,
      year: editYear,
      availability: editAvailability,
      image: editImage,
      clientPhotos: Object.keys(updatedClientPhotos).length > 0 ? updatedClientPhotos : undefined,
    };

    onUpdateVehicle(updated);
  };

  // Test Fallback simulation: sets image to a nonexistent URL to test prompt fallback behavior
  const handleSimulateMissingImage = () => {
    setEditImage('/images/non-existent-photo.jpg');
    setClientFront('');
    setClientSide('');
    const updated: Vehicle = {
      ...currentVehicle,
      image: '/images/non-existent-photo.jpg',
      clientPhotos: undefined,
    };
    onUpdateVehicle(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div 
        id="fleet-admin-drawer-panel"
        className="w-full max-w-xl bg-neutral-950 border-l border-neutral-800 text-neutral-100 h-full flex flex-col shadow-2xl"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 p-5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Fleet & Client Photo Manager
              </h3>
              <p className="text-xs text-neutral-400">
                Single source of truth editor & real client photo priority
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Vehicle Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Select Fleet Vehicle to Edit
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVehicle(v.id)}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                    v.id === selectedVehicleId
                      ? 'border-amber-500 bg-amber-500/20 text-white font-semibold'
                      : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <p className="truncate font-medium">{v.name}</p>
                  <span className="text-[10px] text-neutral-500">{v.pricePerDay}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Core Vehicle Specifications */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Listing Details: {currentVehicle.name}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Vehicle Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Model Year</label>
                <input
                  type="text"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Daily Price (PKR)</label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Weekly Price (PKR)</label>
                <input
                  type="text"
                  value={editWeeklyPrice}
                  onChange={(e) => setEditWeeklyPrice(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] text-neutral-400 mb-1">Availability Status</label>
                <div className="flex space-x-2">
                  {(['Available', 'Reserved', 'In Maintenance'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditAvailability(status)}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all ${
                        editAvailability === status
                          ? status === 'Available'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-rose-600 text-white border-rose-500'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Primary Model Photo Path
                </label>
                <input
                  type="text"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Client Real Photos Priority Section */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Client Real Photos (Highest Priority)
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                Priority #1
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              When real client dealership photos are provided, they take supreme precedence over stock images on both the cards and detail gallery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Front Angle Photo
                </label>
                <input
                  type="text"
                  placeholder="URL or /images/..."
                  value={clientFront}
                  onChange={(e) => setClientFront(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Side Angle Photo
                </label>
                <input
                  type="text"
                  placeholder="URL or /images/..."
                  value={clientSide}
                  onChange={(e) => setClientSide(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Rear Angle Photo
                </label>
                <input
                  type="text"
                  placeholder="URL or /images/..."
                  value={clientRear}
                  onChange={(e) => setClientRear(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                  Interior Cabin Photo
                </label>
                <input
                  type="text"
                  placeholder="URL or /images/..."
                  value={clientInterior}
                  onChange={(e) => setClientInterior(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Test Strict Fallback Behavior */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Test Strict Image Fallback Rule
              </h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Demonstrates rule: "If the requested vehicle image does not exist, show 'Correct vehicle photo required'. Do NOT automatically replace it with another car."
            </p>
            <button
              id="btn-simulate-missing-image"
              type="button"
              onClick={handleSimulateMissingImage}
              className="mt-1 flex items-center space-x-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-300 transition-colors"
            >
              <span>Simulate Missing Image for {currentVehicle.name}</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-neutral-800 bg-neutral-900/90 p-4 flex items-center justify-between space-x-3">
          <button
            onClick={onResetToDefaults}
            className="flex items-center space-x-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset All</span>
          </button>

          <button
            id="btn-save-fleet-changes"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-neutral-950 transition-colors shadow-lg shadow-amber-950/20"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes to {currentVehicle.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
