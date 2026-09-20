import React, { useState, useEffect } from 'react';
import {
  Car,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Star,
  Eye,
  Camera,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Vehicle } from '../../types';
import { api } from '../../services/api';

interface AdminVehiclesViewProps {
  onEditVehicle: (vehicle: Vehicle) => void;
  onManagePhotos: (vehicle: Vehicle) => void;
  onPreviewVehicle: (vehicle: Vehicle) => void;
  onAddNewVehicle: () => void;
  onToast: (message: string) => void;
}

export function AdminVehiclesView({
  onEditVehicle,
  onManagePhotos,
  onPreviewVehicle,
  onAddNewVehicle,
  onToast,
}: AdminVehiclesViewProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.getVehicles({ all: true });
      setVehicles(data);
    } catch (err: any) {
      console.error('Failed to load vehicles:', err);
      onToast('Error loading vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'active' && v.isActive) ||
      (statusFilter === 'inactive' && !v.isActive) ||
      (statusFilter === 'available' && v.status === 'available') ||
      (statusFilter === 'booked' && v.status === 'booked') ||
      (statusFilter === 'maintenance' && v.status === 'maintenance');

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.fuel.toLowerCase().includes(q);

    return matchesCat && matchesStatus && matchesSearch;
  });

  // Toggle active
  const handleToggleActive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleActive(id);
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: res.isActive } : v))
      );
      onToast(res.isActive ? 'Vehicle published to customer catalog' : 'Vehicle hidden from customer catalog');
    } catch (err: any) {
      onToast(err.message || 'Failed to toggle status');
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleFeatured(id);
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isFeatured: res.isFeatured } : v))
      );
      onToast(res.isFeatured ? 'Vehicle pinned as Featured' : 'Removed from Featured');
    } catch (err: any) {
      onToast(err.message || 'Failed to toggle featured');
    }
  };

  // Change availability status
  const handleChangeStatus = async (id: string, newStatus: 'available' | 'booked' | 'maintenance') => {
    try {
      await api.updateVehicleStatus(id, newStatus);
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                status: newStatus,
                availability: newStatus === 'available' ? 'Available' : newStatus === 'booked' ? 'Booked' : 'Maintenance',
              }
            : v
        )
      );
      onToast(`Vehicle marked as ${newStatus}`);
    } catch (err: any) {
      onToast(err.message || 'Failed to update availability status');
    }
  };

  // Duplicate vehicle
  const handleDuplicate = async (id: string) => {
    try {
      const newV = await api.duplicateVehicle(id);
      setVehicles((prev) => [newV, ...prev]);
      onToast(`Duplicated as "${newV.name}"`);
    } catch (err: any) {
      onToast(err.message || 'Failed to duplicate vehicle');
    }
  };

  // Delete vehicle
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" and all its photos?`)) {
      return;
    }
    try {
      await api.deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      onToast(`Vehicle "${name}" deleted`);
    } catch (err: any) {
      onToast(err.message || 'Failed to delete vehicle');
    }
  };

  // Reorder vehicles up/down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= vehicles.length) return;

    const reordered = [...vehicles];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orderList = reordered.map((v, i) => ({ id: v.id, displayOrder: i + 1 }));
    setVehicles(reordered.map((v, i) => ({ ...v, displayOrder: i + 1 })));

    try {
      await api.reorderVehicles(orderList);
      onToast('Fleet order updated');
    } catch (err: any) {
      onToast('Failed to save reorder');
      fetchVehicles();
    }
  };

  const categories = ['All', 'Sedan', 'Compact Sedan', 'SUV', 'Luxury Sedan'];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fleet Catalog Management</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage specifications, pricing, live catalog visibility, and dedicated client photography.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-admin-add-new-car"
            onClick={onAddNewVehicle}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, model, fuel..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="active">Published / Active</option>
            <option value="inactive">Hidden / Draft</option>
            <option value="available">Available Now</option>
            <option value="booked">Booked</option>
            <option value="maintenance">In Maintenance</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-neutral-400">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading vehicle database records...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <Car className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
            <p className="text-sm font-semibold text-neutral-400">No vehicles match your search</p>
            <p className="text-xs text-neutral-500 mt-1">Try adjusting search query or category filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-950/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4">Vehicle / Model</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-center">Public Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredVehicles.map((v, index) => {
                  const isFirst = index === 0;
                  const isLast = index === filteredVehicles.length - 1;

                  return (
                    <tr key={v.id} className="hover:bg-neutral-800/30 transition-colors group">
                      {/* Order Controls */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={isFirst}
                            className="p-1 rounded text-neutral-500 hover:text-amber-400 disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-neutral-500 text-[11px] w-4">{index + 1}</span>
                          <button
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={isLast}
                            className="p-1 rounded text-neutral-500 hover:text-amber-400 disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Vehicle Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative group shrink-0">
                            <img
                              src={v.primaryImage || v.image}
                              alt={v.name}
                              className="w-14 h-10 rounded-lg object-cover bg-neutral-800 border border-neutral-700/80 shadow-sm"
                            />
                            {v.images && v.images.length > 1 && (
                              <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full bg-neutral-900 border border-amber-500/40 text-amber-400 text-[9px] font-bold">
                                +{v.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">{v.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 font-mono">
                                {v.year}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate max-w-xs">{v.model}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-amber-500/80 mt-0.5 font-medium">
                              <span>Fuel: {v.fuel_type || v.fuelType || v.fuel || 'Petrol'}</span>
                              <span>•</span>
                              <span>Policy: {v.fuel_policy || v.fuelPolicy || 'Fuel Included'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-neutral-300 font-medium text-[11px]">
                          {v.category}
                        </span>
                      </td>

                      {/* Daily Rate */}
                      <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                        {v.pricePerDay || v.price_per_day}
                      </td>

                      {/* Availability Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={v.status || (v.availability === 'Available' ? 'available' : 'booked')}
                          onChange={(e) => handleChangeStatus(v.id, e.target.value as any)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border focus:outline-none cursor-pointer ${
                            (v.status || 'available') === 'available'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                              : (v.status || 'available') === 'booked'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          <option value="available" className="bg-neutral-900 text-emerald-400">
                            Available Now
                          </option>
                          <option value="booked" className="bg-neutral-900 text-amber-400">
                            Booked / On Rent
                          </option>
                          <option value="maintenance" className="bg-neutral-900 text-neutral-300">
                            In Maintenance
                          </option>
                        </select>
                      </td>

                      {/* Featured Star Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => handleToggleFeatured(v.id, e)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            v.isFeatured
                              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'text-neutral-600 hover:text-neutral-400'
                          }`}
                          title={v.isFeatured ? 'Featured on Top' : 'Mark as Featured'}
                        >
                          <Star className={`w-4 h-4 ${v.isFeatured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => handleToggleActive(v.id, e)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            v.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                          }`}
                        >
                          {v.isActive ? 'Live' : 'Hidden'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => onManagePhotos(v)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700"
                          title="Manage Vehicle Photos & Strict Matching"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => onPreviewVehicle(v)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700"
                          title="Preview Detail Modal"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditVehicle(v)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700"
                          title="Edit Specs & Pricing"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(v.id)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700"
                          title="Duplicate Vehicle"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.name)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-700 hover:border-red-800"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
