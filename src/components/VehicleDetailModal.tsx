import React, { useState } from 'react';
import { Vehicle } from '../types';
import { getWhatsAppBookingUrl } from '../data/vehicles';
import { 
  X, 
  Check, 
  MessageSquare, 
  Volume2, 
  Loader2, 
  ShieldCheck, 
  Camera, 
  Calendar, 
  Gauge, 
  Users, 
  Fuel, 
  Wind, 
  Sparkles, 
  FileText,
  AlertTriangle,
  BookmarkCheck,
  RotateCcw
} from 'lucide-react';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSaveToKeepNote?: (vehicle: Vehicle) => void;
  onBookNow?: (vehicle: Vehicle) => void;
}

type GalleryAngle = 'front' | 'side' | 'rear' | 'interior';

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onSaveToKeepNote,
  onBookNow,
}) => {
  if (!vehicle) return null;

  const [activeAngle, setActiveAngle] = useState<GalleryAngle>('front');
  const [useClientPhotos, setUseClientPhotos] = useState<boolean>(
    Boolean(vehicle.clientPhotos?.front || vehicle.clientPhotos?.side)
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [keepExportStatus, setKeepExportStatus] = useState<'idle' | 'copied' | 'saved'>('idle');

  // Determine current image source based on angle and client photo priority
  const currentPhotoSet = (useClientPhotos && vehicle.clientPhotos)
    ? vehicle.clientPhotos
    : (vehicle.gallery || { front: vehicle.image, side: vehicle.image, rear: vehicle.image, interior: vehicle.image });

  const currentDisplayImage = currentPhotoSet[activeAngle] || vehicle.image;

  const whatsAppUrl = getWhatsAppBookingUrl(vehicle.name);

  // Text-To-Speech Audio Walkaround with Gemini 3.1 Flash TTS
  const handlePlayTTS = async () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setAudioLoading(true);
      setAudioError(null);

      const narrationText = `Welcome to Apex Fleet. You are inspecting the ${vehicle.year} ${vehicle.name}, model ${vehicle.model}. 
      Equipped with an advanced ${vehicle.engineCapacity || 'engine'}, ${vehicle.transmission} transmission, and seating for ${vehicle.seats} passengers. 
      Rated for an exceptional fuel average of ${vehicle.fuelAverage || 'competitive mileage'}. 
      Features include dual climate air conditioning, Apple CarPlay, and multi-airbag safety. 
      Available at ${vehicle.pricePerDay} per day with model-matched delivery.`;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: narrationText, voice: 'Kore' }),
      });

      if (!response.ok) {
        throw new Error('Could not synthesize vehicle audio walkaround');
      }

      const data = await response.json();
      if (!data.audioBase64) {
        throw new Error('No audio data received');
      }

      // Gemini TTS returns raw PCM or base64 audio container
      const audioSrc = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
      
      audio.onended = () => {
        setIsPlayingAudio(false);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioError('Audio playback failed in this browser environment');
      };

      await audio.play();
      setAudioElement(audio);
      setIsPlayingAudio(true);
    } catch (err: any) {
      console.error('Audio walkaround error:', err);
      setAudioError(err.message || 'TTS generation unavailable');
    } finally {
      setAudioLoading(false);
    }
  };

  // Google Keep Note exporter handler
  const handleSaveToKeep = () => {
    const checklist = [
      `Vehicle: ${vehicle.name} (${vehicle.year})`,
      `Model: ${vehicle.model}`,
      `Daily Rate: ${vehicle.pricePerDay}`,
      `Weekly Rate: ${vehicle.weeklyPrice || 'On request'}`,
      `Inspection Checkmarks:`,
      `[ ] Front bumper & headlights verified`,
      `[ ] Tire tread & spare wheel checked`,
      `[ ] AC & Infotainment tested`,
      `[ ] Fuel level documented`,
      `[ ] Original CNIC/Passport & License presented`,
      `Rental Terms: ${vehicle.rentalTerms}`
    ].join('\n');

    navigator.clipboard.writeText(checklist);
    setKeepExportStatus('copied');
    setTimeout(() => setKeepExportStatus('idle'), 4000);

    if (onSaveToKeepNote) {
      onSaveToKeepNote(vehicle);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div 
        id="vehicle-detail-modal-container"
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl my-auto"
      >
        {/* Close Button */}
        <button
          id="btn-close-vehicle-detail"
          onClick={() => {
            if (audioElement) audioElement.pause();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[90vh] overflow-y-auto">
          {/* Left Column: Visual Gallery & Angles */}
          <div className="md:col-span-7 bg-neutral-900/40 p-4 sm:p-6 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800">
            {/* Primary Main Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
              {!imageFailed && currentDisplayImage ? (
                <img
                  src={currentDisplayImage}
                  alt={`${vehicle.name} ${activeAngle}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover transition-all duration-300"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/20">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
                  <p className="text-sm font-semibold text-amber-200">
                    Correct vehicle photo required
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Strict model matching: No generic photo permitted.
                  </p>
                </div>
              )}

              {/* Angle indicator watermark */}
              <div className="absolute top-3 left-3 rounded-md bg-neutral-900/90 border border-neutral-700 px-2.5 py-1 text-xs font-semibold uppercase text-amber-300 backdrop-blur-md">
                {activeAngle} View
              </div>

              {/* Photo Source Badge */}
              <div className="absolute bottom-3 left-3">
                {useClientPhotos && vehicle.clientPhotos?.front ? (
                  <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Camera className="h-3 w-3 mr-1" /> Real Fleet Photo Active
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 rounded-full bg-neutral-900/90 border border-amber-500/40 px-2.5 py-1 text-[11px] font-semibold text-amber-300 backdrop-blur-md">
                    <ShieldCheck className="h-3 w-3 mr-1 text-amber-400" /> Dedicated Model Photo
                  </span>
                )}
              </div>
            </div>

            {/* Gallery Angle Tabs */}
            <div className="mt-4 flex items-center justify-between gap-2">
              {(['front', 'side', 'rear', 'interior'] as GalleryAngle[]).map((angle) => (
                <button
                  key={angle}
                  onClick={() => {
                    setActiveAngle(angle);
                    setImageFailed(false);
                  }}
                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeAngle === angle
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>

            {/* Client Photo Priority Toggle */}
            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-neutral-200">
                    Client Fleet Photo Priority
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {vehicle.clientPhotos?.front 
                      ? 'Real dealership garage photos available' 
                      : 'Catalog studio reference photos'}
                  </p>
                </div>
              </div>
              <button
                id="toggle-client-photo-priority"
                onClick={() => setUseClientPhotos(!useClientPhotos)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  useClientPhotos 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {useClientPhotos ? 'Client Photos On' : 'Studio Photos'}
              </button>
            </div>

            {/* Audio Walkaround Narration (TTS Gemini 3.1 Flash) */}
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className={`h-4 w-4 ${isPlayingAudio ? 'text-amber-400 animate-pulse' : 'text-neutral-400'}`} />
                <div>
                  <p className="text-xs font-semibold text-amber-200">
                    Audio Fleet Walkaround
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    AI voice narration powered by Gemini 3.1 TTS
                  </p>
                </div>
              </div>
              <button
                id="btn-play-walkaround-audio"
                onClick={handlePlayTTS}
                disabled={audioLoading}
                className="flex items-center space-x-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all disabled:opacity-50"
              >
                {audioLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Listen Specs</span>
                  </>
                )}
              </button>
            </div>
            {audioError && (
              <p className="text-[11px] text-rose-400 mt-1 pl-1">{audioError}</p>
            )}
          </div>

          {/* Right Column: Specs, Terms & WhatsApp CTA */}
          <div className="md:col-span-5 p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div>
              {/* Vehicle Title & Model */}
              <div className="border-b border-neutral-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    {vehicle.category}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                    {vehicle.year}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-serif">
                  {vehicle.name}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                  {vehicle.model}
                </p>
                <p className="text-xs text-neutral-300 mt-3 leading-relaxed">
                  {vehicle.description}
                </p>
              </div>

              {/* Key Specs Matrix */}
              <div className="grid grid-cols-2 gap-3 py-4 border-b border-neutral-800 text-xs">
                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-amber-400" />
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Transmission</span>
                    <span className="font-semibold text-white">{vehicle.transmission}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-amber-400" />
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Capacity</span>
                    <span className="font-semibold text-white">{vehicle.seats} Passengers</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Fuel className="h-4 w-4 text-amber-400" />
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Fuel & Policy</span>
                    <span className="font-semibold text-white">{vehicle.fuelType || vehicle.fuel} • {vehicle.fuelPolicy || 'Fuel Included'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-cyan-400" />
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">Climate</span>
                    <span className="font-semibold text-white">Full AC Cooling</span>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="py-4 border-b border-neutral-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
                  Verified Features
                </h4>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-neutral-300">
                  {vehicle.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rental Terms */}
              <div className="pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-400" />
                  <span>Rental Terms & Conditions</span>
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-900/60 p-3 rounded-xl border border-neutral-800/80">
                  {vehicle.rentalTerms}
                </p>
              </div>
            </div>

            {/* Bottom Pricing & WhatsApp CTA */}
            <div className="space-y-3 pt-2">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    Daily Rental Rate
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    {vehicle.pricePerDay}
                  </span>
                </div>
                {vehicle.weeklyPrice && (
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                      Weekly Special
                    </span>
                    <span className="text-sm font-bold text-amber-400">
                      {vehicle.weeklyPrice}
                    </span>
                  </div>
                )}
              </div>

              {/* WhatsApp Booking CTA */}
              {onBookNow ? (
                <button
                  id="modal-btn-book-whatsapp"
                  onClick={() => onBookNow(vehicle)}
                  className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-98"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Book on WhatsApp ({vehicle.name})</span>
                </button>
              ) : (
                <a
                  id="modal-btn-book-whatsapp"
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-98"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Book on WhatsApp ({vehicle.name})</span>
                </a>
              )}

              {/* Google Keep Checklist Button */}
              <button
                id="btn-export-to-keep"
                onClick={handleSaveToKeep}
                className="flex w-full items-center justify-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 py-2.5 text-xs font-medium text-neutral-300 transition-colors"
              >
                <BookmarkCheck className="h-4 w-4 text-amber-400" />
                <span>
                  {keepExportStatus === 'copied' 
                    ? 'Rental Checklist Copied for Google Keep!' 
                    : 'Copy Rental Checklist for Google Keep'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
