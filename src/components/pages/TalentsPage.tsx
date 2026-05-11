import { useEffect, useState } from 'react';
// ... keep existing code (Header and Footer rendered by Router layout) ...
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TalentsMenu from '@/components/TalentsMenu';
import TalentSystemGuide from '@/components/TalentSystemGuide';
import TalentProgressTracker from '@/components/TalentProgressTracker';
import { BookOpen, Zap } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

type TalentTab = 'menu' | 'guide';

export default function TalentsPage() {
  const [activeTab, setActiveTab] = useState<TalentTab>('menu');
  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  if (!isLoaded || !player?._id) {
    return (
      <div className="bg-black text-white flex items-center justify-center py-20">
        Carregando talentos...
      </div>
    );
  }

  const playerLevel = player?.niveis?.playerLevel || 1;
  const currentRank = player?.currentRank || 'Atividade';

  return (
    <div className="w-full">
      <main className="flex-1 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <section className="mb-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 to-pink-600/10 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-black font-heading text-primary mb-2">
                  👑 TALENTOS DO CRIME
                </h1>
                <p className="text-gray-300 font-paragraph max-w-2xl">
                  Desbloqueie habilidades criminosas, evolua sua especialização e
                  fortaleça seu império com vantagens permanentes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
                <div className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">
                    Nível
                  </div>
                  <div className="mt-1 text-2xl font-black">{playerLevel}</div>
                </div>

                <div className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">
                    Hierarquia
                  </div>
                  <div className="mt-1 text-base font-black truncate">{currentRank}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8 rounded-3xl border border-white/10 bg-[#090909] p-5 md:p-6">
            <TalentProgressTracker />
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#090909] p-5 md:p-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TalentTab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-black/40 mb-6 border border-white/10">
                <TabsTrigger
                  value="menu"
                  className="data-[state=active]:bg-primary data-[state=active]:text-black flex items-center gap-2 font-black"
                >
                  <Zap className="w-4 h-4" />
                  Menu de Talentos
                </TabsTrigger>

                <TabsTrigger
                  value="guide"
                  className="data-[state=active]:bg-primary data-[state=active]:text-black flex items-center gap-2 font-black"
                >
                  <BookOpen className="w-4 h-4" />
                  Guia Completo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="menu" className="mt-0">
                <TalentsMenu />
              </TabsContent>

              <TabsContent value="guide" className="mt-0">
                <TalentSystemGuide />
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>
    </div>
  );
}