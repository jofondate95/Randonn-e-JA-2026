import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Share2,
  ExternalLink,
  Download,
  MessageCircle,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName?: string;
  eventDate?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  eventName = 'Randonnée 2026',
  eventDate = 'Dimanche 15 Novembre 2026',
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');

  // Compute simplified clean URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const simplifiedUrl = `${origin}/inscription`;
  const alternativeShortUrl = `${origin}/banco2026`;

  useEffect(() => {
    if (isOpen) {
      // Generate high-resolution QR code
      QRCode.toDataURL(simplifiedUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#383827',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [isOpen, simplifiedUrl]);

  if (!isOpen) return null;

  const handleCopy = async (textToCopy: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `🌿 *Inscription officielle — ${eventName}*\n` +
      `📅 *Date :* ${eventDate}\n` +
      `📍 *Lieu :* Parc National du Banco, Abidjan\n\n` +
      `👉 Cliquez sur le lien simplifié pour vous inscrire en ligne :\n${simplifiedUrl}\n\n` +
      `_Inscription rapide avec choix de taille t-shirt et paiement sécurisé._`
  );

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  const downloadQrCode = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-code-inscription-banco-2026.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="share-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 text-stone-800 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5A5A40]/10 border border-[#5A5A40]/25 text-[#5A5A40] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-[#D2691E]" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900 leading-tight">
                Lien simplifié du Formulaire
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Facile à diffuser sur WhatsApp, par SMS et par QR code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#D2691E]" />
            <span>Lien direct & WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#D2691E]" />
            <span>QR Code à scanner</span>
          </button>
        </div>

        {/* Main Content: Link View */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            {/* Primary Simplified Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#5A5A40] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D2691E]" />
                <span>Lien simplifié officiel</span>
              </label>

              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/25 shadow-inner">
                <div className="flex-1 font-mono text-xs text-stone-800 font-semibold truncate px-2 select-all">
                  {simplifiedUrl}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(simplifiedUrl)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#5A5A40] hover:bg-[#484833] text-white shadow-xs'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 italic">
                Ce lien épuré mène directement au formulaire d'inscription en ligne.
              </p>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* WhatsApp Share */}
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Partager sur WhatsApp</span>
              </a>

              {/* Open in new tab */}
              <a
                href={simplifiedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all border border-stone-200 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-stone-500" />
                <span>Tester le lien direct</span>
              </a>
            </div>

            {/* Alternative short link */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-stone-700 block">Autre alias simplifié :</span>
                <span className="font-mono text-[11px] text-[#5A5A40]">{alternativeShortUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(alternativeShortUrl)}
                className="text-xs font-semibold text-[#5A5A40] hover:text-[#D2691E] hover:underline cursor-pointer"
              >
                Copier
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: QR Code View */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/20">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code d'inscription Randonnée Banco 2026"
                  className="w-48 h-48 rounded-xl shadow-xs border border-stone-200 bg-white p-2"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
                  Génération du QR Code...
                </div>
              )}
              <div className="mt-3 text-xs font-serif font-bold text-stone-800">
                {eventName} • Banco 2026
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Scannez avec l'appareil photo d'un smartphone
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={downloadQrCode}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D2691E]" />
                <span>Télécharger l'image du QR Code (PNG)</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Diffusion recommandée auprès des églises & clubs JA</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
