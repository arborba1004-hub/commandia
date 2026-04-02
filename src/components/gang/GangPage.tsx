import { useEffect, useState } from 'react';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MemberCard from './MemberCard';
import RecruitModal from './RecruitModal';
import TrainModal from './TrainModal';
import EquipModal from './EquipModal';
import GangSkillsPanel from './GangSkillsPanel';
import { motion } from 'framer-motion';
import { Users, Coins, Trophy, TrendingUp, Shield, PlusCircle } from 'lucide-react';

export default function GangPage() {
  const { myGang, fetchMyGang, isLoading, donateToTreasury } = useGangStore();
  const player = usePlayerStore((state) => state.player);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'treasury' | 'skills'>('members');

  useEffect(() => {
    fetchMyGang();
  }, []);

  if (isLoading && !myGang) return <div className="text-white p-8">Carregando quadrilha...</div>;
  if (!myGang) return <div className="text-white p-8">Você ainda não tem uma quadrilha. Crie uma!</div>;

  const activeMembers = myGang.members.filter(m => myGang.activeMemberIds.includes(m.id));
  const freeSlots = myGang.slots - activeMembers.length;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-28 px-4 pb-20 max-w-7xl mx-auto">
        {/* Cabeçalho da quadrilha */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-wider">{myGang.name} <span className="text-primary text-xl">[{myGang.tag}]</span></h1>
              <p className="text-gray-400">Nível {myGang.level} • EXP {myGang.exp}/{myGang.expToNext} • Slots: {activeMembers.length}/{myGang.slots}</p>
            </div>
            <button
              onClick={() => setShowRecruitModal(true)}
              className="bg-primary hover:bg-primary/80 text-black font-bold px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <PlusCircle size={20} /> Recrutar Membro
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-primary/30">
              <Coins className="inline text-yellow-400" size={24} />
              <p className="text-sm text-gray-400">Tesouro Sujo</p>
              <p className="text-xl font-bold">R$ {myGang.treasury.dirtyMoney.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-emerald-500/30">
              <Coins className="inline text-emerald-400" size={24} />
              <p className="text-sm text-gray-400">Tesouro Limpo</p>
              <p className="text-xl font-bold">R$ {myGang.treasury.cleanMoney.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-cyan-500/30">
              <TrendingUp className="inline text-cyan-400" size={24} />
              <p className="text-sm text-gray-400">Vitórias</p>
              <p className="text-xl font-bold">{myGang.totalVictories}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-purple-500/30">
              <Shield className="inline text-purple-400" size={24} />
              <p className="text-sm text-gray-400">Poder de Batalha</p>
              <p className="text-xl font-bold">{(activeMembers.reduce((acc, m) => acc + (m.level * 10), 0)).toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/20 mb-6">
          <button onClick={() => setActiveTab('members')} className={`pb-2 px-4 font-bold ${activeTab === 'members' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>Membros</button>
          <button onClick={() => setActiveTab('treasury')} className={`pb-2 px-4 font-bold ${activeTab === 'treasury' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>Tesouro</button>
          <button onClick={() => setActiveTab('skills')} className={`pb-2 px-4 font-bold ${activeTab === 'skills' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>Habilidades</button>
        </div>

        {/* Membros */}
        {activeTab === 'members' && (
          <div>
            <p className="text-sm text-gray-400 mb-4">Membros ativos: {activeMembers.length} / {myGang.slots} {freeSlots > 0 && `(+${freeSlots} slots livres)`}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeMembers.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onTrain={() => { setSelectedMember(member); setShowTrainModal(true); }}
                  onEquip={() => { setSelectedMember(member); setShowEquipModal(true); }}
                  onToggleActive={() => { }}
                  onDismiss={() => { }}
                />
              ))}
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Membros na Reserva</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGang.members.filter(m => !myGang.activeMemberIds.includes(m.id)).map(member => (
                  <MemberCard key={member.id} member={member} onTrain={() => {}} onEquip={() => {}} onToggleActive={() => {}} onDismiss={() => {}} isReserve />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tesouro */}
        {activeTab === 'treasury' && (
          <div className="bg-gray-900/50 rounded-2xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Doar para o Tesouro da Quadrilha</h2>
            <p className="text-gray-400 mb-6">Doações aumentam a EXP da quadrilha e sua contribuição individual.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => donateToTreasury('dirtyMoney', 10000)} className="bg-red-900/50 hover:bg-red-800/70 p-4 rounded-xl border border-red-500/30">
                Doar R$ 10.000 (Sujo) → +10 EXP
              </button>
              <button onClick={() => donateToTreasury('cleanMoney', 5000)} className="bg-emerald-900/50 hover:bg-emerald-800/70 p-4 rounded-xl border border-emerald-500/30">
                Doar R$ 5.000 (Limpo) → +20 EXP
              </button>
              <button onClick={() => donateToTreasury('corre', 100)} className="bg-cyan-900/50 hover:bg-cyan-800/70 p-4 rounded-xl border border-cyan-500/30">
                Doar 100 Corre → +15 EXP
              </button>
            </div>
          </div>
        )}

        {/* Habilidades da Gang */}
        {activeTab === 'skills' && <GangSkillsPanel />}
      </main>

      <RecruitModal isOpen={showRecruitModal} onClose={() => setShowRecruitModal(false)} />
      {selectedMember && (
        <>
          <TrainModal isOpen={showTrainModal} member={selectedMember} onClose={() => { setShowTrainModal(false); setSelectedMember(null); }} />
          <EquipModal isOpen={showEquipModal} member={selectedMember} onClose={() => { setShowEquipModal(false); setSelectedMember(null); }} />
        </>
      )}
      <Footer />
    </div>
  );
}