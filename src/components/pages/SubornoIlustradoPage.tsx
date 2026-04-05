import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import SafeVaultModal from '@/components/SafeVaultModal';
import { getRandomPunishment, applyPunishment, applyDelacaoPremiada } from '@/Services/punishmentService';

interface Authority {
  id: number;
  name: string;
  levelRange: string;
  dialog: string;
  image: string;
}

interface Punishment {
  id: string;
  name: string;
  description: string;
  duration: number;
}

const AUTHORITIES: Authority[] = [
  {
    id: 1,
    name: 'Policial de Rua',
    levelRange: 'Nível 1-9',
    dialog: 'Ó, ó... Vejo que você está crescendo no negócio. Que tal a gente fazer um acordo? Uns trocadinhos por mês e você fica tranquilo na rua.',
    image: 'https://static.wixstatic.com/media/50f4bf_00a9833753ba439e9ce44a240849e58c~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 2,
    name: 'Investigador',
    levelRange: 'Nível 10-19',
    dialog: 'Tenho uns arquivos interessantes sobre você aqui... Mas podemos resolver isso de forma amigável, não é?',
    image: 'https://static.wixstatic.com/media/50f4bf_b6d2cbc82982409e8bee2bde3e903d05~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 3,
    name: 'Delegado',
    levelRange: 'Nível 20-29',
    dialog: 'Ouvi falar que você está ficando importante por aqui. Seria uma pena se algo acontecesse... Vamos conversar?',
    image: 'https://static.wixstatic.com/media/50f4bf_9eedab2008d440bea7e846e4edf63343~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 4,
    name: 'Prefeito',
    levelRange: 'Nível 30-39',
    dialog: 'Você é um empreendedor, eu respeito isso. Mas aqui na cidade, todo negócio precisa de... uma contribuição política.',
    image: 'https://static.wixstatic.com/media/50f4bf_f133ddeab16e496da0edb91ba54ffa73~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 5,
    name: 'Capitão da Polícia',
    levelRange: 'Nível 40-49',
    dialog: 'Você chegou longe. Muito longe. Mas sabe como é, na corporação temos despesas... Você entende.',
    image: 'https://static.wixstatic.com/media/50f4bf_1369046e82774cd98f5d50ad9dfbdb0a~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 6,
    name: 'Secretário de Segurança',
    levelRange: 'Nível 50-59',
    dialog: 'Sua operação é impressionante. Seria uma pena perder tudo por falta de... proteção adequada.',
    image: 'https://static.wixstatic.com/media/50f4bf_ee97ae291e714517bfe2bb404998ea6a~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 7,
    name: 'Delegado Federal',
    levelRange: 'Nível 60-69',
    dialog: 'Você chamou atenção de gente importante. Muito importante. Vamos resolver isso discretamente?',
    image: 'https://static.wixstatic.com/media/50f4bf_2e11993941944c70a5d8464b1c6418b9~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 8,
    name: 'Governador',
    levelRange: 'Nível 70-79',
    dialog: 'Você é praticamente um rei nessa região. Mas até reis precisam de... acordos com a coroa.',
    image: 'https://static.wixstatic.com/media/50f4bf_e0e6b8cb4bf541bbbdfda06b834313a5~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 9,
    name: 'Juiz Federal',
    levelRange: 'Nível 80-89',
    dialog: 'Seus crimes estão documentados. Todos eles. Mas a justiça pode ser... flexível, dependendo da situação.',
    image: 'https://static.wixstatic.com/media/50f4bf_915574f5d1ca42c9b7f81066d054bf53~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 10,
    name: 'Ministro',
    levelRange: 'Nível 90-99',
    dialog: 'Você se tornou uma lenda. Mas até lendas precisam de proteção no topo. E eu sou o topo.',
    image: 'https://static.wixstatic.com/media/50f4bf_c92fe851d34a4d4498e852ae17d90858~mv2.png?originWidth=384&originHeight=384',
  },
  {
    id: 11,
    name: 'Presidente',
    levelRange: 'Nível 100',
    dialog: 'Você chegou ao topo. Impressionante. Agora, vamos fazer grandes coisas juntos... ou você quer tentar me derrotar? Que ingenuidade.',
    image: 'https://static.wixstatic.com/media/50f4bf_402259b701d545678f7a5cd11d47c2a4~mv2.png?originWidth=384&originHeight=384',
  },
];

