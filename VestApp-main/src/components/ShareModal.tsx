import React from 'react';
import { Share2, Link, Twitter, Facebook, Mail, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  text: string;
  theme: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, title, text, theme }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado com sucesso! 🔗");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar link.");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + url)}`, '_blank');
  };

  // Close on click outside
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isLight = theme === 'light';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div 
        className={`w-full max-w-sm rounded-[2rem] p-6 shadow-2xl transition-all scale-100 ${
          isLight ? 'bg-white border text-slate-800' : 'bg-bg-secondary border border-glass-border text-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Share2 size={24} className={isLight ? 'text-accent-1' : 'text-accent-1'} />
            Compartilhar
          </h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <button onClick={handleWhatsApp} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] group-hover:scale-110 group-hover:bg-[#25D366] group-hover:text-white transition-all">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.098-.21.046-.39-.034-.54-.075-.15-.673-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.21 2.095 3.2 5.077 4.485.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.195-.572-.345z"/><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.445h.004c6.58 0 11.939-5.335 11.943-11.893 0-3.176-1.24-6.165-3.472-8.451zM12.049 21.89c-1.774 0-3.51-.476-5.031-1.373l-.361-.214-3.74.975.996-3.626-.235-.372A9.923 9.923 0 011.996 11.89C2.002 6.353 6.513 1.85 12.052 1.85c2.684.002 5.205 1.045 7.103 2.936 1.898 1.892 2.943 4.407 2.94 7.098-.005 5.538-4.516 10.006-10.046 10.006z"/>
              </svg>
            </div>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>WhatsApp</span>
          </button>

          <button onClick={handleTwitter} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center text-[#1DA1F2] group-hover:scale-110 group-hover:bg-[#1DA1F2] group-hover:text-white transition-all">
              <Twitter size={24} />
            </div>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Twitter</span>
          </button>

          <button onClick={handleFacebook} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] group-hover:scale-110 group-hover:bg-[#1877F2] group-hover:text-white transition-all">
              <Facebook size={24} />
            </div>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>Facebook</span>
          </button>

          <button onClick={handleEmail} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:bg-gray-500 group-hover:text-white transition-all">
              <Mail size={24} />
            </div>
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>E-mail</span>
          </button>
        </div>

        <div className={`flex items-center gap-2 p-2 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'}`}>
          <div className={`flex-1 truncate px-2 text-xs font-mono opacity-60 ${isLight ? 'text-slate-700' : 'text-white'}`}>
            {url}
          </div>
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors shrink-0 cursor-pointer ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-accent-1 text-white hover:bg-accent-1/90'
            }`}
          >
            {copied ? <Check size={16} /> : <Link size={16} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
};
