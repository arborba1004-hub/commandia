import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import GangTrainingModal from '@/components/gang/GangTrainingModal';

export default function TreinamentoGangPage() {
  const { player } = usePlayerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-4xl text-foreground mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <h1 className="font-heading text-5xl text-foreground mb-8">Treinamento de Gang</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-custom4/20 rounded-lg p-8 border border-primary/20">
            <h2 className="font-heading text-2xl text-foreground mb-4">Treinar Membros</h2>
            <p className="font-paragraph text-foreground/80 mb-6">
              Fortaleça sua gang treinando membros para aumentar sua força e poder.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading px-6 py-3 rounded-lg transition-colors"
            >
              Iniciar Treinamento
            </button>
          </div>

          <div className="bg-custom4/20 rounded-lg p-8 border border-primary/20">
            <h2 className="font-heading text-2xl text-foreground mb-4">Estatísticas</h2>
            <div className="space-y-4">
              <div>
                <p className="font-paragraph text-foreground/60 text-sm">Nível do Barraco</p>
                <p className="font-heading text-2xl text-primary">{player?.niveis?.barracoLevel ?? 0}</p>
              </div>
              <div>
                <p className="font-paragraph text-foreground/60 text-sm">Dinheiro Sujo</p>
                <p className="font-heading text-2xl text-primary">{(player?.balances?.dirtyMoney ?? 0).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <GangTrainingModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
