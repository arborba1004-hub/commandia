import { useState } from 'react';
import { useGangStore } from '@/store/gangStore';
import { GangMember } from '@/types/gang';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/playerStore';

interface Props {
  isOpen: boolean;
  member: GangMember | null;
  onClose: () => void;
}

export default function EquipModal({ isOpen, member, onClose }: Props) {
  const { equipMember } = useGangStore();
  const player = usePlayerStore((state) => state.player);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!member) return null;

  const handleEquip = async (equipmentType: 'weapon' | 'armor' | 'vehicle', itemId: string) => {
    setIsProcessing(true);
    try {
      await equipMember(member.id, equipmentType, itemId);
      onClose();
    } catch (error) {
      console.error('Erro ao equipar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const weapons = player?.inventory?.items || [];
  const armor = player?.inventory?.items || [];
  const vehicles = player?.inventory?.items || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border border-white/10">
        <DialogHeader>
          <DialogTitle>Equipar {member.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Armas</h3>
            <div className="space-y-2">
              {weapons.map((item: any) => (
                <Button
                  key={item.id}
                  onClick={() => handleEquip('weapon', item.id)}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
