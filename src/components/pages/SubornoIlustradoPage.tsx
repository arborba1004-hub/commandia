import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';

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

function SubornoIlustradoPage() {
  const { player, updatePlayer } = usePlayerStore();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [subornoValue, setSubornoValue] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [showResult, setShowResult] = useState(false);

  const barrackLevel = player?.barrackLevel || 1;

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
    return AUTHORITIES[10]; // Presidente
  };

  const calculateSubornoValue = (level: number): number => {
    return Math.floor(220 * Math.pow(1.1, level - 1));
  };

  const handlePaySuborno = async () => {
    setIsProcessing(true);

    if (player.dirtyMoney < subornoValue) {
      setResultMessage('Você não tem dinheiro sujo suficiente!');
      setShowResult(true);
      setIsProcessing(false);
      return;
    }

    // Debita dinheiro sujo
    const newDirtyMoney = player.dirtyMoney - subornoValue;

    // Se for presidente, atinge nível máximo
    if (barrackLevel === 100) {
      setResultMessage('Você atingiu o nível máximo do jogo! Parabéns, você é agora o rei do crime!');
      updatePlayer({
        dirtyMoney: newDirtyMoney,
        barrackLevel: 100,
      });
    } else {
      // Avança para próximo nível e adiciona 1% em habilidade aleatória
      const newLevel = barrackLevel + 1;
      const skills = player.skills || {};
      const randomSkill = Object.keys(skills)[Math.floor(Math.random() * Object.keys(skills).length)];

      if (randomSkill) {
        skills[randomSkill] = (skills[randomSkill] || 0) + 1;
      }

      setResultMessage(`Suborno pago! Você avançou para o nível ${newLevel}. Sua habilidade aumentou em 1%.`);
      updatePlayer({
        dirtyMoney: newDirtyMoney,
        barrackLevel: newLevel,
        skills,
      });
    }

    setShowDialog(false);
    setShowResult(true);
    setIsProcessing(false);
  };

  const handleDenounce = async () => {
    setIsProcessing(true);

    if (barrackLevel === 100) {
      // Delação premiada - reseta tudo
      setResultMessage(
        'DELAÇÃO PREMIADA ACEITA!\n\nVocê fez a coisa certa... mas o preço a pagar é perder o que nunca foi seu.\n\nSeu status, progresso e itens foram completamente resetados.'
      );
      updatePlayer({
        barrackLevel: 1,
        dirtyMoney: 0,
        skills: {},
        inventory: [],
        vehicles: [],
      });
    } else {
      // Punição aleatória
      const randomPunishment = PUNISHMENTS[Math.floor(Math.random() * PUNISHMENTS.length)];
      setResultMessage(
        `DENÚNCIA ACEITA!\n\n${randomPunishment.name}\n${randomPunishment.description}\n\nMas você avançou para o nível ${barrackLevel + 1}!`
      );

      // Avança nível mesmo assim
      const newLevel = barrackLevel + 1;
      const skills = player.skills || {};
      const randomSkill = Object.keys(skills)[Math.floor(Math.random() * Object.keys(skills).length)];

      if (randomSkill) {
        skills[randomSkill] = (skills[randomSkill] || 0) + 1;
      }

      updatePlayer({
        barrackLevel: newLevel,
        skills,
      });
    }

    setShowDialog(false);
    setShowResult(true);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-[100rem] mx-auto w-full px-4 py-12">
        <div className="mb-12">
          <h1 className="font-heading text-6xl mb-4">Suborno Ilustrado</h1>
          <p className="font-paragraph text-xl text-gray-300">
            Nível do Barraco: <span className="text-primary font-bold">{barrackLevel}</span>
          </p>
          <p className="font-paragraph text-lg text-gray-400">
            Dinheiro Sujo: <span className="text-primary font-bold">R$ {player.dirtyMoney?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </p>
        </div>

        {selectedAuthority && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Imagem da Autoridade */}
            <div className="flex justify-center">
              <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg overflow-hidden border-2 border-primary">
                <Image
                  src={selectedAuthority.image}
                  alt={selectedAuthority.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Informações da Autoridade */}
            <div className="space-y-8">
              <div>
                <h2 className="font-heading text-4xl mb-2">{selectedAuthority.name}</h2>
                <p className="text-primary text-lg">{selectedAuthority.levelRange}</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg border border-primary/30">
                <p className="font-paragraph text-lg italic text-gray-200">"{selectedAuthority.dialog}"</p>
              </div>

              <div className="bg-gray-900 p-6 rounded-lg border border-primary/30">
                <p className="text-gray-400 mb-2">Valor do Suborno:</p>
                <p className="font-heading text-3xl text-primary">R$ {subornoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowDialog(true)}
                  className="flex-1 bg-primary hover:bg-primary/80 text-black font-heading text-lg py-6"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Pagar Suborno'}
                </Button>
                <Button
                  onClick={handleDenounce}
                  className="flex-1 bg-destructive hover:bg-destructive/80 text-white font-heading text-lg py-6"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : 'Denunciar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Confirmação de Pagamento */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-900 border-primary">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Confirmar Pagamento</DialogTitle>
            <DialogDescription className="text-gray-300">
              Você está prestes a pagar R$ {subornoValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para {selectedAuthority?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-6">
            <Button
              onClick={() => setShowDialog(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePaySuborno}
              className="flex-1 bg-primary hover:bg-primary/80 text-black font-heading"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resultado */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="bg-gray-900 border-primary">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Resultado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="font-paragraph text-lg whitespace-pre-line text-gray-200">{resultMessage}</p>
          </div>
          <Button
            onClick={() => setShowResult(false)}
            className="w-full bg-primary hover:bg-primary/80 text-black font-heading"
          >
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubornoIlustradoPage;
