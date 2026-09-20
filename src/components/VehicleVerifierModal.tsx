import React, { useState, useRef } from 'react';
import { Vehicle, VerificationResult } from '../types';
import { 
  X, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Camera, 
  FileCheck, 
  Info 
} from 'lucide-react';

interface VehicleVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
}

export const VehicleVerifierModal: React.FC<VehicleVerifierModalProps> = ({
  isOpen,
  onClose,
  vehicles,
}) => {
  if (!isOpen) return null;

  const [selectedModel, setSelectedModel] = useState<string>(vehicles[0]?.name || 'Toyota Corolla');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setPreviewUrl(b64);
      setBase64Image(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickLoadFleetPhoto = (v: Vehicle) => {
    setError(null);
    setResult(null);
    setSelectedModel(v.name);
    setPreviewUrl(v.image);
    // Convert relative image to base64
    fetch(v.image)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Image(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error('Failed to load fleet image for verification:', err);
      });
  };

  const handleRunVerification = async () => {
    if (!base64Image) {
      setError('Please upload or select a vehicle photo first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/analyze-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          claimedModel: selectedModel,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Verification analysis failed');
      }

      const data: VerificationResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setError(err.message || 'Error communicating with Gemini 3.1 Pro vision inspector');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div 
        id="vehicle-verifier-modal-container"
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 text-neutral-100 shadow-2xl my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
              Strict Model Image Inspector
            </h3>
            <p className="text-xs text-neutral-400">
              Powered by Gemini 3.1 Pro Preview. Enforces 100% photographic accuracy against claimed fleet models.
            </p>
          </div>
        </div>

        {/* Model Selection & Quick Select */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              1. Claimed Target Model
            </label>
            <select
              id="verifier-model-select"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setResult(null);
              }}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Quick Test With Fleet Photo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {vehicles.slice(0, 4).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleQuickLoadFleetPhoto(v)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs text-neutral-300 hover:border-amber-500/50 hover:text-white transition-all"
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
            2. Upload Vehicle Photo for Verification
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-neutral-900/60 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border border-neutral-800">
                <img
                  src={previewUrl}
                  alt="Vehicle to inspect"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-white bg-black/70 px-3 py-1.5 rounded-lg">
                    Change Image
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Camera className="h-10 w-10 text-neutral-500 mb-2" />
                <p className="text-sm font-medium text-neutral-200">
                  Click or drag car image here
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Supports JPG, PNG, WebP
                </p>
              </>
            )}
          </div>
        </div>

        {/* Run Button */}
        <button
          id="btn-run-model-verification"
          onClick={handleRunVerification}
          disabled={loading || !base64Image}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-neutral-950 transition-all disabled:opacity-50 shadow-lg shadow-amber-950/20"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing Vehicle Model with Gemini 3.1 Pro...</span>
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4" />
              <span>Inspect Photo Match Against "{selectedModel}"</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div
            id="verification-results-panel"
            className={`mt-6 rounded-2xl border p-5 ${
              result.isMatch
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-rose-500/40 bg-rose-950/20'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              {result.isMatch ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
              )}
              <div>
                <h4 className={`text-base font-bold ${result.isMatch ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {result.isMatch ? 'STRICT MATCH CONFIRMED' : 'MISMATCH DETECTED'}
                </h4>
                <p className="text-xs text-neutral-300">
                  Detected Model: <span className="font-semibold text-white">{result.detectedModel}</span> | Claimed: <span className="font-semibold text-white">{result.claimedModel}</span>
                </p>
              </div>
              <div className="ml-auto text-right">
                <span className="text-xs text-neutral-400 block">Confidence</span>
                <span className="text-sm font-bold text-white">{result.confidence}%</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5 mb-3">
              {result.explanation}
            </p>

            {result.visualCheckmarks && result.visualCheckmarks.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Visual Forensic Evidence:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-neutral-300">
                  {result.visualCheckmarks.map((check, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${result.isMatch ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
