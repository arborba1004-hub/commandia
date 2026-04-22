export type GangMemberType =
  | 'capanga'
  | 'frente'
  | 'executor'
  | 'assassino'
  | 'muralha'
  | 'certeiro'
  | 'motorista'
  | 'nitro';

export type GangMemberRole =
  | 'interceptacao'
  | 'corpo_a_corpo'
  | 'longo_alcance'
  | 'explosao'
  | 'tanque'
  | 'suporte_distancia'
  | 'blindado'
  | 'resistencia_pesada';

export type GangMemberLevelDefinition = {
  nivel: number;
  requiredBarracoLevel: number;
  titulo: string;
  resumo: string;
};

export type GangMemberComandoDefinition = {
  requiredBarracoLevel: number;
  titulo: string;
  resumo: string;
};

export type GangMemberDefinition = {
  id: GangMemberType;
  nome: string;
  descricao: string;
  role: GangMemberRole;
  niveis: GangMemberLevelDefinition[];
  comando: GangMemberComandoDefinition;
};

export const GANG_MEMBER_LEVEL_UNLOCKS = {
  1: 1,
  2: 10,
  3: 20,
  4: 30,
  5: 40,
  6: 50,
  7: 60,
  8: 70,
  9: 80,
  10: 90,
} as const;

export const GANG_COMANDO_UNLOCK_LEVEL = 100;

