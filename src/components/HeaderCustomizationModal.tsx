import { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HeaderCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_FONTS = [
  { name: 'Oswald', value: 'oswald' },
  { name: 'Playfair Display', value: 'playfair display' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Courier New', value: 'Courier New' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS' },
  { name: 'Impact', value: 'Impact' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS' },
];

export default function HeaderCustomizationModal({ isOpen, onClose }: HeaderCustomizationModalProps) {
  const { player, setHeaderCustomization } = usePlayerStore();
  const customization = player.headerCustomization || {
    playerNameFont: 'oswald',
    playerNameFontSize: '1.875rem',
    playerNameColor: '#1a1205',
  };

  const [selectedFont, setSelectedFont] = useState(customization.playerNameFont || 'oswald');
  const [fontSize, setFontSize] = useState(customization.playerNameFontSize || '1.875rem');
  const [color, setColor] = useState(customization.playerNameColor || '#1a1205');

  const handleSave = () => {
    setHeaderCustomization({
      playerNameFont: selectedFont,
      playerNameFontSize: fontSize,
      playerNameColor: color,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-[#7a5a25] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-heading uppercase">Personalizar Cabeçalho</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Font Selection */}
          <div>
            <Label className="text-white font-heading uppercase text-sm mb-2 block">Fonte do Nome</Label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full bg-black/50 border border-[#7a5a25] rounded px-3 py-2 text-white font-heading uppercase text-sm focus:outline-none focus:border-yellow-500"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <Label className="text-white font-heading uppercase text-sm mb-2 block">Tamanho da Fonte</Label>
            <Input
              type="text"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              placeholder="ex: 1.875rem, 2rem, 24px"
              className="bg-black/50 border border-[#7a5a25] text-white font-heading uppercase text-sm focus:border-yellow-500"
            />
          </div>

          {/* Color */}
          <div>
            <Label className="text-white font-heading uppercase text-sm mb-2 block">Cor do Texto</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 bg-black/50 border border-[#7a5a25] cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#1a1205"
                className="flex-1 bg-black/50 border border-[#7a5a25] text-white font-heading uppercase text-sm focus:border-yellow-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-black/50 border border-[#7a5a25] rounded">
            <p className="text-white font-heading uppercase text-xs text-[#d9b764] mb-2">Prévia:</p>
            <div
              style={{
                fontFamily: selectedFont,
                fontSize: fontSize,
                color: color,
              }}
              className="uppercase font-bold"
            >
              {(player.name || 'CAPO GHOST').toUpperCase()}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleSave}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-heading uppercase"
            >
              Salvar
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white font-heading uppercase"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
