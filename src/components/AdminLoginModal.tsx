import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, X, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { AdminUser } from '../types.js';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkSetup();
    }
  }, [isOpen]);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/admin/check-setup');
      const data = await res.json();
      setHasAdmin(data.hasAdmin);
    } catch (e) {
      setHasAdmin(true); // Fallback to standard login
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Identifiants invalides');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup-initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de l'initialisation");
      }

      setSuccessMessage('Administrateur initial configuré avec succès ! Connexion...');
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 900);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#383827]/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xs rounded-3xl border border-[#5A5A40]/20 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#7a7a72] hover:text-[#2d2d2a] hover:bg-[#f5f2ed] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/20 text-[#5A5A40] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Shield className="w-6 h-6 text-[#D2691E]" />
          </div>
          <h2 className="text-xl font-serif italic font-bold text-[#5A5A40]">
            {hasAdmin === false ? 'Configuration Administrateur' : 'Espace Administrateur'}
          </h2>
          <p className="text-xs text-[#7a7a72] mt-1">
            {hasAdmin === false
              ? 'Aucun compte configuré. Créez le premier accès super-administrateur sécurisé.'
              : 'Accès sécurisé réservé au comité d’organisation Randonnée 2026.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {hasAdmin === false ? (
          /* Initial Setup Form */
          <form onSubmit={handleInitialSetup} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#7a7a72] uppercase tracking-[0.2em] mb-1.5">
                Email Administrateur Principal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@organisation.ci"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#7a7a72] uppercase tracking-[0.2em] mb-1.5">
                Mot de passe robuste (min. 8 car.)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#7a7a72] uppercase tracking-[0.2em] mb-1.5">
                Confirmez le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-full font-bold text-xs uppercase tracking-widest bg-[#5A5A40] hover:bg-[#484833] text-white shadow-md shadow-[#5A5A40]/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Initialiser le compte</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Standard Login Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#7a7a72] uppercase tracking-[0.2em] mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@organisation.ci"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#7a7a72] uppercase tracking-[0.2em] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-full font-bold text-xs uppercase tracking-widest bg-[#5A5A40] hover:bg-[#484833] text-white shadow-md shadow-[#5A5A40]/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4 text-[#D2691E]" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#5A5A40]/15 text-center">
          <p className="text-[11px] text-[#7a7a72]">
            Session sécurisée avec déconnexion automatique en cas d'inactivité.
          </p>
        </div>
      </div>
    </div>
  );
};
