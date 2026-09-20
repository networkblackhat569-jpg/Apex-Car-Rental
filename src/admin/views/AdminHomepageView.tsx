import React, { useState, useEffect } from 'react';
import { Home, Save, Sparkles, ShieldCheck, Award, Users } from 'lucide-react';
import { HomepageSettings } from '../../types';
import { api } from '../../services/api';

interface AdminHomepageViewProps {
  onToast: (msg: string) => void;
}

export function AdminHomepageView({ onToast }: AdminHomepageViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [heroBadge, setHeroBadge] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [statVehicles, setStatVehicles] = useState('');
  const [statSatisfaction, setStatSatisfaction] = useState('');
  const [statMatching, setStatMatching] = useState('');
  const [statExperience, setStatExperience] = useState('');
  const [trustHeading, setTrustHeading] = useState('');
  const [trustDescription, setTrustDescription] = useState('');

  const fetchHomepage = async () => {
    try {
      setLoading(true);
      const data = await api.getHomepageSettings();
      setHeroBadge(data.hero_badge || 'Premium Rent-A-Car Fleet');
      setHeroTitle(data.hero_title || 'Strict Model Match. Transparent Luxury.');
      setHeroSubtitle(data.hero_subtitle || 'What you see is exactly what arrives at your door. Certified exact model match guarantee.');
      setStatVehicles(data.stat_vehicles || '50+ Verified Cars');
      setStatSatisfaction(data.stat_satisfaction || '99.4%');
      setStatMatching(data.stat_matching || '100% Exact Matching');
      setStatExperience(data.stat_experience || '12+ Years');
      setTrustHeading(data.trust_heading || 'The Apex Standard of Automotive Hospitality');
      setTrustDescription(data.trust_description || 'We eliminate bait-and-switch substitutions common in rental markets. Every vehicle record links to its exact physical unit.');
    } catch (err) {
      console.error('Failed to load homepage settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepage();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.updateHomepageSettings({
        hero_badge: heroBadge,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        stat_vehicles: statVehicles,
        stat_satisfaction: statSatisfaction,
        stat_matching: statMatching,
        stat_experience: statExperience,
        trust_heading: trustHeading,
        trust_description: trustDescription,
      });
      onToast('Homepage content updated!');
    } catch (err: any) {
      onToast(err.message || 'Failed to update homepage content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-neutral-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading homepage content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Homepage Content & Messaging</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Edit headline copy, brand promises, and key marketing proof points displayed to customers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero Section */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hero Headline & Lead Content</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Hero Pill Badge</label>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              placeholder="Premium Rent-A-Car Fleet"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-amber-400 font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Primary Hero Headline *</label>
            <input
              type="text"
              required
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Strict Model Match. Transparent Luxury."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Hero Subtitle Copy *</label>
            <textarea
              rows={3}
              required
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="What you see is exactly what arrives at your door..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Proof Points & Stats */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Key Statistics & Social Proof</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Stat 1: Fleet Scale</label>
              <input
                type="text"
                value={statVehicles}
                onChange={(e) => setStatVehicles(e.target.value)}
                placeholder="50+ Verified Cars"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Stat 2: Customer Satisfaction</label>
              <input
                type="text"
                value={statSatisfaction}
                onChange={(e) => setStatSatisfaction(e.target.value)}
                placeholder="99.4%"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Stat 3: Strict Matching Guarantee</label>
              <input
                type="text"
                value={statMatching}
                onChange={(e) => setStatMatching(e.target.value)}
                placeholder="100% Exact Matching"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Stat 4: Years of Hospitality</label>
              <input
                type="text"
                value={statExperience}
                onChange={(e) => setStatExperience(e.target.value)}
                placeholder="12+ Years"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Trust & Guarantee Copy */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Brand Guarantee Statement</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Section Title</label>
            <input
              type="text"
              value={trustHeading}
              onChange={(e) => setTrustHeading(e.target.value)}
              placeholder="The Apex Standard of Automotive Hospitality"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Detailed Copy</label>
            <textarea
              rows={3}
              value={trustDescription}
              onChange={(e) => setTrustDescription(e.target.value)}
              placeholder="We eliminate bait-and-switch substitutions common in rental markets..."
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            id="btn-save-homepage-content"
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Homepage Content</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
