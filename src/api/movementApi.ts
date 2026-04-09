/**
 * 🎮 API DE MOVIMENTOS - FRONTEND
 * 
 * Este arquivo conecta o GamePage.tsx ao backend Wix
 * Quando você clica no mapa, esta função envia a nova posição para o backend
 * que depois publica em tempo real para todos os outros jogadores
 */

/**
 * 🚀 FUNÇÃO: Publicar movimento do jogador
 * 
 * Chamada quando você clica no mapa e se move
 * 
 * Parâmetros:
 * - playerId: Seu ID único
 * - playerName: Seu nome no jogo
 * - tileX: Posição X (coluna) onde você clicou
 * - tileY: Posição Y (linha) onde você clicou
 */
export async function publishPlayerMovement(data: {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
}) {
  try {
    // 📡 Chamar a função backend que criamos
    // Esta função está em: /src/backend/movementPublisher.jsw
    const response = await fetch('/api/movement/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Movimento publicado com sucesso:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao publicar movimento:', error);
    // Não lançar erro para não quebrar o jogo
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * 🎯 FUNÇÃO AUXILIAR: Publicar múltiplos movimentos
 * 
 * Use se vários jogadores se movem ao mesmo tempo
 */
export async function publishMultipleMovements(movements: Array<{
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
}>) {
  try {
    const response = await fetch('/api/movement/publish-multiple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movements }),
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Múltiplos movimentos publicados:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao publicar múltiplos movimentos:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}
