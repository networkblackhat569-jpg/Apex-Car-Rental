import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, Clock, MapPin, Award, HelpCircle } from 'lucide-react';

export const RentalPolicySection: React.FC = () => {
  return (
    <section className="border-t border-neutral-800/80 bg-neutral-950 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: The Strict Matching Guarantee */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              <span>The Apex Fleet Pledge</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
              Why Strict Vehicle Image Matching Matters
            </h2>

            <p className="text-sm text-neutral-300 leading-relaxed">
              Traditional rental companies frequently display an image of an executive luxury sedan, only to deliver an older, different vehicle on the day of arrival.
            </p>

            <p className="text-sm text-neutral-400 leading-relaxed">
              At Apex, our single-source-of-truth database pairs every single vehicle card with its dedicated, verified photograph. If an exact image is unavailable, our system enforces a professional placeholder instead of ever substituting an incorrect car.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-neutral-300">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Toyota Corolla listing shows exclusively Toyota Corolla photos.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Honda Civic listing shows exclusively Honda Civic RS photos.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Kia Sportage listing shows exclusively Kia Sportage AWD crossover photos.</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Real client fleet photos always take top priority over studio references.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Standard Rental Terms & Documentation */}
          <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 sm:p-8 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-amber-400" />
              <span>Rental Documentation & Terms in Pakistan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center space-x-2 text-white font-semibold mb-1.5">
                  <Award className="h-4 w-4 text-amber-400" />
                  <span>Required Identification</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Original CNIC (for Pakistani citizens) or valid Passport with entry visa (for overseas travelers and tourists).
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center space-x-2 text-white font-semibold mb-1.5">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  <span>Driving Credentials</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Valid original Pakistani Driving License or International Driving Permit (IDP). Minimum driver age is 21.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center space-x-2 text-white font-semibold mb-1.5">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Mileage Allowance</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  200 kilometers per day allowance included in standard daily tariff. Additional mileage charged at flat transparent rates.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center space-x-2 text-white font-semibold mb-1.5">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span>Delivery & Return</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Free doorstep handover within city limits or airport pickup. Security deposit 100% refundable upon vehicle checkout.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-200">
                  Prefer a professional chauffeur?
                </p>
                <p className="text-[11px] text-neutral-300">
                  Uniformed, route-experienced executive drivers are available with any car for PKR 2,000/day.
                </p>
              </div>
              <a
                href="https://wa.me/923001234567?text=Hello%20Apex%20Fleet,%20I%20would%20like%20to%20inquire%20about%20a%20chauffeur-driven%20vehicle."
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-neutral-950 transition-colors"
              >
                Inquire Chauffeur
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
