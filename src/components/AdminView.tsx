import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  LogOut,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  KeyRound,
  Settings,
  ListFilter,
  Users,
  MousePointerClick,
  ExternalLink,
  Phone,
  Church,
  Compass,
  Shirt,
  Calendar,
  AlertCircle,
  Save,
  X,
  FileText,
  FileSpreadsheet,
  Printer,
  Lock,
  RefreshCw,
  Share2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Database,
  UploadCloud,
} from 'lucide-react';
import { AdminUser, RegistrationRecord, PaymentSettings, RegistrationStatus, AdminQuotaInfo } from '../types.js';

export const PERMANENT_OFFICIAL_WAVE_LINK = 'https://pay.wave.com/m/M_ci_ZfLyfzYgXEbI/c/ci/?amount=5050';
import {
  exportRegistrationsToExcel,
  exportRegistrationsToPDF,
  exportSingleParticipantPDF,
} from '../utils/exportUtils.js';
import { ShareModal } from './ShareModal.js';

interface AdminViewProps {
  token: string;
  currentUser: AdminUser;
  onLogout: () => void;
  onClose: () => void;
  onSettingsUpdated?: (settings: PaymentSettings) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  token,
  currentUser,
  onLogout,
  onClose,
  onSettingsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'inscrits' | 'relances' | 'settings' | 'admins'>('inscrits');
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    paymentClickedPending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clubFilter, setClubFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  // Export Modal & processing state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [exporting, setExporting] = useState<string | null>(null);

  // Proof viewer modal
  const [viewingProof, setViewingProof] = useState<{ filename: string; originalName: string } | null>(null);

  // Status edit modal
  const [editingRegistration, setEditingRegistration] = useState<RegistrationRecord | null>(null);
  const [newStatus, setNewStatus] = useState<'pending_verification' | 'confirmed' | 'rejected'>('pending_verification');
  const [adminNotes, setAdminNotes] = useState('');

