/**
 * ⚠️ DEPRECATED - Movement API (LEGACY)
 * 
 * PHASE 9: This file is ISOLATED from the main application flow.
 * 
 * Status: LEGACY - DO NOT USE
 * Reason: Application now uses external backend API for movement operations
 * 
 * This file is preserved for reference only and contains movement API operations
 * using Wix Realtime API.
 * 
 * All active movement operations use the external backend at:
 * - https://comando-backend.onrender.com
 * 
 * If you need to use Wix Realtime for movement in the future:
 * 1. Import from this file
 * 2. Update GamePage.tsx to use these functions
 * 3. Remove backend API calls from GamePage.tsx
 * 
 * DO NOT import this file in active components.
 * 
 * Legacy reference:
 * - Backend file: /src/backend/movementPublisher.jsw
 * - This function connects GamePage.tsx to backend Wix
 * - When you click on the map, this function sends the new position to the backend
 * - The backend then publishes in real-time to all other players
 */

/**
 * ⚠️ DEPRECATED FUNCTION - Do not use
 * 
 * Legacy function for publishing player movement via Wix Realtime
 * This function is preserved for reference only.
 * 
 * Parameters:
 * - playerId: Player's unique ID
 * - playerName: Player's name in the game
 * - tileX: X position (column) where you clicked
 * - tileY: Y position (row) where you clicked
 * 
 * @deprecated Use external backend API instead
 */
export async function publishPlayerMovement(data: {
  playerId: string;
  playerName: string;
  tileX: number;
  tileY: number;
}) {
  try {
    // 📡 LEGACY: This would call the Wix backend function
    // Legacy backend file: /src/backend/movementPublisher.jsw
    // Currently NOT USED - preserved for reference only
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
 * ⚠️ DEPRECATED FUNCTION - Do not use
 * 
 * Legacy function for publishing multiple player movements via Wix Realtime
 * This function is preserved for reference only.
 * 
 * @deprecated Use external backend API instead
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
