import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface GuideSection {
  title: string;
  content: string;
  icon: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Como Desbloquear Talentos',
    icon: '🔓',
    content: `
    1. Atinja o nível necessário para desbloquear um talento
    2. Vá ao menu "Talentos do Crime"
    3. Clique em "Desbloquear" e pague o custo em dinheiro sujo
    4. Alguns talentos (nível 70, 75, 90, 95, 100) são desbloqueados automaticamente
    5. Você receberá uma notificação em gíria ao desbloquear
    `,
  },
  {
    title: 'Evoluindo Talentos',
    icon: '⬆️',
    content: `
    1. Talentos podem ser evoluídos de nível 1 a 5 (exceto alguns especiais)
    2. Cada evolução custa dinheiro sujo:
       - Nível 1→2: 10.000
       - Nível 2→3: 25.000
       - Nível 3→4: 50.000
       - Nível 4→5: 100.000
       - Nível 5→6: 200.000
    3. Quanto maior o nível, maior o efeito do talento
    4. Evolua estrategicamente baseado no seu estilo de jogo
    `,
  },
  {
    title: 'Custos e Economia',
    icon: '💰',
    content: `
    Desbloqueio Inicial:
    - Talentos normais: 10.000 dinheiro sujo
    - Talentos automáticos (70+): 1 real (simbólico)
    
    Evolução:
    - Cada nível custa progressivamente mais
    - Planeje seus gastos com cuidado
    - Priorize talentos que combinam com seu estilo
    
    Dica: Ganhe dinheiro sujo em operações para investir em talentos
    `,
  },
  {
    title: 'Efeitos por Categoria',
    icon: '🎯',
    content: `
    Slot Machine: Aumenta bônus duplo
    Prisão: Reduz tempo e perda de dinheiro
    Lavagem: Acelera processo e aumenta ganhos
    Suborno: Reduz custos
    Fuga: Aumenta velocidade
    Facção: Beneficia membros (apenas líder)
    Habilidades Especiais: Ativam poderes únicos com cooldown
    `,
  },
  {
    title: 'Talentos de Facção',
    icon: '👥',
    content: `
    Alguns talentos só funcionam se você for LÍDER da facção:
    - Networking Sujo (50)
    - Liderança Tóxica (60)
    - Estratégia de Guerra (75)
    - Sombra do Rei (90)
    - Voz da Razão (80)
    
    Dica: Suba na hierarquia para desbloquear esses poderes
    `,
  },
  {
    title: 'Habilidades Especiais',
    icon: '⚡',
    content: `
    Olho Vivo (10): Transforma viatura em dinheiro (1x/dia)
    Intocável (70): Ignora primeira prisão do dia
    Estratégia de Guerra (75): Rouba dinheiro de alvo (1x/semana)
    Sombra do Rei (90): Trava lavagem de adversário (1x/semana)
    
    Dica: Use essas habilidades estrategicamente para vantagem
    `,
  },
  {
    title: 'Coroa Suprema (100)',
    icon: '👑',
    content: `
    O talento final ativa TODOS os efeitos anteriores permanentemente:
    - Todos os bônus funcionam simultaneamente
    - Dobra os ganhos da slot machine
    - Você se torna praticamente imbatível
    
    Objetivo Final: Trabalhe para atingir o nível 100!
    `,
  },
];

export default function TalentSystemGuide() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-black text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-heading text-primary mb-2">
          📚 GUIA DO SISTEMA DE TALENTOS
        </h1>
        <p className="text-gray-400 font-paragraph">
          Aprenda como desbloquear, evoluir e usar os Talentos do Crime para dominar o jogo
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-gray-900 border-primary p-4 text-center">
          <div className="text-3xl mb-2">20</div>
          <div className="text-sm text-gray-400">Talentos Totais</div>
        </Card>
        <Card className="bg-gray-900 border-primary p-4 text-center">
          <div className="text-3xl mb-2">5</div>
          <div className="text-sm text-gray-400">Níveis de Evolução</div>
        </Card>
        <Card className="bg-gray-900 border-primary p-4 text-center">
          <div className="text-3xl mb-2">100</div>
          <div className="text-sm text-gray-400">Nível Máximo</div>
        </Card>
      </div>

      {/* Accordion Guide */}
      <div className="space-y-3">
        {GUIDE_SECTIONS.map((section, index) => (
          <Card
            key={index}
            className="bg-gray-900 border-gray-700 overflow-hidden hover:border-primary transition-colors cursor-pointer"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h3 className="text-lg font-bold text-primary">{section.title}</h3>
              </div>
              {expandedIndex === index ? (
                <ChevronUp className="w-5 h-5 text-primary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>

            {expandedIndex === index && (
              <div className="px-4 pb-4 border-t border-gray-700 pt-4">
                <p className="text-gray-300 whitespace-pre-line font-paragraph text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-primary/20 to-pink-600/20 border-primary p-6 mt-8">
        <h3 className="text-xl font-bold text-primary mb-4">💡 DICAS ESTRATÉGICAS</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>✓ Comece desbloqueando talentos que combinam com seu estilo de jogo</li>
          <li>✓ Priorize talentos que aumentam seus ganhos (Cria Esperto, Carregador Rápido)</li>
          <li>✓ Evolua talentos defensivos se sofre muitas prisões (Fuga na Mão, Pele de Aço)</li>
          <li>✓ Se é líder de facção, invista em talentos de facção para potencializar membros</li>
          <li>✓ Habilidades especiais têm cooldown - use-as estrategicamente</li>
          <li>✓ Trabalhe para atingir o nível 100 e desbloquear a Coroa Suprema</li>
          <li>✓ Combine talentos para efeitos sinérgicos (ex: Lavagem Rápida + Imposto da Quebrada)</li>
        </ul>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Última atualização: Sistema de Talentos v1.0</p>
        <p>Para mais informações, visite o menu "Talentos do Crime"</p>
      </div>
    </div>
  );
}
