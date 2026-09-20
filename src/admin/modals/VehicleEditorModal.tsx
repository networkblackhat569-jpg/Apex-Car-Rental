import React, { useState } from 'react';
import {
  X,
  Save,
  Car,
  Image as ImageIcon,
  DollarSign,
  FileText,
  CheckSquare,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { Vehicle } from '../../types';
import { api } from '../../services/api';

interface VehicleEditorModalProps {
  vehicle: Vehicle | null; // null means create new
  onClose: () => void;
  onSaved: (savedVehicle: Vehicle) => void;
  onToast: (msg: string) => void;
}

export function VehicleEditorModal({
  vehicle,
  onClose,
  onSaved,
  onToast,
}: VehicleEditorModalProps) {
  const isEditing = Boolean(vehicle);

  // Form states
  const [name, setName] = useState(vehicle?.name || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [brand, setBrand] = useState(vehicle?.name?.split(' ')[0] || 'Toyota');
  const [year, setYear] = useState(vehicle?.year || '2024');
  const [category, setCategory] = useState(vehicle?.category || 'Sedan');
  const [transmission, setTransmission] = useState(vehicle?.transmission || 'Automatic');
  const [fuelType, setFuelType] = useState<string>(
    vehicle?.fuelType || vehicle?.fuel || 'Petrol'
  );
  const [fuelPolicy, setFuelPolicy] = useState<string>(
    vehicle?.fuelPolicy || 'Fuel Included'
  );
  const [hasAc, setHasAc] = useState<boolean>(true);
  const [seats, setSeats] = useState<number>(vehicle?.seats || 5);
  const [engine, setEngine] = useState(vehicle?.engine || vehicle?.engineCapacity || '1600 cc');
  const [pricePerDay, setPricePerDay] = useState(vehicle?.pricePerDay || vehicle?.price_per_day || 'PKR 6,500');
  const [pricePerWeek, setPricePerWeek] = useState(vehicle?.weeklyPrice || vehicle?.price_per_week || 'PKR 42,000');
  const [pricePerMonth, setPricePerMonth] = useState(vehicle?.monthlyPrice || vehicle?.price_per_month || 'PKR 165,000');
  const [securityDeposit, setSecurityDeposit] = useState(vehicle?.securityDeposit || vehicle?.security_deposit || 'PKR 25,000');
  const [mileageLimit, setMileageLimit] = useState(vehicle?.mileageLimit || vehicle?.mileage_limit || '200 km/day');
  const [extraKmRate, setExtraKmRate] = useState(vehicle?.extraKmRate || vehicle?.extra_km_rate || 'PKR 30/km');
  const [color, setColor] = useState(vehicle?.color || 'Attitude Black / Super White');
  const [luggage, setLuggage] = useState(vehicle?.luggage || '3 Large Suitcases');
  const [primaryImage, setPrimaryImage] = useState(vehicle?.primaryImage || vehicle?.image || '/images/toyota-corolla.jpg');

  // Angle photos
  const findAngle = (type: string) => {
    return vehicle?.images?.find(i => i.image_type === type || i.label?.toLowerCase().includes(type))?.url || '';
  };
  const [frontImage, setFrontImage] = useState(findAngle('front'));
  const [sideImage, setSideImage] = useState(findAngle('side'));
  const [rearImage, setRearImage] = useState(findAngle('rear'));
  const [interiorImage, setInteriorImage] = useState(findAngle('interior'));

  const [status, setStatus] = useState<'available' | 'booked' | 'maintenance'>(
    (vehicle?.status as any) || 'available'
  );
  const [isActive, setIsActive] = useState<boolean>(vehicle ? (vehicle.isActive ?? true) : true);
  const [isFeatured, setIsFeatured] = useState<boolean>(vehicle ? (vehicle.isFeatured ?? false) : false);
  const [strictModelCode, setStrictModelCode] = useState(vehicle?.strictModelCode || '');
  const [description, setDescription] = useState(vehicle?.description || '');
  const [detailedDescription, setDetailedDescription] = useState(vehicle?.detailedDescription || vehicle?.detailed_description || '');
  const [rentalTerms, setRentalTerms] = useState(vehicle?.rentalTerms || vehicle?.rental_terms || 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required.');
  const [features, setFeatures] = useState<string[]>(
    vehicle?.features || [
      'Dual-Zone Auto Climate Control',
      'Infotainment with Apple CarPlay & Android Auto',
      'Rear Camera with Dynamic Guidelines',
      'Cruise Control & Push Start',
    ]
  );
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'photos' | 'pricing' | 'features' | 'descriptions'>('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick preset features
  const commonFeaturesPreset = [
    'Electric Sunroof',
    'Leather Seats',
    'Apple CarPlay & Android Auto',
    '360 Camera System',
    'Cruise Control',
    'Push Start & Smart Entry',
    'All-Wheel Drive (AWD)',
    'Lane Keep Assist',
    'Rear AC Vents',
    'Wireless Phone Charger',
  ];

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    if (!features.includes(newFeatureInput.trim())) {
      setFeatures([...features, newFeatureInput.trim()]);
    }
    setNewFeatureInput('');
  };

  const handleTogglePreset = (preset: string) => {
    if (features.includes(preset)) {
      setFeatures(features.filter((f) => f !== preset));
    } else {
      setFeatures([...features, preset]);
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFeatures(features.filter((f) => f !== feature));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const photoList: any[] = [];
      if (primaryImage) photoList.push({ url: primaryImage, image_type: 'exterior', label: 'Main Exterior Photo', is_primary: true });
      if (frontImage) photoList.push({ url: frontImage, image_type: 'front', label: 'Front Photo', is_primary: false });
      if (sideImage) photoList.push({ url: sideImage, image_type: 'side', label: 'Side Photo', is_primary: false });
      if (rearImage) photoList.push({ url: rearImage, image_type: 'rear', label: 'Rear Photo', is_primary: false });
      if (interiorImage) photoList.push({ url: interiorImage, image_type: 'interior', label: 'Interior Photo', is_primary: false });

      const updatedFeatures = [...features];
      if (hasAc && !updatedFeatures.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition') || f.toLowerCase().includes('climate control'))) {
        updatedFeatures.push('Air Conditioning (AC)');
      }

      const payload: any = {
        name,
        brand,
        model,
        year,
        category,
        transmission,
        fuel: fuelType,
        fuelType,
        fuel_type: fuelType,
        fuelPolicy,
        fuel_policy: fuelPolicy,
        seats: Number(seats),
        engine,
        pricePerDay,
        price_per_day: pricePerDay,
        pricePerWeek,
        price_per_week: pricePerWeek,
        pricePerMonth,
        price_per_month: pricePerMonth,
        securityDeposit,
        security_deposit: securityDeposit,
        mileageLimit,
        mileage_limit: mileageLimit,
        extraKmRate,
        extra_km_rate: extraKmRate,
        color,
        luggage,
        primaryImage,
        image: primaryImage,
        images: photoList,
        status,
        isActive,
        isFeatured,
        strictModelCode: strictModelCode || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        detailedDescription,
        detailed_description: detailedDescription,
        rentalTerms,
        rental_terms: rentalTerms,
        features: updatedFeatures,
      };

      let saved: Vehicle;
      if (isEditing && vehicle) {
        saved = await api.updateVehicle(vehicle.id, payload);
        onToast(`Vehicle "${saved.name}" updated successfully`);
      } else {
        saved = await api.createVehicle(payload);
        onToast(`Vehicle "${saved.name}" created successfully`);
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isEditing ? `Edit Vehicle: ${vehicle?.name}` : 'Add New Fleet Vehicle'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Configure full specifications, verified model code, rates, and features.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-6 bg-neutral-950/20 overflow-x-auto">
          {[
            { id: 'general', label: 'General Info', icon: Car },
            { id: 'specs', label: 'Specs & Fuel Policy', icon: Sparkles },
            { id: 'photos', label: 'Multi-Angle Photos', icon: ImageIcon },
            { id: 'pricing', label: 'Pricing & Deposit', icon: DollarSign },
            { id: 'features', label: 'Features & Amenities', icon: CheckSquare },
            { id: 'descriptions', label: 'Terms & Copy', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Vehicle Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!strictModelCode) {
                        setStrictModelCode(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    placeholder="e.g. Toyota Corolla"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Toyota, Honda, Kia"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Full Trim / Model Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Toyota Corolla Altis 1.6 CVT"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Model Year *</label>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="Compact Sedan">Compact Sedan</option>
                    <option value="SUV">SUV (4x4 / Crossover)</option>
                    <option value="Luxury Sedan">Luxury Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Strict Model Code</label>
                  <input
                    type="text"
                    value={strictModelCode}
                    onChange={(e) => setStrictModelCode(e.target.value)}
                    placeholder="toyota-corolla"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-xs font-medium text-neutral-300">Publish in Catalog</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <span className="text-xs font-medium text-neutral-300">Mark as Featured</span>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="available">Available for Rent</option>
                    <option value="booked">Currently Booked</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Specifications & Fuel */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              {/* FUEL MANAGEMENT & POLICY (User Requirements 7 & 8) */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Fuel Management & Rental Policy
                  </span>
                  <span className="text-[11px] text-neutral-400">Strictly Managed & Configurable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                      Fuel Type *
                    </label>
                    <select
                      id="vehicle-editor-fuel-type"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-[11px] text-neutral-500 mt-1">Engine powertrain fuel specification</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                      Fuel Policy *
                    </label>
                    <select
                      id="vehicle-editor-fuel-policy"
                      value={fuelPolicy}
                      onChange={(e) => setFuelPolicy(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="Fuel Included">Fuel Included</option>
                      <option value="Fuel Not Included">Fuel Not Included</option>
                      <option value="Customer Pays Fuel">Customer Pays Fuel</option>
                      <option value="Full Tank / Return Full">Full Tank / Return Full</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <p className="text-[11px] text-neutral-500 mt-1">Directly transparent to the customer</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Transmission *</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Automatic">Automatic (CVT / Tiptronic)</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Passenger Seats *</label>
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Air Conditioning (AC)</label>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-xs text-neutral-300">{hasAc ? 'AC Equipped' : 'No AC'}</span>
                    <input
                      type="checkbox"
                      checked={hasAc}
                      onChange={(e) => setHasAc(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Engine Specs / Displacement</label>
                  <input
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    placeholder="e.g. 1598 cc Dual VVT-i or 2.8L Sigma 4"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Color Options</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Super White, Attitude Black, Silver"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Daily Mileage Limit</label>
                  <input
                    type="text"
                    value={mileageLimit}
                    onChange={(e) => setMileageLimit(e.target.value)}
                    placeholder="200 km/day"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Extra Kilometre Rate</label>
                  <input
                    type="text"
                    value={extraKmRate}
                    onChange={(e) => setExtraKmRate(e.target.value)}
                    placeholder="PKR 30/km"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Multi-Angle Dedicated Photos (User Requirement 9) */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                Ensure strict visual model matching. Enter relative asset URLs (e.g. <span className="font-mono">/images/toyota-corolla.jpg</span>) or external image links.
              </div>

              {/* Main Photo */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-200">
                    Main Photo (Primary Catalog Card) *
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">Primary</span>
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src={primaryImage}
                    alt="Main"
                    className="w-20 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    onError={(e) => { (e.target as any).src = '/images/toyota-corolla.jpg'; }}
                  />
                  <input
                    type="text"
                    required
                    value={primaryImage}
                    onChange={(e) => setPrimaryImage(e.target.value)}
                    placeholder="/images/toyota-corolla.jpg"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Front Photo */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-neutral-200">Front Photo</label>
                <div className="flex items-center space-x-3">
                  <img
                    src={frontImage || primaryImage}
                    alt="Front"
                    className="w-20 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    onError={(e) => { (e.target as any).src = '/images/toyota-corolla.jpg'; }}
                  />
                  <input
                    type="text"
                    value={frontImage}
                    onChange={(e) => setFrontImage(e.target.value)}
                    placeholder="/images/toyota-corolla-front.jpg"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Side Photo */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-neutral-200">Side Photo</label>
                <div className="flex items-center space-x-3">
                  <img
                    src={sideImage || primaryImage}
                    alt="Side"
                    className="w-20 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    onError={(e) => { (e.target as any).src = '/images/toyota-corolla.jpg'; }}
                  />
                  <input
                    type="text"
                    value={sideImage}
                    onChange={(e) => setSideImage(e.target.value)}
                    placeholder="/images/toyota-corolla-side.jpg"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Rear Photo */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-neutral-200">Rear Photo</label>
                <div className="flex items-center space-x-3">
                  <img
                    src={rearImage || primaryImage}
                    alt="Rear"
                    className="w-20 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    onError={(e) => { (e.target as any).src = '/images/toyota-corolla.jpg'; }}
                  />
                  <input
                    type="text"
                    value={rearImage}
                    onChange={(e) => setRearImage(e.target.value)}
                    placeholder="/images/toyota-corolla-rear.jpg"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Interior Photo */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-neutral-200">Interior Photo</label>
                <div className="flex items-center space-x-3">
                  <img
                    src={interiorImage || primaryImage}
                    alt="Interior"
                    className="w-20 h-14 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                    onError={(e) => { (e.target as any).src = '/images/toyota-corolla.jpg'; }}
                  />
                  <input
                    type="text"
                    value={interiorImage}
                    onChange={(e) => setInteriorImage(e.target.value)}
                    placeholder="/images/toyota-corolla-interior.jpg"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pricing & Deposit */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Daily Rate (per 24 hrs) *
                  </label>
                  <input
                    type="text"
                    required
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    placeholder="PKR 6,500"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Weekly Rate</label>
                  <input
                    type="text"
                    value={pricePerWeek}
                    onChange={(e) => setPricePerWeek(e.target.value)}
                    placeholder="PKR 42,000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Monthly Rate</label>
                  <input
                    type="text"
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(e.target.value)}
                    placeholder="PKR 165,000"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Refundable Security Deposit *
                </label>
                <input
                  type="text"
                  required
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="PKR 25,000"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700/80 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-500">
                  Refunded upon vehicle return following digital vehicle inspection.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Features */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Quick Add Common Equipment:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {commonFeaturesPreset.map((preset) => {
                    const has = features.includes(preset);
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handleTogglePreset(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                          has
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {has ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Custom Feature / Spec:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="e.g. Ventilated Leather Seats"
                    className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Active list */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Assigned Vehicle Features ({features.length}):
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-200"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feat)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Descriptions & Terms */}
          {activeTab === 'descriptions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Short Description (Shown on Card) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comfortable sedan for executive transit and family travel."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Detailed Overview (Shown in Detail Modal)
                </label>
                <textarea
                  rows={4}
                  value={detailedDescription}
                  onChange={(e) => setDetailedDescription(e.target.value)}
                  placeholder="In-depth details regarding powertrain, comfort enhancements, highway stability, and chauffeur service options..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Specific Rental Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={rentalTerms}
                  onChange={(e) => setRentalTerms(e.target.value)}
                  placeholder="Valid CNIC & Driving License mandatory. Deposit PKR 25,000 required upon handover."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-save-vehicle-editor"
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Vehicle'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
