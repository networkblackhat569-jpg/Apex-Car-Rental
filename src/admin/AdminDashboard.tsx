import React, { useState, useEffect } from 'react';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { AdminSetup } from './AdminSetup';
import { AdminChangePassword } from './AdminChangePassword';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminVehiclesView } from './views/AdminVehiclesView';
import { AdminMediaManagerView } from './views/AdminMediaManagerView';
import { AdminEnquiriesView } from './views/AdminEnquiriesView';
import { AdminBusinessSettingsView } from './views/AdminBusinessSettingsView';
import { AdminHomepageView } from './views/AdminHomepageView';
import { AdminContentView } from './views/AdminContentView';
import { AdminSeoView } from './views/AdminSeoView';
import { AdminProfileView } from './views/AdminProfileView';
import { VehicleEditorModal } from './modals/VehicleEditorModal';
import { VehiclePhotosManagerModal } from './modals/VehiclePhotosManagerModal';
import { VehicleDetailModal } from '../components/VehicleDetailModal';
import { AdminUser, BusinessSettings, Vehicle } from '../types';
import { api, clearAdminToken, getAdminToken } from '../services/api';
import { CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
  onExitAdmin: () => void;
  onRefreshPublicData?: () => void;
}

export function AdminDashboard({ onExitAdmin, onRefreshPublicData }: AdminDashboardProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);

  // Modals
  const [editorVehicle, setEditorVehicle] = useState<Vehicle | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [photosVehicle, setPhotosVehicle] = useState<Vehicle | null>(null);
  const [previewVehicle, setPreviewVehicle] = useState<Vehicle | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Verify auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const setupStatus = await api.getSetupStatus().catch(() => ({ hasAdmin: true }));
        if (!setupStatus.hasAdmin) {
          setNeedsSetup(true);
          setCheckingAuth(false);
          return;
        }

        const token = getAdminToken();
        if (!token) {
          setCheckingAuth(false);
          return;
        }

        const { user } = await api.getMe();
        setAdminUser(user);
        // Load business settings
        const bSettings = await api.getBusinessSettings().catch(() => null);
        if (bSettings) setBusinessSettings(bSettings);
      } catch (err) {
        clearAdminToken();
        setAdminUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = async (user: AdminUser) => {
    setAdminUser(user);
    try {
      const bSettings = await api.getBusinessSettings();
      setBusinessSettings(bSettings);
    } catch {}
    showToast(`Welcome back, ${user.name || user.username}`);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setAdminUser(null);
    showToast('Signed out of admin console');
  };

  // When changes happen in admin, tell public app to reload fresh data
  const triggerPublicSync = () => {
    if (onRefreshPublicData) onRefreshPublicData();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Authenticating Admin Session...</p>
        </div>
      </div>
    );
  }

  // First-time setup if no admin users exist
  if (needsSetup) {
    return (
      <AdminSetup
        onSetupSuccess={(user) => {
          setNeedsSetup(false);
          setAdminUser(user);
          showToast('Administrator account successfully created');
        }}
        onExitAdmin={onExitAdmin}
      />
    );
  }

  // Not logged in -> Show Login Page
  if (!adminUser) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onExitAdmin={onExitAdmin}
      />
    );
  }

  // If user is flagged to change password (Mandatory Change Password Requirement)
  if (adminUser.mustChangePassword) {
    return (
      <AdminChangePassword
        user={adminUser}
        onPasswordChanged={(updatedUser) => {
          setAdminUser(updatedUser);
          showToast('Password updated securely. Welcome to the dashboard!');
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-neutral-950">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl border border-amber-500/40 bg-neutral-900/95 px-4 py-2.5 text-xs font-semibold text-amber-200 shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Admin Console Layout */}
      <AdminLayout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        adminUser={adminUser}
        businessSettings={businessSettings}
        onLogout={handleLogout}
        onOpenPublicSite={onExitAdmin}
      >
        {currentTab === 'dashboard' && (
          <AdminDashboardView
            onNavigateTab={setCurrentTab}
            onOpenAddVehicle={() => {
              setEditorVehicle(null);
              setIsEditorOpen(true);
            }}
            onOpenPublicSite={onExitAdmin}
          />
        )}

        {currentTab === 'vehicles' && (
          <AdminVehiclesView
            onAddNewVehicle={() => {
              setEditorVehicle(null);
              setIsEditorOpen(true);
            }}
            onEditVehicle={(vehicle) => {
              setEditorVehicle(vehicle);
              setIsEditorOpen(true);
            }}
            onManagePhotos={(vehicle) => {
              setPhotosVehicle(vehicle);
            }}
            onPreviewVehicle={(vehicle) => {
              setPreviewVehicle(vehicle);
            }}
            onToast={showToast}
          />
        )}

        {currentTab === 'media' && (
          <AdminMediaManagerView onToast={showToast} />
        )}

        {currentTab === 'enquiries' && (
          <AdminEnquiriesView onToast={showToast} />
        )}

        {currentTab === 'business' && (
          <AdminBusinessSettingsView
            onSettingsUpdated={(updated) => {
              setBusinessSettings(updated);
              triggerPublicSync();
            }}
            onToast={showToast}
          />
        )}

        {currentTab === 'homepage' && (
          <AdminHomepageView
            onToast={(msg) => {
              showToast(msg);
              triggerPublicSync();
            }}
          />
        )}

        {currentTab === 'content' && (
          <AdminContentView
            onToast={(msg) => {
              showToast(msg);
              triggerPublicSync();
            }}
          />
        )}

        {currentTab === 'seo' && (
          <AdminSeoView
            onToast={(msg) => {
              showToast(msg);
              triggerPublicSync();
            }}
          />
        )}

        {currentTab === 'profile' && (
          <AdminProfileView
            user={adminUser}
            onUserUpdated={(updated: AdminUser) => {
              setAdminUser(updated);
              showToast('Profile updated successfully');
            }}
          />
        )}
      </AdminLayout>

      {/* Vehicle Editor Modal (Add/Edit) */}
      {isEditorOpen && (
        <VehicleEditorModal
          vehicle={editorVehicle}
          onClose={() => setIsEditorOpen(false)}
          onSaved={() => {
            triggerPublicSync();
          }}
          onToast={showToast}
        />
      )}

      {/* Vehicle Photos Manager Modal */}
      {photosVehicle && (
        <VehiclePhotosManagerModal
          vehicle={photosVehicle}
          onClose={() => setPhotosVehicle(null)}
          onPhotosUpdated={(updatedVehicle) => {
            setPhotosVehicle(updatedVehicle);
            triggerPublicSync();
          }}
          onToast={showToast}
        />
      )}

      {/* Preview Vehicle in Public Modal */}
      {previewVehicle && (
        <VehicleDetailModal
          vehicle={previewVehicle}
          onClose={() => setPreviewVehicle(null)}
        />
      )}
    </div>
  );
}
