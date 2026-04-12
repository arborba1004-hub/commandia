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
  const player = usePlayerStore((state) => state.player);
  const applyPlayerUpdate = usePlayerStore((state) => state.applyPlayerUpdate);
  const syncPlayerToBackend = usePlayerStore((state) => state.syncPlayerToBackend);

  const [customName, setCustomName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'avatar' | 'name'>('avatar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setCustomName(player?.headerCustomization?.customName || player?.name || '');
    setSelectedAvatar(player?.headerCustomization?.customAvatar || player?.avatar || '');
  }, [isOpen, player]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      const safeCustomName = customName.trim() || player?.name || 'CAPO GHOST';
      const safeCustomAvatar = selectedAvatar || player?.avatar || '';

      applyPlayerUpdate((currentPlayer) => ({
        ...currentPlayer,
        headerCustomization: {
          ...(currentPlayer.headerCustomization || {}),
          customName: safeCustomName,
          customAvatar: safeCustomAvatar,
        },
      }));

      await syncPlayerToBackend();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar customizações:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d7a84a]/30 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#d7a84a]/20 px-6 py-4">
          <h2 className="text-2xl font-black uppercase tracking-wide text-[#f6d27b]">
            Personalizar Perfil
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[#d7a84a]/20">
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 px-6 py-3 font-bold uppercase tracking-wide transition-colors ${
              activeTab === 'avatar'
                ? 'border-b-2 border-[#f6d27b] bg-[#d7a84a]/20 text-[#f6d27b]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Avatar
          </button>
          <button
            onClick={() => setActiveTab('name')}
            className={`flex-1 px-6 py-3 font-bold uppercase tracking-wide transition-colors ${
              activeTab === 'name'
                ? 'border-b-2 border-[#f6d27b] bg-[#d7a84a]/20 text-[#f6d27b]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Nome
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {activeTab === 'avatar' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white/60">
                  Avatar Atual
                </p>
                {selectedAvatar ? (
                  <Image
                    src={selectedAvatar}
                    alt="Avatar atual"
                    className="mx-auto h-32 w-32 rounded-full border-4 border-[#d7a84a] object-cover shadow-lg"
                  />
                ) : (
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#d7a84a] bg-[#1a1a1a]">
                    <Upload className="h-8 w-8 text-[#d7a84a]/50" />
                  </div>
                )}
              </div>

              <div>
                <p className="mb-4 text-sm font-bold uppercase tracking-wide text-white/60">
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
                  className="flex w-full items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[#d7a84a]/50 bg-[#1a1a1a] px-6 py-4 font-bold uppercase tracking-wide text-white transition-colors hover:border-[#d7a84a] hover:bg-[#2a2a2a]"
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
                <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-white/60">
                  Nome do Jogador
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={30}
                  placeholder="Digite seu nome de jogador"
                  className="w-full rounded-lg border border-[#d7a84a]/30 bg-[#1a1a1a] px-4 py-3 text-white placeholder-white/40 transition-colors focus:border-[#f6d27b] focus:outline-none"
                />
                <p className="mt-2 text-xs text-white/40">{customName.length}/30 caracteres</p>
              </div>

              <div className="rounded-lg border border-[#d7a84a]/20 bg-[#1a1a1a] p-4">
                <p className="mb-2 text-sm font-bold text-white/60">Pré-visualização:</p>
                <p className="text-3xl font-black uppercase tracking-wide text-[#f6d27b]">
                  {customName || player?.name || 'CAPO GHOST'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#d7a84a]/20 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#d7a84a]/30 bg-[#1a1a1a] px-6 py-3 font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#2a2a2a]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="rounded-lg bg-[#d7a84a] px-6 py-3 font-black uppercase tracking-wide text-black transition-colors hover:bg-[#e8b85a] disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}