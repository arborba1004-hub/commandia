import { useState, useMemo } from 'react';
import { useGangStore } from '@/store/gangStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Users, Zap } from 'lucide-react';
import type { GangMemberType } from '@/types/gangWar';

interface AttackMemberSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMemberIds: string[]) => void;
  isLoading?: boolean;
}

function getMemberTypeLabel(type: GangMemberType): string {
  const labels: Record<GangMemberType, string> = {
    capanga: 'Capanga',
    frente: 'Frente',
    executor: 'Executor',
    assassino: 'Assassino',
    muralha: 'Muralha',
    certeiro: 'Certeiro',
    motorista: 'Motorista',
    nitro: 'Nitro',
    armeiro: 'Armeiro',
    informante: 'Informante',
    wifi: 'WiFi',
    medico: 'Médico',
    lavador: 'Lavador',
    ladrao: 'Ladrão',
    negociador: 'Negociador',
  };
  return labels[type] || type;
}

function getTypeColor(type: GangMemberType): string {
  if (type === 'assassino' || type === 'executor' || type === 'frente') {
    return 'bg-red-500/20 border-red-500/50 text-red-300';
  }
  if (type === 'muralha' || type === 'medico') {
    return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300';
  }
  if (type === 'motorista' || type === 'nitro') {
    return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
  }
  if (type === 'lavador' || type === 'ladrao' || type === 'negociador') {
    return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
  }
  return 'bg-white/10 border-white/20 text-zinc-200';
}

function getStatusColor(status: string): string {
  if (status === 'ativo') return 'text-emerald-400';
  if (status === 'ferido') return 'text-amber-400';
  if (status === 'morto') return 'text-red-400';
  return 'text-cyan-400';
}

export default function AttackMemberSelector({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: AttackMemberSelectorProps) {
  const { gang } = useGangStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const members = useMemo(() => {
    if (!gang?.members) return [];
    return gang.members.filter((m) => m.status === 'ativo');
  }, [gang?.members]);

  const selectedCount = selectedIds.size;
  const totalPower = useMemo(() => {
    if (!gang?.members) return 0;
    return Array.from(selectedIds)
      .map((id) => gang.members.find((m) => m.id === id))
      .filter(Boolean)
      .reduce((sum, m) => sum + (m?.level || 1), 0);
  }, [selectedIds, gang?.members]);

  const handleToggle = (memberId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  };

  const handleConfirm = () => {
    if (selectedCount === 0) return;
    onConfirm(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-heading">
            <Users className="w-5 h-5 text-primary" />
            Selecione Membros para Ataque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Selecionados</div>
              <div className="text-2xl font-bold text-primary">{selectedCount}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Disponíveis</div>
              <div className="text-2xl font-bold text-emerald-400">{members.length}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Poder Total
              </div>
              <div className="text-2xl font-bold text-amber-400">{totalPower}</div>
            </div>
          </div>

          {/* Warning */}
          {members.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-300">
                Você não possui membros ativos disponíveis para ataque.
              </div>
            </div>
          )}

          {/* Select All */}
          {members.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700">
              <Checkbox
                checked={selectedIds.size === members.length && members.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-slate-300">Selecionar Todos</span>
            </div>
          )}

          {/* Members List */}
          <ScrollArea className="h-96 border border-slate-700 rounded-lg bg-slate-800/20">
            <div className="p-4 space-y-2">
              {members.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Nenhum membro ativo disponível
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
                    onClick={() => handleToggle(member.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(member.id)}
                      onCheckedChange={() => handleToggle(member.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-200">
                          {getMemberTypeLabel(member.type as GangMemberType)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTypeColor(member.type as GangMemberType)}`}
                        >
                          Nível {member.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={getStatusColor(member.status)}>
                          {member.status === 'ativo' ? '✓ Ativo' : member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedCount === 0 || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? 'Enviando...' : `Enviar ${selectedCount} Membros`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
