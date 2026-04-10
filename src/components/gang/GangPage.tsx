import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Coins, Trophy, TrendingUp, Shield, PlusCircle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeatureLevelLock from '@/components/FeatureLevelLock';
import { canAccessFeature, getFeatureLevelRequirement } from '@/utils/levelRequirements';

import MemberCard from './MemberCard';
import RecruitModal from './RecruitModal';
import TrainModal from './TrainModal';
import EquipModal from './EquipModal';
import GangSkillsPanel from './GangSkillsPanel';

import type { GangMember } from '@/types/gang';

export default function GangPage() {
  const navigate = useNavigate();
  const { myGang, fetchMyGang, isLoading, donateToTreasury } = useGangStore();
  const player = usePlayerStore((state) => state.player);

  // Estados locais
  const [selectedMember, setSelectedMember] = useState<GangMember | null>(null);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'treasury' | 'skills'>('members');

  const playerLevel = player.niveis.playerLevel || 1;
  const requiredLevel = getFeatureLevelRequirement('gang');
  const isFeatureUnlocked = canAccessFeature(playerLevel, 'gang');

  // Se a funcionalidade não está desbloqueada, mostrar lock screen
  if (!isFeatureUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <FeatureLevelLock
            playerLevel={playerLevel}
            requiredLevel={requiredLevel}
            featureName="Gang"
            onNavigateToBarraco={() => navigate('/barraco')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Carrega a quadrilha ao montar o componente
  useEffect(() => {
    fetchMyGang();
  }, [fetchMyGang]);

  // Memoized calculations
  const activeMembers = useMemo(() => {
    if (!myGang) return [];
    return myGang.members.filter((m) => myGang.activeMemberIds.includes(m.id));
  }, [myGang]);

  const reserveMembers = useMemo(() => {
    if (!myGang) return [];
    return myGang.members.filter((m) => !myGang.activeMemberIds.includes(m.id));
  }, [myGang]);

  const freeSlots = useMemo(() => {
    if (!myGang) return 0;
    return Math.max(0, myGang.slots - activeMembers.length);
  }, [myGang, activeMembers.length]);

  const totalBattlePower = useMemo(() => {
    return activeMembers.reduce((acc, member) => acc + (member.level || 1) * 10, 0);
  }, [activeMembers]);

  // Handlers otimizados com useCallback
  const handleTrainMember = useCallback((member: GangMember) => {
    setSelectedMember(member);
    setShowTrainModal(true);
  }, []);

  const handleEquipMember = useCallback((member: GangMember) => {
    setSelectedMember(member);
    setShowEquipModal(true);
  }, []);

  const closeTrainModal = useCallback(() => {
    setShowTrainModal(false);
    setTimeout(() => setSelectedMember(null), 300); // delay para animação
  }, []);

  const closeEquipModal = useCallback(() => {
    setShowEquipModal(false);
    setTimeout(() => setSelectedMember(null), 300);
  }, []);

  // Early returns
  if (isLoading && !myGang) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white text-xl">Carregando sua quadrilha...</p>
        </div>
      </div>
    );
  }

  if (!myGang) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-20 h-20 mx-auto mb-6 text-yellow-500" />
          <h2 className="text-4xl font-black mb-4">Você ainda não tem uma quadrilha</h2>
          <p className="text-gray-400 mb-8">Crie ou entre em uma para dominar as ruas.</p>
          {/* Botão para criar gang seria aqui */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header />

      <main className="pt-28 px-4 pb-24 max-w-7xl mx-auto">
        {/* Header da Gang */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-black tracking-tighter">{myGang.name}</h1>
                <span className="text-primary text-2xl font-bold">[{myGang.tag}]</span>
              </div>
              <p className="text-gray-400 mt-2 text-lg">
                Nível {myGang.level} • EXP {myGang.exp.toLocaleString()}/{myGang.expToNext.toLocaleString()}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowRecruitModal(true)}
              className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-700 
                         text-black font-bold px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-primary/30"
            >
              <PlusCircle size={24} />
              Recrutar Novo Membro
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-zinc-900/80 border border-yellow-500/20 rounded-2xl p-5"
            >
              <Coins className="text-yellow-400 mb-3" size={28} />
              <p className="text-sm text-gray-400">Tesouro Sujo</p>
              <p className="text-2xl font-bold mt-1">R$ {myGang.treasury.dirtyMoney.toLocaleString()}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-zinc-900/80 border border-emerald-500/20 rounded-2xl p-5"
            >
              <Coins className="text-emerald-400 mb-3" size={28} />
              <p className="text-sm text-gray-400">Tesouro Limpo</p>
              <p className="text-2xl font-bold mt-1">R$ {myGang.treasury.cleanMoney.toLocaleString()}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-zinc-900/80 border border-cyan-500/20 rounded-2xl p-5"
            >
              <Trophy className="text-cyan-400 mb-3" size={28} />
              <p className="text-sm text-gray-400">Vitórias</p>
              <p className="text-2xl font-bold mt-1">{myGang.totalVictories}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-zinc-900/80 border border-purple-500/20 rounded-2xl p-5"
            >
              <Shield className="text-purple-400 mb-3" size={28} />
              <p className="text-sm text-gray-400">Poder de Batalha</p>
              <p className="text-2xl font-bold mt-1">{totalBattlePower.toLocaleString()}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          {(['members', 'treasury', 'skills'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 font-bold text-lg transition-all relative ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab === 'members' && 'Membros'}
              {tab === 'treasury' && 'Tesouro'}
              {tab === 'skills' && 'Habilidades'}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo das Tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-400">
                  Membros ativos: <span className="text-white font-bold">{activeMembers.length}</span> / {myGang.slots}
                  {freeSlots > 0 && <span className="text-emerald-400"> (+{freeSlots} livres)</span>}
                </p>
              </div>

              {/* Membros Ativos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onTrain={() => handleTrainMember(member)}
                    onEquip={() => handleEquipMember(member)}
                    onToggleActive={() => {}}
                    onDismiss={() => {}}
                  />
                ))}
              </div>

              {/* Membros na Reserva */}
              {reserveMembers.length > 0 && (
                <div className="mt-16">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Users className="text-gray-400" /> Reserva
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                    {reserveMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        onTrain={() => handleTrainMember(member)}
                        onEquip={() => handleEquipMember(member)}
                        onToggleActive={() => {}}
                        onDismiss={() => {}}
                        isReserve
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'treasury' && (
            <motion.div
              key="treasury"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-zinc-900/70 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-3">Doar para o Tesouro</h2>
              <p className="text-gray-400 mb-10">
                Fortaleça sua quadrilha. Cada doação gera EXP e aumenta seu status dentro da gang.
              </p>

              <div className="grid gap-4">
                <button
                  onClick={() => donateToTreasury('dirtyMoney', 10000)}
                  className="group bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 p-6 rounded-2xl transition-all text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xl">R$ 10.000 Sujo</p>
                      <p className="text-emerald-400">+10 EXP da Quadrilha</p>
                    </div>
                    <div className="text-3xl">💰</div>
                  </div>
                </button>

                <button
                  onClick={() => donateToTreasury('cleanMoney', 5000)}
                  className="group bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 p-6 rounded-2xl transition-all text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xl">R$ 5.000 Limpo</p>
                      <p className="text-emerald-400">+20 EXP da Quadrilha</p>
                    </div>
                    <div className="text-3xl">💵</div>
                  </div>
                </button>

                <button
                  onClick={() => donateToTreasury('corre', 100)}
                  className="group bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 p-6 rounded-2xl transition-all text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-xl">100 Corre</p>
                      <p className="text-emerald-400">+15 EXP da Quadrilha</p>
                    </div>
                    <div className="text-3xl">🏃‍♂️</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GangSkillsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modais */}
      <RecruitModal isOpen={showRecruitModal} onClose={() => setShowRecruitModal(false)} />

      <AnimatePresence>
        {selectedMember && (
          <>
            <TrainModal
              isOpen={showTrainModal}
              member={selectedMember}
              onClose={closeTrainModal}
            />
            <EquipModal
              isOpen={showEquipModal}
              member={selectedMember}
              onClose={closeEquipModal}
            />
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}