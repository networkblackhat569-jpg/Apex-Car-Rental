import React, { useState, useEffect } from 'react';
import { Globe, Save, Share2, Search, Sparkles, ExternalLink } from 'lucide-react';
import { SeoSettings } from '../../types';
import { api } from '../../services/api';

interface AdminSeoViewProps {
  onToast: (msg: string) => void;
}

export function AdminSeoView({ onToast }: AdminSeoViewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');

  const fetchSeo = async () => {
    try {
      setLoading(true);
      const data = await api.getSeoSettings();
      setMetaTitle(data.meta_title || 'Apex Luxury Car Rental | Strict Model Matching Fleet');
      setMetaDescription(data.meta_description || 'Rent premium sedans, executive SUVs, and luxury cars with guaranteed exact-model match in Pakistan. No generic substitutions.');
      setMetaKeywords(data.meta_keywords || 'rent a car, luxury car rental, rent toyota corolla, rent kia sportage, chauffeur car rental');
      setOgTitle(data.og_title || 'Apex Luxury Car Rental — Exact Model Matched Fleet');
      setOgDescription(data.og_description || 'Guaranteed exact vehicle delivery. Browse verified fleet photos and instant WhatsApp booking.');
      setOgImage(data.og_image || '/images/toyota-corolla.jpg');
      setCanonicalUrl(data.canonical_url || 'https://apexrentacar.com');
    } catch (err) {
      console.error('Failed to load SEO settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.updateSeoSettings({
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        og_title: ogTitle,
        og_description: ogDescription,
        og_image: ogImage,
        canonical_url: canonicalUrl,
      });
      onToast('SEO & Social metadata updated!');
    } catch (err: any) {
      onToast(err.message || 'Failed to update SEO');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-neutral-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading SEO settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Search Engine & Social Media Metadata</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Configure search engine indexing tags, OpenGraph social sharing preview cards, and target rental keywords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Search Engine Optimization (SEO)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Meta Title *</label>
              <input
                type="text"
                required
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Apex Luxury Car Rental | Strict Model Matching Fleet"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Ideal length: 50-60 characters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Meta Description *</label>
              <textarea
                rows={3}
                required
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Rent premium sedans, executive SUVs, and luxury cars..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Ideal length: 150-160 characters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Target Keywords</label>
              <input
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="rent a car, car rental lahore, rent toyota corolla"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Canonical URL</label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://apexrentacar.com"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-neutral-800 pb-3">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>OpenGraph Social Share Card</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">OG Share Title</label>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="Apex Luxury Car Rental — Exact Model Matched Fleet"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">OG Share Description</label>
              <textarea
                rows={2}
                value={ogDescription}
                onChange={(e) => setOgDescription(e.target.value)}
                placeholder="Guaranteed exact vehicle delivery. Browse verified fleet..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">OG Share Banner Image URL</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="/images/toyota-corolla.jpg or https://..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            id="btn-save-seo-settings"
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save SEO & Metadata</span>
              </>
            )}
          </button>
        </form>

        {/* Live Previews Column */}
        <div className="space-y-6">
          {/* Google Search Card Preview */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-3">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-1">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Google SERP Preview</span>
            </span>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <p className="text-[11px] text-neutral-500 truncate font-mono">
                {canonicalUrl || 'https://apexrentacar.com'}
              </p>
              <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                {metaTitle || 'Apex Luxury Car Rental | Strict Model Matching Fleet'}
              </h4>
              <p className="text-xs text-neutral-400 line-clamp-2">
                {metaDescription ||
                  'Rent premium sedans, executive SUVs, and luxury cars with guaranteed exact-model match in Pakistan.'}
              </p>
            </div>
          </div>

          {/* Social Share Card Preview */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 space-y-3">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-1">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Social Share Card Preview (WhatsApp / Twitter / FB)</span>
            </span>

            <div className="rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-lg">
              <div className="h-44 bg-neutral-900 overflow-hidden">
                <img
                  src={ogImage || '/images/toyota-corolla.jpg'}
                  alt="OG Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = '/images/toyota-corolla.jpg';
                  }}
                />
              </div>
              <div className="p-4 space-y-1">
                <p className="text-[10px] uppercase text-neutral-500 font-mono">APEXRENTACAR.COM</p>
                <h4 className="text-xs font-bold text-white truncate">
                  {ogTitle || 'Apex Luxury Car Rental — Exact Model Matched Fleet'}
                </h4>
                <p className="text-[11px] text-neutral-400 line-clamp-2">
                  {ogDescription || 'Guaranteed exact vehicle delivery. Browse verified fleet photos.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
