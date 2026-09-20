import React, { useState } from 'react';
import {
  LayoutDashboard,
  Car,
  Image as ImageIcon,
  MessageSquareQuote,
  Building2,
  Home,
  HelpCircle,
  Globe,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Shield,
} from 'lucide-react';
import { AdminUser, BusinessSettings } from '../types';

export type AdminTab =
  | 'dashboard'
  | 'vehicles'
  | 'media'
  | 'enquiries'
  | 'business'
  | 'homepage'
  | 'content'
  | 'seo'
  | 'profile';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  adminUser: AdminUser;
  businessSettings: BusinessSettings | null;
  onLogout: () => void;
  onOpenPublicSite: () => void;
  children: React.ReactNode;
}

export function AdminLayout({
  currentTab,
  onSelectTab,
  adminUser,
  businessSettings,
  onLogout,
  onOpenPublicSite,
  children,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'vehicles', label: 'Fleet & Vehicles', icon: Car, badge: null },
    { id: 'media', label: 'Photos & Media', icon: ImageIcon, badge: null },
    { id: 'enquiries', label: 'Bookings & Enquiries', icon: MessageSquareQuote, badge: null },
    { id: 'business', label: 'Business Settings', icon: Building2, badge: null },
    { id: 'homepage', label: 'Homepage Content', icon: Home, badge: null },
    { id: 'content', label: 'FAQs & Policies', icon: HelpCircle, badge: null },
    { id: 'seo', label: 'SEO & Social', icon: Globe, badge: null },
    { id: 'profile', label: 'Profile & Security', icon: Shield, badge: null },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <Car className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-white text-sm">Apex Admin</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenPublicSite}
            className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-800"
            title="Preview Live Site"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900/95 border-r border-neutral-800/80 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-neutral-800 border border-amber-500/30 flex items-center justify-center">
              <Car className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide leading-tight">
                {businessSettings?.business_name ? businessSettings.business_name.split(' ')[0] + ' Console' : 'Apex Admin'}
              </h2>
              <span className="text-[10px] uppercase font-semibold text-amber-400/80 tracking-wider">
                Fleet Management
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id as AdminTab);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group
                  ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-neutral-400 group-hover:text-neutral-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}
        </nav>

        {/* Live Preview Button */}
        <div className="px-4 py-2">
          <button
            id="btn-admin-preview-site"
            onClick={onOpenPublicSite}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 text-neutral-200 text-xs font-medium border border-neutral-700/60 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Public Live Preview</span>
          </button>
        </div>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSelectTab('profile')}
              className="flex items-center space-x-2.5 overflow-hidden text-left group hover:opacity-80 transition-opacity"
              title="View Security & Profile"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0 group-hover:border-amber-400 transition-colors">
                {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-amber-400 transition-colors">{adminUser.name || 'Admin User'}</p>
                <p className="text-[10px] text-neutral-500 truncate">{adminUser.email || 'admin@apexrentacar.com'}</p>
              </div>
            </button>
            <button
              id="btn-admin-logout"
              onClick={onLogout}
              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-neutral-900/60 border-b border-neutral-800/80 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight capitalize">
              {navigationItems.find((n) => n.id === currentTab)?.label || 'Admin Portal'}
            </h1>
            <p className="text-xs text-neutral-400">
              {businessSettings?.business_name || 'Apex Luxury Car Rental'} • Live Database Active
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-[11px] font-medium text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SQLite Persistent Cloud Database</span>
            </div>

            <button
              onClick={onOpenPublicSite}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 border border-neutral-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>View Customer Site</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
