import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { Image } from '@/components/ui/image';

interface AvatarNameCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarNameCustomizationModal({
  isOpen,
  onClose,
}: AvatarNameCustomizationModalProps) {
  const { player, setPlayer } = usePlayerStore();
  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'avatar' | 'name'>('avatar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomName(
        (player as any)?.headerCustomization?.customName ||
          player?.name ||
          ''
      );
      setSelectedAvatar(player?.avatar || '');
    }
  }, [isOpen, player]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Update player store
      setPlayer({
        avatar: selectedAvatar,
        headerCustomization: {
          ...(player as any)?.headerCustomization,
          customName: customName.trim() || player?.name || 'CAPO GHOST',
        },
      });

      // Sync to backend
      await usePlayerStore.getState().syncPlayerToBackend();

      onClose();
    } catch (error) {
      console.error('Erro ao salvar customizações:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#d7a84a]/30 bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d7a84a]/20 px-6 py-4">
          <h2 className="text-2xl font-black text-[#f6d27b] uppercase tracking-wide">
            Personalizar Perfil
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#d7a84a]/20">
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 px-6 py-3 font-bold uppercase tracking-wide transition-colors ${
              activeTab === 'avatar'
                ? 'bg-[#d7a84a]/20 text-[#f6d27b] border-b-2 border-[#f6d27b]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Avatar
          </button>
          <button
            onClick={() => setActiveTab('name')}
            className={`flex-1 px-6 py-3 font-bold uppercase tracking-wide transition-colors ${
              activeTab === 'name'
                ? 'bg-[#d7a84a]/20 text-[#f6d27b] border-b-2 border-[#f6d27b]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Nome
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'avatar' && (
            <div className="space-y-6">
              {/* Current Avatar Preview */}
              <div className="text-center">
                <p className="text-sm text-white/60 mb-3 uppercase tracking-wide font-bold">
                  Avatar Atual
                </p>
                {selectedAvatar ? (
                  <Image
                    src={selectedAvatar}
                    alt="Avatar atual"
                    className="h-32 w-32 rounded-full border-4 border-[#d7a84a] object-cover mx-auto shadow-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full border-4 border-[#d7a84a] bg-[#1a1a1a] mx-auto flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#d7a84a]/50" />
                  </div>
                )}
              </div>

              {/* Upload from Device */}
              <div>
                <p className="text-sm text-white/60 mb-4 uppercase tracking-wide font-bold">
                  Selecione uma Foto do Seu Dispositivo
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-6 py-4 rounded-lg border-2 border-dashed border-[#d7a84a]/50 bg-[#1a1a1a] hover:bg-[#2a2a2a] hover:border-[#d7a84a] transition-colors flex items-center justify-center gap-3 text-white font-bold uppercase tracking-wide"
                >
                  <Upload className="h-6 w-6" />
                  Abrir Galeria do Dispositivo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'name' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wide">
                  Nome do Jogador
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={30}
                  placeholder="Digite seu nome de jogador"
                  className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#d7a84a]/30 text-white placeholder-white/40 focus:outline-none focus:border-[#f6d27b] transition-colors"
                />
                <p className="text-xs text-white/40 mt-2">
                  {customName.length}/30 caracteres
                </p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#d7a84a]/20 rounded-lg p-4">
                <p className="text-sm text-white/60 mb-2 font-bold">
                  Pré-visualização:
                </p>
                <p className="text-3xl font-black text-[#f6d27b] uppercase tracking-wide">
                  {customName || player?.name || 'CAPO GHOST'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#d7a84a]/20 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-[#1a1a1a] border border-[#d7a84a]/30 text-white font-bold uppercase tracking-wide hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-6 py-3 rounded-lg bg-[#d7a84a] text-black font-black uppercase tracking-wide hover:bg-[#e8b85a] disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