  // Single registration deletion state
  const [deletingRegistration, setDeletingRegistration] = useState<RegistrationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset all registrations & counters state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Feedback notifications
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Payment Settings
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Admin management & Quota enforcement
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [adminQuota, setAdminQuota] = useState<AdminQuotaInfo | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminTempPassword, setNewAdminTempPassword] = useState('');
  const [adminCreatedMsg, setAdminCreatedMsg] = useState<string | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);

  // Change password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Share simplified link modal
  const [showShareModal, setShowShareModal] = useState(false);

  // Backup & Restore states
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupRestoreMsg, setBackupRestoreMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Handle download permanent JSON backup
  const handleDownloadPermanentBackup = async () => {
    setIsDownloadingBackup(true);
    setBackupRestoreMsg(null);
    try {
      const res = await fetch('/api/admin/backup-download', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Échec du téléchargement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sauvegarde-permanente-randonnee-banco-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setBackupRestoreMsg({ text: 'Sauvegarde permanente téléchargée avec succès.', isError: false });
    } catch (err: any) {
      setBackupRestoreMsg({ text: 'Erreur téléchargement : ' + err.message, isError: true });
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // Handle restore from JSON backup file (Superadmin)
  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Attention : restaurer une sauvegarde écrasera les données actuelles avec cette archive. Souhaitez-vous continuer ?')) {
      e.target.value = '';
      return;
    }
    setIsRestoringBackup(true);
    setBackupRestoreMsg(null);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const res = await fetch('/api/admin/backup-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ backupData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de restauration');
      setBackupRestoreMsg({ text: 'Restauration réussie ! Les données ont été rétablies.', isError: false });
      fetchRegistrations();
      fetchSettings();
      fetchAdmins();
    } catch (err: any) {
      setBackupRestoreMsg({ text: 'Erreur lors de la restauration : ' + err.message, isError: true });
    } finally {
      setIsRestoringBackup(false);
      e.target.value = '';
    }
  };

  // Load Registrations
  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (clubFilter !== 'all') params.set('club', clubFilter);
      if (districtFilter !== 'all') params.set('district', districtFilter);
      if (activeTab === 'relances') params.set('paymentClickedOnly', 'true');

      const res = await fetch(`/api/admin/registrations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setRegistrations(data.registrations || []);
      setStats(data.stats || { total: 0, confirmed: 0, pending: 0, paymentClickedPending: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, statusFilter, clubFilter, districtFilter, activeTab, onLogout]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetch Admins & Quota
  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminList(data.admins || []);
        if (data.quota) {
          setAdminQuota(data.quota);
        } else {
          setAdminQuota({
            currentCount: (data.admins || []).length,
            maxCount: 2,
            canCreateAdmin: (data.admins || []).length < 2,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'admins') fetchAdmins();
  }, [activeTab, fetchSettings, fetchAdmins]);

  // Save Settings permanently
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
        if (onSettingsUpdated) {
          onSettingsUpdated(data.settings);
        }
        setSettingsSaved(true);
        setActionSuccessMsg('Paramètres Wave enregistrés définitivement sur le serveur.');
        setTimeout(() => {
          setSettingsSaved(false);
          setActionSuccessMsg(null);
        }, 4000);
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err: any) {
      alert('Erreur lors de la sauvegarde : ' + (err?.message || 'Erreur réseau'));
    }
  };

  // Delete single registration
  const handleDeleteRegistration = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');
      setDeletingRegistration(null);
      if (editingRegistration?.id === id) {
        setEditingRegistration(null);
      }
      setActionSuccessMsg('Inscription supprimée avec succès.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchRegistrations();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all registrations and counters to zero
  const handleResetAll = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/registrations/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la réinitialisation');
      setShowResetModal(false);
      setResetConfirmCode('');
      setActionSuccessMsg(`Compteurs réinitialisés à zéro avec succès (${data.deletedCount} inscription(s) effacée(s)).`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchRegistrations();
    } catch (err: any) {
      alert('Erreur : ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Update Status of registration
  const handleSaveStatus = async () => {
    if (!editingRegistration) return;
    try {
      const res = await fetch(`/api/admin/registrations/${editingRegistration.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      if (res.ok) {
        setEditingRegistration(null);
        fetchRegistrations();
      }
    } catch (err) {
      alert('Erreur lors de la modification');
    }
  };

  // Create new Admin (Limit strictly enforced at max 2)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreatedMsg(null);
    if (adminList.length >= 2) {
      alert("Le quota maximum de 2 administrateurs est déjà atteint. Aucune nouvelle inscription n'est possible.");
      return;
    }
    try {
      const res = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newAdminEmail, tempPassword: newAdminTempPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
      setAdminCreatedMsg(`2ème compte administrateur créé avec succès pour ${newAdminEmail}. Le quota est désormais plein (2/2) et les inscriptions sont closes.`);
      setNewAdminEmail('');
      setNewAdminTempPassword('');
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Admin (Superadmin only, cannot delete superadmin)
  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du compte administrateur ${email} ?\n\nCette action libèrera la 2ème place pour permettre une nouvelle inscription si souhaité.`)) {
      return;
    }
    setDeletingAdminId(adminId);
    try {
      const res = await fetch(`/api/admin/${adminId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');
      setActionSuccessMsg(`Compte administrateur ${email} révoqué. La 2ème place est à nouveau disponible.`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingAdminId(null);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setPwdMsg({ text: 'Mot de passe modifié avec succès !', isError: false });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPwdMsg({ text: err.message, isError: true });
    }
  };

  // Export CSV (Legacy endpoint)
  const handleExportCSV = () => {
    window.location.href = `/api/admin/export-csv?token=${token}`;
  };

  // Export Excel (.xlsx) with formatting & auto column widths
  const handleExportExcel = async (scope: 'filtered' | 'all' = exportScope) => {
    try {
      setExporting('excel');
      let dataToExport = registrations;

      if (scope === 'all') {
        const res = await fetch('/api/admin/registrations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          dataToExport = data.registrations || [];
        }
      }

      const filterInfo = {
        statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        clubFilter: clubFilter !== 'all' ? clubFilter : undefined,
        districtFilter: districtFilter !== 'all' ? districtFilter : undefined,
        searchQuery: searchQuery || undefined,
        totalCount: stats.total,
        filteredCount: dataToExport.length,
      };

      exportRegistrationsToExcel(dataToExport, filterInfo);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erreur export Excel:', err);
      alert("Une erreur est survenue lors de la création du fichier Excel.");
    } finally {
      setExporting(null);
    }
  };

  // Export Official Landscape PDF Registry with signatures & color-coded badges
  const handleExportPDF = async (scope: 'filtered' | 'all' = exportScope) => {
    try {
      setExporting('pdf');
      let dataToExport = registrations;

      if (scope === 'all') {
        const res = await fetch('/api/admin/registrations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          dataToExport = data.registrations || [];
        }
      }

      const filterInfo = {
        statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        clubFilter: clubFilter !== 'all' ? clubFilter : undefined,
        districtFilter: districtFilter !== 'all' ? districtFilter : undefined,
        searchQuery: searchQuery || undefined,
        totalCount: stats.total,
        filteredCount: dataToExport.length,
      };

      exportRegistrationsToPDF(dataToExport, filterInfo, currentUser.email);
      setShowExportModal(false);
    } catch (err) {
      console.error('Erreur export PDF:', err);
      alert("Une erreur est survenue lors de la génération du registre PDF.");
    } finally {
      setExporting(null);
    }
  };

  // Export Single Participant PDF Receipt & proof sheet
  const handleDownloadParticipantReceipt = (reg: RegistrationRecord) => {
    exportSingleParticipantPDF(reg, settings);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#383827]/60 backdrop-blur-xs flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col bg-[#f5f2ed] overflow-hidden">
        {/* Admin Navigation Bar */}
        <header className="bg-[#383827] text-white px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-[#5A5A40]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5A5A40]/50 border border-[#D2691E]/40 text-[#D2691E] flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-serif italic font-bold leading-tight flex items-center gap-2">
                <span>Espace Administration</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#D2691E]/20 text-[#D2691E] border border-[#D2691E]/30">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-stone-300 font-mono">{currentUser.email}</div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#D2691E] hover:bg-[#b85816] text-white shadow-xs transition-all cursor-pointer"
              title="Obtenir le lien simplifié et le QR code du formulaire pour diffusion"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Lien simplifié</span>
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-stone-200 border border-white/20 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-stone-300" />
              <span>Mot de passe</span>
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition-colors cursor-pointer"
              title="Déconnexion sécurisée"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Fermer le tableau de bord"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Global Statistics Bar */}
        <div className="bg-white/90 backdrop-blur-xs border-b border-[#5A5A40]/15 px-4 sm:px-8 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-7xl mx-auto">
            <div className="p-3 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/15">
              <div className="text-[10px] font-bold text-[#7a7a72] uppercase tracking-wider">Total Inscrits</div>
              <div className="text-xl sm:text-2xl font-serif italic font-bold text-[#5A5A40] mt-0.5">{stats.total}</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/15">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Confirmés (Validés)</div>
              <div className="text-xl sm:text-2xl font-serif italic font-bold text-emerald-700 mt-0.5">{stats.confirmed}</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/15">
              <div className="text-[10px] font-bold text-[#D2691E] uppercase tracking-wider">En attente vérif.</div>
              <div className="text-xl sm:text-2xl font-serif italic font-bold text-[#D2691E] mt-0.5">{stats.pending}</div>
            </div>

            <div className="p-3 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/15">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Clics sans preuve</div>
              <div className="text-xl sm:text-2xl font-serif italic font-bold text-amber-700 mt-0.5">{stats.paymentClickedPending}</div>
            </div>
          </div>
        </div>

        {/* Main Content Area with Tabs */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 sm:px-8 py-4 max-w-7xl mx-auto w-full">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-[#5A5A40]/15 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('inscrits')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'inscrits'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'bg-white text-[#5A5A40] hover:bg-[#f5f2ed] border border-[#5A5A40]/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Inscrits complets ({stats.total})</span>
              </button>

              <button
                onClick={() => setActiveTab('relances')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'relances'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'bg-white text-[#5A5A40] hover:bg-[#f5f2ed] border border-[#5A5A40]/20'
                }`}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>2. Suivi clics paiement ({stats.paymentClickedPending})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'bg-white text-[#5A5A40] hover:bg-[#f5f2ed] border border-[#5A5A40]/20'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Config Paiement Wave</span>
              </button>

              <button
                onClick={() => setActiveTab('admins')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'bg-white text-[#5A5A40] hover:bg-[#f5f2ed] border border-[#5A5A40]/20'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Comptes Admins</span>
              </button>
            </div>

            {/* Export & Refresh Toolbar */}
            {(activeTab === 'inscrits' || activeTab === 'relances') && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fetchRegistrations()}
                  className="p-2 rounded-full text-[#5A5A40] hover:text-[#2d2d2a] hover:bg-white bg-white/70 border border-[#5A5A40]/20 transition-colors cursor-pointer shadow-2xs"
                  title="Actualiser les données"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                {/* Direct Excel (.xlsx) Export */}
                <button
                  onClick={() => handleExportExcel('filtered')}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Télécharger le tableau Excel (.xlsx) complet avec synthèse"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{exporting === 'excel' ? 'Export en cours...' : 'Excel (.xlsx)'}</span>
                </button>

                {/* Direct PDF Landscape Export */}
                <button
                  onClick={() => handleExportPDF('filtered')}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#5A5A40] hover:bg-[#484833] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Générer le registre PDF officiel prêt pour émargement et contrôle"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D2691E]" />
                  <span>{exporting === 'pdf' ? 'Génération...' : 'PDF Officiel'}</span>
                </button>

                {/* Permanent Backup Download Button */}
                <button
                  onClick={handleDownloadPermanentBackup}
                  disabled={isDownloadingBackup}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-800 hover:bg-amber-900 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Sauvegarde permanente et indestructible de la base de données (JSON)"
                >
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isDownloadingBackup ? 'Sauvegarde...' : 'Sauvegarde JSON'}</span>
                </button>

                {/* Export Options modal button */}
                <button
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold text-[#5A5A40] bg-white hover:bg-[#f5f2ed] border border-[#5A5A40]/25 transition-all cursor-pointer shadow-2xs"
                  title="Options d'exportation (sélection filtrée vs registre complet, reçus individuels)"
                >
                  <Download className="w-3.5 h-3.5 text-[#D2691E]" />
                  <span>Options d'export...</span>
                </button>

                {/* Reset Counters to Zero Button */}
                <button
                  onClick={() => setShowResetModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                  title="Remise à zéro de tous les compteurs et inscriptions"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Réinitialiser à zéro</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Success Toast / Banner */}
          {actionSuccessMsg && (
            <div className="mb-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: Inscrits Complets & TAB 2: Clics Paiement */}
          {(activeTab === 'inscrits' || activeTab === 'relances') && (
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              {/* Filter controls */}
              <div className="p-3 sm:p-4 border-b border-stone-200 bg-stone-50/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Recherche nom, tél, église..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="confirmed">✅ Confirmé</option>
                    <option value="pending_verification">🟠 En attente</option>
                    <option value="payment_clicked">⚪ Clic paiement seul</option>
                    <option value="rejected">❌ Rejeté</option>
                  </select>
                </div>

                <div>
                  <select
                    value={clubFilter}
                    onChange={(e) => setClubFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none"
                  >
                    <option value="all">Tous les clubs</option>
                    <option value="Aventurier">Aventurier</option>
                    <option value="Éclaireur">Éclaireur</option>
                    <option value="Ambassadeur">Ambassadeur</option>
                    <option value="Aîné">Aîné</option>
                    <option value="Chef Guide">Chef Guide</option>
                    <option value="Leader de Jeunesse">Leader de Jeunesse</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <select
                    value={districtFilter}
                    onChange={(e) => setDistrictFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 focus:outline-none"
                  >
                    <option value="all">Tous les districts</option>
                    <option value="District Abidjan Nord">District Abidjan Nord</option>
                    <option value="District Abidjan Sud">District Abidjan Sud</option>
                    <option value="District Abidjan Est">District Abidjan Est</option>
                    <option value="District Abidjan Ouest">District Abidjan Ouest</option>
                    <option value="District Yopougon">District Yopougon</option>
                    <option value="District Cocody">District Cocody</option>
                    <option value="District Grand-Bassam">District Grand-Bassam</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-stone-100/80 sticky top-0 z-10 border-b border-stone-200 text-[11px] font-bold uppercase text-stone-500">
                    <tr>
                      <th className="py-2.5 px-3">Réf / Date</th>
                      <th className="py-2.5 px-3">Participant</th>
                      <th className="py-2.5 px-3">Église & Contact</th>
                      <th className="py-2.5 px-3">District & Club</th>
                      <th className="py-2.5 px-3">Taille & Santé</th>
                      <th className="py-2.5 px-3">Preuve de paiement</th>
                      <th className="py-2.5 px-3">Statut & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          {loading ? 'Chargement des inscriptions...' : 'Aucune inscription ne correspond aux critères.'}
                        </td>
                      </tr>
                    ) : (
                      registrations.map((item) => {
                        const isPaymentOnly = item.paymentClicked && item.status !== 'confirmed' && item.status !== 'pending_verification';

                        return (
                          <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                            {/* Ref & Date */}
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-amber-800">{item.id}</span>
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* Participant */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-stone-900">{item.fullName}</div>
                            </td>

                            {/* Church & Contact */}
                            <td className="py-3 px-3">
                              <div className="text-stone-800 font-medium">{item.church}</div>
                              <a
                                href={`tel:${item.contact}`}
                                className="inline-flex items-center gap-1 font-mono text-emerald-800 hover:underline mt-0.5"
                              >
                                <Phone className="w-3 h-3 text-emerald-600" />
                                <span>{item.contact}</span>
                              </a>
                            </td>

                            {/* District & Club */}
                            <td className="py-3 px-3">
                              <div className="font-medium text-stone-800">
                                {item.district === 'Autre' ? item.districtOther : item.district}
                              </div>
                              <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                                {item.club === 'Autre' ? item.clubOther : item.club}
                              </div>
                            </td>

                            {/* Size & Illness */}
                            <td className="py-3 px-3">
                              <div className="text-stone-700">
                                T-Shirt: <strong>{item.tshirtSize === 'Autre' ? item.tshirtSizeOther : (item.tshirtSize || '-')}</strong>
                              </div>
                              <div className="text-[11px] mt-0.5">
                                {item.hasIllness === 'Oui' ? (
                                  <span className="text-red-700 font-medium" title={item.illnessDetails}>
                                    ⚠️ {item.illnessDetails || 'Maladie signalée'}
                                  </span>
                                ) : (
                                  <span className="text-stone-400">RAS</span>
                                )}
                              </div>
                            </td>

                            {/* Proof */}
                            <td className="py-3 px-3">
                              {item.proofFile ? (
                                <button
                                  onClick={() =>
                                    setViewingProof({
                                      filename: item.proofFile!.filename,
                                      originalName: item.proofFile!.originalName,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Voir preuve</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-stone-400 italic">
                                  {item.paymentClicked ? 'Lien cliqué (preuve manquante)' : 'Aucune preuve'}
                                </span>
                              )}
                            </td>

                            {/* Status & Actions */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : item.status === 'pending_verification'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : item.status === 'rejected'
                                      ? 'bg-red-100 text-red-900 border border-red-300'
                                      : isPaymentOnly
                                      ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {item.status === 'confirmed' && '✅ Confirmé'}
                                  {item.status === 'pending_verification' && '🟠 En attente'}
                                  {item.status === 'rejected' && '❌ Rejeté'}
                                  {isPaymentOnly && '⚪ Clic sans preuve'}
                                </span>

                                <button
                                  onClick={() => handleDownloadParticipantReceipt(item)}
                                  className="text-[#5A5A40] hover:text-[#D2691E] p-1 hover:bg-[#f5f2ed] rounded-md transition-colors cursor-pointer"
                                  title="Télécharger la fiche / reçu officiel PDF (Preuve matérielle individuelle)"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingRegistration(item);
                                    setNewStatus(
                                      item.status === 'confirmed' || item.status === 'rejected'
                                        ? item.status
                                        : 'pending_verification'
                                    );
                                    setAdminNotes(item.adminNotes || '');
                                  }}
                                  className="text-stone-400 hover:text-stone-800 p-1 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                                  title="Modifier le statut"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setDeletingRegistration(item)}
                                  className="text-stone-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Supprimer cette inscription"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {item.adminNotes && (
                                <div className="text-[10px] text-stone-500 italic mt-1 max-w-xs truncate">
                                  Note: {item.adminNotes}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Configuration du paiement exclusif Wave */}
          {activeTab === 'settings' && settings && (
            <div className="flex-1 overflow-auto bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8 max-w-3xl">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 mb-1">
                    <span>Moyen de paiement unique</span>
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Configuration du Paiement Wave</h3>
                  <p className="text-xs text-stone-500">
                    Renseignez le lien Wave officiel que les participants utiliseront pour payer leur inscription. Tous les autres moyens de paiement ont été désactivés.
                  </p>
                </div>
                {settingsSaved && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Modifications enregistrées !
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                {/* Wave Link Input - Highly prominent */}
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                  <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider">
                    Lien de paiement Wave officiel (Obligatoire)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://wave.com/m/M_... ou lien direct de paiement Wave"
                    value={settings.waveLink}
                    onChange={(e) => setSettings({ ...settings, waveLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-sky-300 rounded-xl text-xs font-mono text-sky-950 focus:ring-2 focus:ring-sky-400 focus:outline-none shadow-2xs"
                  />
                  <p className="text-[11px] text-sky-800">
                    Ce lien sera le seul et unique moyen de paiement proposé aux participants. Le clic les redirigera directement sur l'application Wave.
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-200/60">
                    <span className="text-[11px] font-mono text-sky-800 break-all">
                      Lien officiel permanent : <strong className="text-sky-950">{PERMANENT_OFFICIAL_WAVE_LINK}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, waveLink: PERMANENT_OFFICIAL_WAVE_LINK, paymentAmount: '5 050 FCFA' })}
                      className="text-[11px] font-bold text-sky-800 hover:text-sky-950 underline shrink-0 cursor-pointer"
                    >
                      Rétablir le lien officiel permanent
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Nom du titulaire / compte Wave
                    </label>
                    <input
                      type="text"
                      value={settings.waveRecipientName || settings.momoRecipientName || ''}
                      onChange={(e) => setSettings({ ...settings, waveRecipientName: e.target.value, momoRecipientName: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                      Numéro Wave officiel (Affiché en complément)
                    </label>
                    <input
                      type="text"
                      placeholder="+225 07 00 00 00 00"
                      value={settings.waveNumber || settings.momoNumber || ''}
                      onChange={(e) => setSettings({ ...settings, waveNumber: e.target.value, momoNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Montant de l'inscription (FCFA)
                  </label>
                  <input
                    type="text"
                    value={settings.paymentAmount}
                    onChange={(e) => setSettings({ ...settings, paymentAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Consignes de paiement Wave aux participants
                  </label>
                  <textarea
                    rows={3}
                    value={settings.generalInstructions}
                    onChange={(e) => setSettings({ ...settings, generalInstructions: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-[#1DC2EC] hover:bg-[#18add4] text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder les paramètres Wave</span>
                  </button>
                </div>
              </form>

              {/* Permanent Archiving & Complete JSON Backup */}
              <div className="mt-8 pt-6 border-t border-amber-200 bg-amber-50/60 rounded-2xl p-5 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Archivage Permanent & Sauvegarde pour Toujours</span>
                    </h4>
                    <p className="text-xs text-amber-900/80 mt-1 max-w-xl">
                      Tous les enregistrements des administrations et participants sont automatiquement conservés sur le disque de façon permanente (redondance triple: fichier principal, sauvegarde synchrone et archive permanente). Vous pouvez aussi exporter ou restaurer manuellement l'archive complète.
                    </p>
                    {backupRestoreMsg && (
                      <div className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${backupRestoreMsg.isError ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {backupRestoreMsg.text}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadPermanentBackup}
                      disabled={isDownloadingBackup}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloadingBackup ? 'Téléchargement...' : 'Télécharger l\'archive JSON'}</span>
                    </button>

                    {currentUser.role === 'superadmin' && (
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-300 shadow-xs cursor-pointer transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isRestoringBackup ? 'Restauration...' : 'Restaurer une archive'}</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleRestoreBackupFile}
                          disabled={isRestoringBackup}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Maintenance & Reset Counters Section */}
              <div className="mt-8 pt-6 border-t border-rose-100 bg-rose-50/50 rounded-2xl p-5 border border-rose-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Zone de maintenance & Remise à zéro des compteurs</span>
                    </h4>
                    <p className="text-xs text-rose-800/80 mt-1 max-w-xl">
                      Cette option permet de purger toutes les inscriptions enregistrées et de réinitialiser tous les compteurs (inscrits, validés, montants) strictement à 0. Vos paramètres de paiement Wave et comptes administrateurs restent sauvegardés.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer shrink-0 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser les compteurs à 0</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Gestion des Administrateurs & Quota 2 Admins */}
          {activeTab === 'admins' && (
            <div className="flex-1 overflow-auto space-y-6 max-w-4xl">
              {/* Quota Status Banner */}
              <div
                className={`rounded-2xl border p-5 transition-all ${
                  adminList.length >= 2
                    ? 'bg-stone-900 text-white border-stone-800 shadow-md'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        adminList.length >= 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {adminList.length >= 2 ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">
                          {adminList.length >= 2
                            ? 'Quota d’administrateurs atteint (2 / 2)'
                            : 'Politique d’accès : 2 administrateurs maximum autorisés'}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            adminList.length >= 2
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-amber-200/80 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {adminList.length} / 2 configuré{adminList.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed max-w-2xl ${
                          adminList.length >= 2 ? 'text-stone-300' : 'text-amber-800/90'
                        }`}
                      >
                        {adminList.length >= 2
                          ? 'Le Super Administrateur et le deuxième administrateur sont enregistrés. Les inscriptions de nouveaux administrateurs sont définitivement closes. Seule la connexion des administrateurs est autorisée.'
                          : 'Après le Super Administrateur, seul un deuxième administrateur est autorisé dans le système. Dès l’inscription du deuxième, toute nouvelle inscription sera bloquée et seule la connexion sera permise.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Admin Account Form OR Locked Message */}
              {adminList.length < 2 ? (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
                    <UserPlus className="w-5 h-5 text-amber-700" />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Inscrire le deuxième administrateur (Dernière place autorisée)
                      </h3>
                      <p className="text-xs text-stone-500">
                        Attribuez un email et un mot de passe temporaire pour le 2ème administrateur.
                      </p>
                    </div>
                  </div>

                  {adminCreatedMsg && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                      {adminCreatedMsg}
                    </div>
                  )}

                  <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Email du 2ème administrateur
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin2@organisation.ci"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Mot de passe temporaire (min. 8 car.)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••"
                        value={newAdminTempPassword}
                        onChange={(e) => setNewAdminTempPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-200"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer"
                      >
                        Enregistrer le 2ème administrateur
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200/80 text-stone-700 flex items-center justify-center shrink-0">
                    <Lock className="w-6 h-6 text-stone-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">
                      Inscriptions de nouveaux administrateurs verrouillées
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Le quota maximal de 2 administrateurs (1 Super Administrateur + 1 Administrateur) est atteint. Aucune nouvelle inscription n'est autorisée. Seule la connexion des administrateurs est permise.
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Accounts Table */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-500" />
                    <span>Comptes administrateurs enregistrés ({adminList.length} / 2)</span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {adminList.length >= 2 ? '🔒 Inscriptions closes' : '🔓 1 place restante'}
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Rôle</th>
                      <th className="py-2.5 px-4">Créé le</th>
                      <th className="py-2.5 px-4">Dernière connexion</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {adminList.map((admin) => {
                      const isSuperAdmin = admin.role === 'superadmin';
                      const canDelete = currentUser.role === 'superadmin' && !isSuperAdmin;

                      return (
                        <tr key={admin.id} className="hover:bg-stone-50">
                          <td className="py-3 px-4 font-semibold text-stone-900">
                            <div className="flex items-center gap-2">
                              <span>{admin.email}</span>
                              {admin.id === currentUser.id && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  Vous
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isSuperAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Shield className="w-3 h-3 text-amber-700" />
                                <span>Super Administrateur</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                                <span>2ème Administrateur</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-500">
                            {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 px-4 text-stone-500">
                            {admin.lastLogin
                              ? new Date(admin.lastLogin).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Jamais'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isSuperAdmin ? (
                              <span className="text-[10px] text-stone-400 italic">Compte principal protégé</span>
                            ) : canDelete ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                disabled={deletingAdminId === admin.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Révoquer ce compte administrateur (libère la 2ème place)"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{deletingAdminId === admin.id ? 'Suppression...' : 'Révoquer'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proof Modal Viewer */}
      {viewingProof && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900">{viewingProof.originalName}</h4>
                <p className="text-[11px] text-stone-500">Preuve de virement Mobile Money</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/proofs/${viewingProof.filename}?token=${token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  title="Ouvrir en taille réelle"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setViewingProof(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-stone-100 flex items-center justify-center">
              {viewingProof.filename.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`/api/admin/proofs/${viewingProof.filename}?token=${token}`}
                  className="w-full h-96 rounded-xl border border-stone-300"
                  title="PDF Preuve"
                />
              ) : (
                <img
                  src={`/api/admin/proofs/${viewingProof.filename}?token=${token}`}
                  alt="Preuve de paiement"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status & Notes Edit Modal */}
      {editingRegistration && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900">
                Modifier le statut : {editingRegistration.id}
              </h4>
              <button
                onClick={() => setEditingRegistration(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-2">
                Nouveau Statut
              </label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${newStatus === 'confirmed' ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold' : 'border-stone-200'}`}>
                  <input
                    type="radio"
                    name="statusChoice"
                    value="confirmed"
                    checked={newStatus === 'confirmed'}
                    onChange={() => setNewStatus('confirmed')}
                  />
                  <span>✅ Valider & Confirmer l'inscription</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${newStatus === 'pending_verification' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'border-stone-200'}`}>
                  <input
                    type="radio"
                    name="statusChoice"
                    value="pending_verification"
                    checked={newStatus === 'pending_verification'}
                    onChange={() => setNewStatus('pending_verification')}
                  />
                  <span>🟠 Laisser en attente de vérification</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${newStatus === 'rejected' ? 'bg-red-50 border-red-500 text-red-950 font-bold' : 'border-stone-200'}`}>
                  <input
                    type="radio"
                    name="statusChoice"
                    value="rejected"
                    checked={newStatus === 'rejected'}
                    onChange={() => setNewStatus('rejected')}
                  />
                  <span>❌ Rejeter (Preuve invalide / motif erroné)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Notes internes de l'administrateur
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ex : Virement reçu sur Wave le 12/09 par Koffi..."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setDeletingRegistration(editingRegistration);
                  setEditingRegistration(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRegistration(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900">Changer mon mot de passe</h4>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwdMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium ${
                  pwdMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Ancien mot de passe</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nouveau mot de passe (min. 8 car.)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Options & Material Proofs Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5A5A40]/10 border border-[#5A5A40]/30 text-[#5A5A40] flex items-center justify-center font-bold">
                  <Download className="w-5 h-5 text-[#D2691E]" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-stone-900 leading-tight">
                    Exportation & Preuves Matérielles
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Randonnée Forêt du Banco 2026 — Archivage officiel des inscrits
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A40]">
                1. Périmètre des données à exporter
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                    exportScope === 'filtered'
                      ? 'bg-[#5A5A40]/5 border-[#5A5A40] text-stone-900 shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value="filtered"
                    checked={exportScope === 'filtered'}
                    onChange={() => setExportScope('filtered')}
                    className="mt-0.5 text-[#5A5A40] focus:ring-[#5A5A40]"
                  />
                  <div>
                    <div className="text-xs font-bold">Sélection filtrée actuelle</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {registrations.length} participant{registrations.length > 1 ? 's' : ''} correspondant aux filtres en cours
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                    exportScope === 'all'
                      ? 'bg-[#5A5A40]/5 border-[#5A5A40] text-stone-900 shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportScope"
                    value="all"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="mt-0.5 text-[#5A5A40] focus:ring-[#5A5A40]"
                  />
                  <div>
                    <div className="text-xs font-bold">Registre complet</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {stats.total} participant{stats.total > 1 ? 's' : ''} (l'ensemble de la base de données)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Formats Selection */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5A5A40]">
                2. Choisir le format de preuve matérielle
              </label>

              <div className="space-y-2.5">
                {/* Excel Option */}
                <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>Classeur Excel Professionnel (.xlsx)</span>
                        <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">Recommandé</span>
                      </div>
                      <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-snug">
                        2 feuilles ordonnées : registre nominatif avec colonnes auto-ajustées + feuille de synthèse officielle des effectifs et urgences.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportExcel(exportScope)}
                    disabled={exporting !== null}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {exporting === 'excel' ? 'Export...' : 'Télécharger Excel'}
                  </button>
                </div>

                {/* PDF Option */}
                <div className="p-3.5 rounded-2xl border border-[#5A5A40]/30 bg-[#f5f2ed]/70 hover:bg-[#f5f2ed] transition-all flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <FileText className="w-5 h-5 text-[#D2691E]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <span>Registre PDF Officiel d'Émargement (Paysage A4)</span>
                        <span className="text-[9px] bg-[#D2691E]/20 text-[#D2691E] border border-[#D2691E]/30 px-1.5 py-0.2 rounded font-mono font-bold">Contrôle Banco</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                        Mise en page officielle paysage pour impression physique, contrôle à l'entrée du Banco, alertes santé rouges et cadre signatures.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportPDF(exportScope)}
                    disabled={exporting !== null}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#5A5A40] hover:bg-[#484833] text-white shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {exporting === 'pdf' ? 'Génération...' : 'Générer PDF'}
                  </button>
                </div>

                {/* CSV Option */}
                <div className="p-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800">Fichier CSV (Standard délimité)</div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Export brut avec séparateur point-virgule et encodage UTF-8 (BOM).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors shrink-0 cursor-pointer"
                  >
                    Télécharger CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>💡 Les fichiers générés constituent des preuves matérielles juridiques et organisationnelles.</span>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-1 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Registration Confirmation Modal */}
      {deletingRegistration && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">Supprimer l'inscription</h4>
                <p className="text-xs text-stone-500">Action irréversible</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement l'inscription de{' '}
              <strong className="text-stone-900 font-bold">{deletingRegistration.fullName}</strong>{' '}
              (Réf : <span className="font-mono text-amber-800 font-bold">{deletingRegistration.id}</span>) ?
            </p>

            <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 space-y-1">
              <div>• <strong>Contact :</strong> {deletingRegistration.contact}</div>
              <div>• <strong>Club / Église :</strong> {deletingRegistration.club} - {deletingRegistration.church}</div>
              <div>• Le fichier de preuve sera également effacé et les compteurs seront automatiquement recalculés.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeletingRegistration(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRegistration(deletingRegistration.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Suppression...' : 'Confirmer la suppression'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All Counters & Registrations Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-rose-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">
                  Réinitialiser les compteurs & inscriptions à zéro
                </h4>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  Action administrative — Remise à zéro complète
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-950 leading-relaxed">
              <p>
                ⚠️ <strong>Attention :</strong> Cette opération va effacer <strong>l'ensemble des inscriptions</strong> (actuellement {stats.total} participant{stats.total > 1 ? 's' : ''}), supprimer tous les fichiers de preuve associés et remettre tous les compteurs (inscrits, validés, montants) strictement à <strong>zéro (0)</strong>.
              </p>
              <p className="text-[11px] text-rose-800">
                Vos paramètres de paiement Wave et vos comptes administrateurs seront conservés.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pour confirmer la remise à zéro, veuillez saisir <span className="font-mono font-bold text-rose-600">ZERO</span> ci-dessous :
              </label>
              <input
                type="text"
                value={resetConfirmCode}
                onChange={(e) => setResetConfirmCode(e.target.value.toUpperCase())}
                placeholder="Tapez ZERO"
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-rose-500 uppercase tracking-widest"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmCode('');
                }}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                disabled={resetConfirmCode !== 'ZERO' || isResetting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isResetting ? 'Réinitialisation en cours...' : 'Remettre tous les compteurs à 0'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share / Simplified Link Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        eventName={settings?.eventName || 'Randonnée 2026'}
        eventDate={settings?.eventDate || 'Dimanche 15 Novembre 2026'}
      />
    </div>
  );
};
