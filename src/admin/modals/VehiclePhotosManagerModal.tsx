import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Star,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';
import { Vehicle, VehicleImage } from '../../types';
import { api } from '../../services/api';

interface VehiclePhotosManagerModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onPhotosUpdated: (updatedVehicle: Vehicle) => void;
  onToast: (msg: string) => void;
}

export function VehiclePhotosManagerModal({
  vehicle,
  onClose,
  onPhotosUpdated,
  onToast,
}: VehiclePhotosManagerModalProps) {
  const [images, setImages] = useState<VehicleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{
    isMatch: boolean;
    detectedModel: string;
    explanation: string;
    confidence: number;
  } | null>(null);

  // Manual URL input form
  const [imageUrl, setImageUrl] = useState('');
  const [imageType, setImageType] = useState<string>('gallery');
  const [imageLabel, setImageLabel] = useState('Front 3/4 Angle');

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await api.getVehicleImages(vehicle.id);
      setImages(data);
    } catch (err: any) {
      console.error('Failed to load vehicle images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [vehicle.id]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setVerifyFeedback(null);

    try {
      // 1. Upload file to server
      const uploadRes = await api.uploadFile(file, vehicle.id);

      // 2. Add as image to vehicle in database
      const isFirst = images.length === 0;
      const newImg = await api.addVehicleImage(vehicle.id, {
        url: uploadRes.url,
        image_type: isFirst ? 'primary' : imageType,
        label: imageLabel || file.name,
        is_primary: isFirst,
      });

      setImages((prev) => [...prev, newImg]);
      onToast(`Uploaded and attached photo to ${vehicle.name}`);

      // Refresh full vehicle to update primary image if needed
      const refreshed = await api.getVehicleById(vehicle.id);
      onPhotosUpdated(refreshed);
    } catch (err: any) {
      onToast(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Add by URL
  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    try {
      const isFirst = images.length === 0;
      const newImg = await api.addVehicleImage(vehicle.id, {
        url: imageUrl.trim(),
        image_type: isFirst ? 'primary' : imageType,
        label: imageLabel || 'Vehicle Photo',
        is_primary: isFirst,
      });

      setImages((prev) => [...prev, newImg]);
      setImageUrl('');
      onToast('Photo added to vehicle');

      const refreshed = await api.getVehicleById(vehicle.id);
      onPhotosUpdated(refreshed);
    } catch (err: any) {
      onToast(err.message || 'Failed to add photo');
    }
  };

  // Set Primary
  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.setPrimaryImage(vehicle.id, imageId);
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          image_type: img.id === imageId ? 'primary' : img.image_type === 'primary' ? 'gallery' : img.image_type,
        }))
      );
      onToast('Set as primary catalog photo');
      const refreshed = await api.getVehicleById(vehicle.id);
      onPhotosUpdated(refreshed);
    } catch (err: any) {
      onToast('Failed to set primary image');
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Delete this photo from this vehicle?')) return;
    try {
      await api.deleteVehicleImage(vehicle.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      onToast('Photo deleted');
      const refreshed = await api.getVehicleById(vehicle.id);
      onPhotosUpdated(refreshed);
    } catch (err: any) {
      onToast('Failed to delete photo');
    }
  };

  // Run AI Forensic Model Verifier on an image
  const handleVerifyImageForensics = async (imgUrl: string) => {
    setVerifying(true);
    setVerifyFeedback(null);

    try {
      // Fetch image and convert to base64 for Gemini inspection
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        try {
          const checkRes = await fetch('/api/analyze-vehicle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: blob.type || 'image/jpeg',
              claimedModel: vehicle.model || vehicle.name,
            }),
          });
          const inspection = await checkRes.json();
          setVerifyFeedback(inspection);
        } catch (e: any) {
          onToast('Verification service encountered an error');
        } finally {
          setVerifying(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setVerifying(false);
      onToast('Could not load image for forensic check');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-white text-base">{vehicle.name} Photos & Media</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-300 font-mono">
                  {vehicle.year}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Model: <span className="text-amber-400/90 font-medium">{vehicle.model}</span> • Strict Relational Integrity
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

        {/* AI Verifier Warning / Banner */}
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Strict Rule: Photos uploaded here must depict this exact model ({vehicle.model}).</span>
          </div>
          <span className="text-[10px] font-mono uppercase text-amber-400/70 hidden sm:inline">
            ID: {vehicle.id}
          </span>
        </div>

        {/* Forensic Inspection Result Callout */}
        {verifyFeedback && (
          <div
            className={`m-6 mb-0 p-4 rounded-xl border flex items-start space-x-3 text-xs ${
              verifyFeedback.isMatch
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-red-950/50 border-red-800/60 text-red-200'
            }`}
          >
            {verifyFeedback.isMatch ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold">
                  {verifyFeedback.isMatch ? 'Model Match Certified' : 'Warning: Mismatch Detected!'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                  Confidence: {verifyFeedback.confidence}%
                </span>
              </div>
              <p className="text-[11px] opacity-90">{verifyFeedback.explanation}</p>
              <p className="text-[11px] text-neutral-400">
                Detected: <span className="font-semibold text-white">{verifyFeedback.detectedModel}</span>
              </p>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Controls Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Box */}
            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col justify-center items-center text-center space-y-3">
              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Upload Vehicle Photo</p>
                <p className="text-[11px] text-neutral-400">JPG, PNG, WebP up to 20MB (saved to server disk)</p>
              </div>

              <div className="flex items-center space-x-2 w-full max-w-xs">
                <select
                  value={imageType}
                  onChange={(e) => setImageType(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-300 focus:outline-none flex-1"
                >
                  <option value="primary">Primary / Main</option>
                  <option value="gallery">Gallery Angle</option>
                  <option value="exterior_front">Exterior Front</option>
                  <option value="exterior_side">Exterior Side</option>
                  <option value="exterior_rear">Exterior Rear</option>
                  <option value="interior_dash">Interior Dashboard</option>
                  <option value="interior_cabin">Interior Cabin</option>
                </select>

                <label className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer transition-colors shrink-0">
                  {uploading ? 'Saving...' : 'Browse File'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* URL Entry Box */}
            <form
              onSubmit={handleAddByUrl}
              className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <p className="text-xs font-bold text-white mb-1">Add Image by URL</p>
                <p className="text-[11px] text-neutral-400 mb-2">Cloud URL, Supabase Storage, or Public path</p>
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/toyota-corolla.jpg or https://..."
                  className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={imageLabel}
                  onChange={(e) => setImageLabel(e.target.value)}
                  placeholder="Label (e.g. Front Grille)"
                  className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors shrink-0"
                >
                  Add URL
                </button>
              </div>
            </form>
          </div>

          {/* Photo Gallery Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Assigned Photos ({images.length})
              </h4>
              <span className="text-[11px] text-neutral-500">
                Click "Verify Model" to run Gemini AI forensic inspection
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-neutral-400">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading photos...</p>
              </div>
            ) : images.length === 0 ? (
              <div className="p-8 rounded-xl bg-neutral-950/40 border border-neutral-800 text-center text-neutral-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                <p className="text-xs font-medium">No dedicated photos attached yet</p>
                <p className="text-[11px] mt-1">Upload photos above to establish strict matching imagery.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((img) => {
                  const isPrimary = img.image_type === 'primary' || img.url === vehicle.primaryImage;

                  return (
                    <div
                      key={img.id}
                      className={`relative rounded-xl bg-neutral-950 border overflow-hidden flex flex-col group ${
                        isPrimary ? 'border-amber-500/60 shadow-lg shadow-amber-500/10' : 'border-neutral-800'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="h-40 bg-neutral-900 relative overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.label || vehicle.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          onError={(e) => {
                            (e.target as any).src = '/images/toyota-corolla.jpg';
                          }}
                        />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {isPrimary && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 font-bold text-[10px] tracking-wide shadow-md flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-neutral-950" />
                              <span>PRIMARY</span>
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-neutral-300 text-[10px] font-mono border border-neutral-700/60 capitalize">
                            {img.image_type?.replace('_', ' ') || 'Gallery'}
                          </span>
                        </div>

                        {/* Top Right Quick Delete */}
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-900/80 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-700/60 transition-colors"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Details & Actions Footer */}
                      <div className="p-3 bg-neutral-950 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-white truncate">{img.label || 'Vehicle Angle'}</p>
                          <p className="text-[10px] text-neutral-500 font-mono truncate">{img.url}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                          {!isPrimary ? (
                            <button
                              onClick={() => handleSetPrimary(img.id)}
                              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                            >
                              <Star className="w-3 h-3" />
                              <span>Set as Primary</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Main Card Image</span>
                            </span>
                          )}

                          <button
                            onClick={() => handleVerifyImageForensics(img.url)}
                            disabled={verifying}
                            className="text-[11px] font-medium text-neutral-400 hover:text-white flex items-center space-x-1 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800"
                            title="Forensic AI Model Verification"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Verify Model</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            All photo changes are directly persisted to the database.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