const PUNISHMENTS: Punishment[] = [
  {
    id: 'fiscal',
    name: 'Operação Fiscal',
    description: 'Operação fiscal no centro comercial do Complexo. Você não pode lavar dinheiro por 24 horas.',
    duration: 24,
  },
  {
    id: 'arsenal',
    name: 'Invasão no Arsenal',
    description: 'Invasão surpresa no Arsenal! 5 armas aleatórias foram danificadas. Você perde os bônus delas por 24 horas.',
    duration: 24,
  },
  {
    id: 'militia',
    name: 'Visita da Milícia',
    description: 'Visita surpresa da milícia! 5 itens de luxo foram confiscados. Você perde os bônus deles por 24 horas (mesmo com seguro).',
    duration: 24,
  },
  {
    id: 'blitz',
    name: 'Blitz Surpresa',
    description: 'Blitz "surpresa"! Seu último veículo de fuga foi rebocado. Você perdeu o veículo e precisa comprar outro.',
    duration: 0,
  },
  {
    id: 'threat',
    name: 'Ameaça de Morte',
    description: 'Ameaça de morte! Você não pode fazer giro no asfalto por 24 horas. Não é seguro sair de casa.',
    duration: 24,
  },
];

export default function SubornoIlustradoPage() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayerStore();
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [subornoValue, setSubornoValue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const barrackLevel = player?.niveis?.barracoLevel || 1;

  // Determinar autoridade baseado no nível do barraco
  useEffect(() => {
    const authority = getAuthorityByLevel(barrackLevel);
    setSelectedAuthority(authority);
    setSubornoValue(calculateSubornoValue(barrackLevel));
  }, [barrackLevel]);

  const getAuthorityByLevel = (level: number): Authority => {
    if (level <= 9) return AUTHORITIES[0];
    if (level <= 19) return AUTHORITIES[1];
    if (level <= 29) return AUTHORITIES[2];
    if (level <= 39) return AUTHORITIES[3];
    if (level <= 49) return AUTHORITIES[4];
    if (level <= 59) return AUTHORITIES[5];
    if (level <= 69) return AUTHORITIES[6];
    if (level <= 79) return AUTHORITIES[7];
    if (level <= 89) return AUTHORITIES[8];
    if (level <= 99) return AUTHORITIES[9];

    if (level >= 100 && level < 109) {
      return {
        ...AUTHORITIES[10],
        dialog: 'Você ainda não tem poder suficiente para falar comigo. Volte quando dominar tudo.',
      };
    }

    return AUTHORITIES[10]; // Presidente
  };

  const calculateSubornoValue = (level: number): number => {
    return Math.floor(220 * Math.pow(1.1, level - 1));
  };

  const handlePaySuborno = async () => {
    setIsProcessing(true);

    try {
      if (player.balances.dirtyMoney < subornoValue) {
        setResultMessage('Você não tem dinheiro sujo suficiente!');
        setShowResult(true);
        return;
      }

      // Debita dinheiro sujo
      const newDirtyMoney = player.balances.dirtyMoney - subornoValue;

      // Se for presidente, atinge nível máximo
      if (barrackLevel === 100) {
        setResultMessage('Você atingiu o nível máximo do jogo! Parabéns, você é agora o rei do crime!');
        setPlayer({
          balances: {
            ...player.balances,
            dirtyMoney: newDirtyMoney,
          },
          niveis: {
            ...player.niveis,
            barracoLevel: 100,
          },
        });
      } else {
        // Avança para próximo nível e adiciona 1% em habilidade aleatória
        const newLevel = barrackLevel + 1;
        const skills = { ...(player.skills || {}) };

        const SKILLS = ['attack', 'defense', 'agility', 'intelligence', 'respect', 'vigor'];
        const randomSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
        skills[randomSkill] = (skills[randomSkill] || 0) + 1;

        setResultMessage(`Suborno pago! Você avançou para o nível ${newLevel}. Sua habilidade aumentou em 1%.`);
        setPlayer({
          balances: {
            ...player.balances,
            dirtyMoney: newDirtyMoney,
          },
          niveis: {
            ...player.niveis,
            barracoLevel: newLevel,
          },
          skills,
        });
      }

      setShowVaultModal(false);
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDenounce = async () => {
    setIsProcessing(true);

    try {
      if (barrackLevel === 100) {
        // Delação premiada - aplica bloqueio de 72h
        const updated = applyDelacaoPremiada(player);
        setResultMessage(
          'DELAÇÃO PREMIADA ACEITA!\n\nVocê fez a coisa certa.\n\nSeus bens foram bloqueados por 72 horas, seu inventário perdeu os bônus temporariamente e seu dinheiro ficou indisponível.\n\nDurante esse período, você ficará sob proteção da Polícia Federal.\n\nAo final, receberá +100% em todas as habilidades.'
        );
        setPlayer(updated);
      } else {
        // Punição aleatória - aplica punição de 24h
        const type = getRandomPunishment();
        const updated = applyPunishment(player, type);
        
        setResultMessage(
          `Então você pensou que podia me denunciar e ficar por isso mesmo?\n\nPunição aplicada por 24 horas!\n\nMas você avançou para o nível ${barrackLevel + 1}!`
        );

        // Avança nível mesmo assim
        const newLevel = barrackLevel + 1;
        const skills = { ...(updated.skills || {}) };

        const SKILLS = ['attack', 'defense', 'agility', 'intelligence', 'respect', 'vigor'];
        const randomSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
        skills[randomSkill] = (skills[randomSkill] || 0) + 1;

        setPlayer({
          ...updated,
          niveis: {
            ...updated.niveis,
            barracoLevel: newLevel,
          },
          skills,
        });
      }

      setShowVaultModal(false);
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <Header />

      {/* BACKGROUND CINEMÁTICO AAA */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.7)_0%,rgba(20,20,20,0.95)_100%)]" />
      <div className="absolute inset-0 z-0 opacity-10 bg-[repeating-linear-gradient(45deg,#111_0px,#111_4px,transparent_4px,transparent_12px)]" />

      <main className="flex-1 max-w-[100rem] mx-auto w-full px-4 py-12 relative z-10">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 bg-red-950/70 text-red-400 text-xs font-black tracking-[0.25em] px-8 py-3 rounded-3xl border border-red-400/30 mb-6 shadow-inner">
            ⚠️ SUBORNO ILUSTRADO
          </div>
          <h1 className="font-heading text-7xl md:text-8xl tracking-[-0.04em] drop-shadow-[0_10px_40px_rgba(0,255,80,0.4)]">
            SUBORNO
          </h1>
          <p className="font-paragraph text-3xl text-emerald-400 font-bold mt-2">
            Nível do Barraco: <span className="text-white">{barrackLevel}</span>
          </p>
          <p className="font-paragraph text-xl text-gray-400 mt-1 flex items-center justify-center gap-2">
            <span>Dinheiro Sujo:</span>
            <span className="text-emerald-400 font-bold text-3xl">R$ {player.balances.dirtyMoney?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {selectedAuthority && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-black/60 backdrop-blur-2xl border border-emerald-400/20 rounded-3xl p-8 md:p-12 shadow-[0_0_120px_-20px_rgba(0,255,80,0.5)]">
            
            {/* IMAGEM DA AUTORIDADE - ESTILO PREMIUM AAA */}
            <div className="flex justify-center">
              <div className="relative group w-full max-w-md">
                {/* GLOW EXTERNO */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/30 to-transparent rounded-3xl blur-3xl opacity-70 group-hover:opacity-100 transition-all duration-500" />
                
                <div className="relative bg-gray-950 border-4 border-emerald-500/70 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,255,80,0.6)]">
                  {/* VINHETA INTERNA */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,transparent_70%)] z-10 pointer-events-none" />
                  
                  <Image
                    src={selectedAuthority.image}
                    alt={selectedAuthority.name}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* OVERLAY DE "OFICIAL" */}
                  <div className="absolute bottom-6 left-6 bg-black/70 text-emerald-400 text-xs font-black tracking-widest px-5 py-1.5 rounded-2xl border border-emerald-400/40 backdrop-blur-md">
                    AUTORIDADE
                  </div>
                </div>
              </div>
            </div>

            {/* INFORMAÇÕES DA AUTORIDADE - LAYOUT AAA */}
            <div className="space-y-10">
              <div>
                <h2 className="font-heading text-5xl md:text-6xl tracking-[-0.03em] text-white drop-shadow-lg">
                  {selectedAuthority.name}
                </h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                  <p className="text-emerald-400 font-medium text-xl px-6 py-1 bg-emerald-950/60 border border-emerald-400/30 rounded-3xl">
                    {selectedAuthority.levelRange}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                </div>
              </div>

              {/* QUOTE PREMIUM */}
              <div className="relative bg-black/80 border border-emerald-400/30 rounded-3xl p-8 shadow-inner">
                <div className="absolute -left-1 -top-4 text-8xl text-emerald-400/20 leading-none">"</div>
                <p className="font-paragraph text-2xl italic text-gray-200 leading-relaxed pl-8">
                  {selectedAuthority.dialog}
                </p>
                <div className="absolute -right-1 -bottom-6 text-8xl text-emerald-400/20 leading-none rotate-180">"</div>
              </div>

              {/* VALOR DO SUBORNO - DISPLAY COFRE AAA */}
              <div className="bg-gradient-to-br from-emerald-950 to-black border border-emerald-400/60 rounded-3xl p-8 flex items-center justify-between shadow-[inset_0_0_60px_rgba(0,255,80,0.2)]">
                <div>
                  <p className="text-emerald-400/70 text-sm font-medium tracking-widest">VALOR EXIGIDO</p>
                  <p className="font-heading text-6xl text-emerald-400 tracking-tighter">
                    R$ {subornoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-7xl">💰</div>
              </div>

              {/* BOTÕES - ESTILO COFRE PREMIUM */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setShowVaultModal(true)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-heading text-2xl py-8 rounded-3xl shadow-[0_0_60px_rgba(0,255,80,0.7)] hover:shadow-[0_0_90px_rgba(0,255,80,1)] transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
                  disabled={isProcessing}
                >
                  <span className="text-4xl">🔐</span>
                  {isProcessing ? 'ABRINDO COFRE...' : 'PAGAR SUBORNO'}
                </Button>

                <Button
                  onClick={() => {
                    if (barrackLevel === 100) {
                      navigate('/delacao-premiada');
                    } else {
                      handleDenounce();
                    }
                  }}
                  className="flex-1 bg-destructive hover:bg-destructive/80 text-white font-heading text-lg py-6"
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? 'Processando...'
                    : barrackLevel === 100
                    ? 'Delação Premiada'
                    : 'Denunciar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Safe Vault Modal - IMAGEM INTERNA COM DINHEIRO PERMANECE INALTERADA */}
      <SafeVaultModal
        open={showVaultModal}
        onOpenChange={setShowVaultModal}
        subornoValue={subornoValue}
        playerDirtyMoney={player.balances.dirtyMoney}
        onConfirm={handlePaySuborno}
        isProcessing={isProcessing}
      />

      {/* Resultado */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="bg-gray-900 border-emerald-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl text-center">Resultado da Operação</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="font-paragraph text-xl whitespace-pre-line text-gray-200 leading-relaxed">{resultMessage}</p>
          </div>
          <Button
            onClick={handleCloseResult}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading text-xl py-7 rounded-3xl"
          >
            VOLTAR AO JOGO
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