export const GANG_MEMBROS: Record<GangMemberType, GangMemberDefinition> = {
  capanga: {
    id: 'capanga',
    nome: 'Capanga',
    descricao: 'Rápidos, absorvem ataques iniciais',
    role: 'interceptacao',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Capanga 1',
        resumo: 'Velocidade básica, absorção leve',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Capanga 2',
        resumo: 'Resistência maior contra ataques iniciais',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Capanga 3',
        resumo: 'Interceptam ataques antes de atingir tropas principais',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Capanga 4',
        resumo: 'Defesa reforçada, sustentam mais tempo',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Capanga 5',
        resumo: 'Ganho de esquiva, reduzem chance de acerto',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Capanga 6',
        resumo: 'Velocidade aumentada, atingem alvos frágeis primeiro',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Capanga 7',
        resumo: 'Elite defensiva rápida, absorvem ataques com eficácia',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Capanga 8',
        resumo: 'Resistência máxima contra ofensivas rápidas',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Capanga 9',
        resumo: 'Capangas de elite, interceptação quase perfeita',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Capanga 10',
        resumo: 'Defesa suprema, absorvem dano massivo',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Capanga do Comando',
      resumo: 'Lideram a linha inicial com coordenação total',
    },
  },

  frente: {
    id: 'frente',
    nome: 'Frente',
    descricao: 'Combatentes corpo a corpo',
    role: 'corpo_a_corpo',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Frente 1',
        resumo: 'Ataque básico, dano moderado',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Frente 2',
        resumo: 'Força física maior',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Frente 3',
        resumo: 'Impacto em linha de frente',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Frente 4',
        resumo: 'Penetração de defesa inicial',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Frente 5',
        resumo: 'Ataque em área limitado',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Frente 6',
        resumo: 'Dano elevado contra tanques',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Frente 7',
        resumo: 'Ataque em área ampliado',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Frente 8',
        resumo: 'Combatentes de elite, altíssimo dano',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Frente 9',
        resumo: 'Força devastadora corpo a corpo',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Frente 10',
        resumo: 'Supremacia em combate físico',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Frente do Comando',
      resumo: 'Lideram ofensiva coordenada',
    },
  },

  executor: {
    id: 'executor',
    nome: 'Executor',
    descricao: 'Ataque de longo alcance, precisão',
    role: 'longo_alcance',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Executor 1',
        resumo: 'Alcance básico, precisão moderada',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Executor 2',
        resumo: 'Maior alcance, melhor taxa de acerto',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Executor 3',
        resumo: 'Ignoram parte da defesa inimiga',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Executor 4',
        resumo: 'Crítico aumentado',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Executor 5',
        resumo: 'Chance de eliminar alvos frágeis',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Executor 6',
        resumo: 'Snipers intermediários',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Executor 7',
        resumo: 'Alta precisão e dano crítico',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Executor 8',
        resumo: 'Snipers de elite',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Executor 9',
        resumo: 'Precisão quase perfeita',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Executor 10',
        resumo: 'Supremacia em longo alcance',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Executor do Comando',
      resumo: 'Coordenação de fogo preciso',
    },
  },

  assassino: {
    id: 'assassino',
    nome: 'Assassino',
    descricao: 'Velocidade e alto dano',
    role: 'explosao',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Assassino 1',
        resumo: 'Ataque veloz, dano moderado',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Assassino 2',
        resumo: 'Maior velocidade',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Assassino 3',
        resumo: 'Foco em alvos prioritários',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Assassino 4',
        resumo: 'Bônus de crítico',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Assassino 5',
        resumo: 'Ataques letais',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Assassino 6',
        resumo: 'Ignoram parte da defesa',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Assassino 7',
        resumo: 'Foco em líderes inimigos',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Assassino 8',
        resumo: 'Assassinos de elite',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Assassino 9',
        resumo: 'Altíssimo dano explosivo',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Assassino 10',
        resumo: 'Supremacia em ataques rápidos',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Assassino do Comando',
      resumo: 'Execução coordenada',
    },
  },

  muralha: {
    id: 'muralha',
    nome: 'Muralha',
    descricao: 'Tanques defensivos',
    role: 'tanque',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Muralha 1',
        resumo: 'Absorvem pouco dano',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Muralha 2',
        resumo: 'Resistência aumentada',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Muralha 3',
        resumo: 'Protegem tropas atrás',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Muralha 4',
        resumo: 'Defesa contra ataques em área',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Muralha 5',
        resumo: 'Regeneração lenta',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Muralha 6',
        resumo: 'Sustentam batalhas longas',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Muralha 7',
        resumo: 'Muralhas de elite',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Muralha 8',
        resumo: 'Absorvem dano massivo',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Muralha 9',
        resumo: 'Defesa quase impenetrável',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Muralha 10',
        resumo: 'Supremacia defensiva',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Muralha do Comando',
      resumo: 'Barreira máxima',
    },
  },

  certeiro: {
    id: 'certeiro',
    nome: 'Certeiro',
    descricao: 'Atiradores defensivos',
    role: 'suporte_distancia',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Certeiro 1',
        resumo: 'Ataque à distância básico',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Certeiro 2',
        resumo: 'Maior alcance',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Certeiro 3',
        resumo: 'Suporte defensivo',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Certeiro 4',
        resumo: 'Precisão contra tropas rápidas',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Certeiro 5',
        resumo: 'Dano consistente',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Certeiro 6',
        resumo: 'Atiradores intermediários',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Certeiro 7',
        resumo: 'Dano elevado contra tanques',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Certeiro 8',
        resumo: 'Atiradores de elite',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Certeiro 9',
        resumo: 'Fogo constante',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Certeiro 10',
        resumo: 'Supremacia em suporte',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Certeiro do Comando',
      resumo: 'Coordenação de fogo defensivo',
    },
  },

  motorista: {
    id: 'motorista',
    nome: 'Motorista',
    descricao: 'Blindados defensivos',
    role: 'blindado',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Motorista 1',
        resumo: 'Veículos básicos',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Motorista 2',
        resumo: 'Blindagem reforçada',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Motorista 3',
        resumo: 'Protegem tropas frágeis',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Motorista 4',
        resumo: 'Resistência contra explosivos',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Motorista 5',
        resumo: 'Bloqueio de avanço inimigo',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Motorista 6',
        resumo: 'Blindagem quase impenetrável',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Motorista 7',
        resumo: 'Motoristas de elite',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Motorista 8',
        resumo: 'Defesa máxima',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Motorista 9',
        resumo: 'Supremacia blindada',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Motorista 10',
        resumo: 'Proteção total',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Motorista do Comando',
      resumo: 'Coordenação blindada',
    },
  },

  nitro: {
    id: 'nitro',
    nome: 'Nitro',
    descricao: 'Absorvem dano pesado',
    role: 'resistencia_pesada',
    niveis: [
      {
        nivel: 1,
        requiredBarracoLevel: 1,
        titulo: 'Nitro 1',
        resumo: 'Resistência básica',
      },
      {
        nivel: 2,
        requiredBarracoLevel: 10,
        titulo: 'Nitro 2',
        resumo: 'Blindagem reforçada',
      },
      {
        nivel: 3,
        requiredBarracoLevel: 20,
        titulo: 'Nitro 3',
        resumo: 'Sustentam mais tempo',
      },
      {
        nivel: 4,
        requiredBarracoLevel: 30,
        titulo: 'Nitro 4',
        resumo: 'Absorvem ataques em área',
      },
      {
        nivel: 5,
        requiredBarracoLevel: 40,
        titulo: 'Nitro 5',
        resumo: 'Resistência máxima contra ofensivas rápidas',
      },
      {
        nivel: 6,
        requiredBarracoLevel: 50,
        titulo: 'Nitro 6',
        resumo: 'Nitro intermediário',
      },
      {
        nivel: 7,
        requiredBarracoLevel: 60,
        titulo: 'Nitro 7',
        resumo: 'Absorvem dano massivo',
      },
      {
        nivel: 8,
        requiredBarracoLevel: 70,
        titulo: 'Nitro 8',
        resumo: 'Linha intacta',
      },
      {
        nivel: 9,
        requiredBarracoLevel: 80,
        titulo: 'Nitro 9',
        resumo: 'Supremacia defensiva explosiva',
      },
      {
        nivel: 10,
        requiredBarracoLevel: 90,
        titulo: 'Nitro 10',
        resumo: 'Defesa suprema',
      },
    ],
    comando: {
      requiredBarracoLevel: 100,
      titulo: 'Nitro do Comando',
      resumo: 'Explosão coordenada de resistência',
    },
  },
};

export function getGangMemberDefinition(memberType: GangMemberType) {
  return GANG_MEMBROS[memberType];
}

export function getGangMemberLevelDefinition(
  memberType: GangMemberType,
  nivel: number
) {
  return GANG_MEMBROS[memberType].niveis.find((item) => item.nivel === nivel) ?? null;
}

export function getGangMemberMaxNivelByBarracoLevel(barracoLevel: number) {
  const numericBarracoLevel = Number(barracoLevel || 0);

  if (numericBarracoLevel >= GANG_COMANDO_UNLOCK_LEVEL) {
    return 10;
  }

  let maxNivel = 1;

  for (const [nivel, requiredBarracoLevel] of Object.entries(GANG_MEMBER_LEVEL_UNLOCKS)) {
    if (numericBarracoLevel >= requiredBarracoLevel) {
      maxNivel = Number(nivel);
    }
  }

  return maxNivel;
}

export function isGangMemberComandoUnlocked(barracoLevel: number) {
  return Number(barracoLevel || 0) >= GANG_COMANDO_UNLOCK_LEVEL;
}

export default GANG_MEMBROS;