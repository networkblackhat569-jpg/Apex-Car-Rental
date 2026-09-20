import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Copy,
  ExternalLink,
  Car,
  Image as ImageIcon,
  CheckCircle2,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { MediaAsset } from '../../types';
import { api } from '../../services/api';

interface AdminMediaManagerViewProps {
  onToast: (msg: string) => void;
}

export function AdminMediaManagerView({ onToast }: AdminMediaManagerViewProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await api.getMediaAssets();
      setAssets(data);
    } catch (err: any) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      onToast(`Uploaded ${res.filename}`);
      fetchAssets();
    } catch (err: any) {
      onToast(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!window.confirm(`Delete media asset "${filename}"?`)) return;
    try {
      await api.deleteMediaAsset(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      onToast('Asset deleted');
    } catch (err: any) {
      onToast('Failed to delete asset');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    onToast('Copied media URL to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Media & Asset Manager</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Browse stored vehicle images, upload new high-resolution fleet photography, and verify vehicle assignments.
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20 transition-all">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload New Asset'}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            Assets are permanently persisted to container disk under <code className="text-amber-300">/uploads/vehicles/</code> and database table <code className="text-amber-300">media_assets</code>.
          </span>
        </div>
        <span className="font-semibold text-neutral-400">{assets.length} Total Files</span>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading media assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
          <p className="text-sm font-semibold text-neutral-400">No media assets found</p>
          <p className="text-xs text-neutral-500 mt-1">Upload high-res fleet photos to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 overflow-hidden flex flex-col transition-all shadow-md"
            >
              <div className="h-44 bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as any).src = '/images/toyota-corolla.jpg';
                  }}
                />

                {/* Assigned Vehicle Pill */}
                {asset.assigned_vehicle_name && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] text-amber-400 font-semibold border border-amber-500/30 flex items-center space-x-1">
                    <Car className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{asset.assigned_vehicle_name}</span>
                  </div>
                )}
              </div>

              {/* Asset Info */}
              <div className="p-3 bg-neutral-900 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p className="text-xs font-semibold text-white truncate" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">{asset.url}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                  <button
                    onClick={() => handleCopyUrl(asset.url)}
                    className="text-[11px] font-medium text-neutral-400 hover:text-amber-400 flex items-center space-x-1"
                    title="Copy URL"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </button>

                  <button
                    onClick={() => handleDelete(asset.id, asset.filename)}
                    className="p-1 rounded text-neutral-500 hover:text-red-400"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
