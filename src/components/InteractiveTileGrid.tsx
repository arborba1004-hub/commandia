import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchAllPlayers, syncPlayerUpdate } from '@/api/playerApi';

interface Tile {
  id: string;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  isActive: boolean;
  type: 'normal' | 'special' | 'locked';
}

export default function InteractiveTileGrid() {
  const TILE_SIZE = 1; // unidade do mapa (ajustável)

  const [tiles, setTiles] = useState<Tile[]>(() => {
    const grid: Tile[] = [];
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 40; x++) {
        const id = `tile-${x}-${y}`;
        grid.push({
          id,
          x,
          y,
          worldX: x * TILE_SIZE,
          worldY: y * TILE_SIZE,
          isActive: false,
          type: Math.random() > 0.8 ? 'special' : Math.random() > 0.7 ? 'locked' : 'normal',
        });
      }
    }
    return grid;
  });

  const [players, setPlayers] = useState([
    {
      id: 'player-1',
      tileX: 10,
      tileY: 5,
      worldX: 10,
      worldY: 5,
      color: 'bg-cyan-400',
    },
    {
      id: 'player-2',
      tileX: 15,
      tileY: 8,
      worldX: 15,
      worldY: 8,
      color: 'bg-pink-400',
    },
  ]);

  // Carregar dados do servidor ao montar o componente
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const playersData = await fetchAllPlayers();

        if (playersData && playersData.length > 0) {
          setPlayers(prev => {
            const localPlayer = prev.find(p => p.id === 'player-1');

            const serverPlayers = playersData.map((p, index) => ({
              id: String(p.id),
              tileX: p.tileX,
              tileY: p.tileY,
              worldX: p.worldX,
              worldY: p.worldY,
              color: index === 0 ? 'bg-cyan-400' : 'bg-pink-400',
            }));

            return localPlayer
              ? [
                  {
                    ...localPlayer,
                    tileX: serverPlayers[0]?.tileX ?? localPlayer.tileX,
                    tileY: serverPlayers[0]?.tileY ?? localPlayer.tileY,
                    worldX: serverPlayers[0]?.worldX ?? localPlayer.worldX,
                    worldY: serverPlayers[0]?.worldY ?? localPlayer.worldY,
                  },
                  ...serverPlayers.slice(1),
                ]
              : serverPlayers;
          });
        }
      } catch (error) {
        console.error('Erro ao carregar players:', error);
      }
    };

    loadPlayers();
  }, []);

  const handleTileClick = async (tile: Tile) => {
    const updatedPlayer = {
      id: 'player-1',
      tileX: tile.x,
      tileY: tile.y,
      worldX: tile.worldX,
      worldY: tile.worldY,
    };

    // Atualizar UI imediatamente (otimista)
    setPlayers(prev =>
      prev.map(p =>
        p.id === 'player-1'
          ? {
              ...p,
              tileX: tile.x,
              tileY: tile.y,
              worldX: tile.worldX,
              worldY: tile.worldY,
            }
          : p
      )
    );

    // Sincronizar com o servidor
    try {
      await syncPlayerUpdate({
        tileX: tile.x,
        tileY: tile.y,
        worldX: tile.worldX,
        worldY: tile.worldY,
      });
    } catch (error) {
      console.error('Erro ao atualizar posição no servidor:', error);
      // Recarregar dados do servidor em caso de erro
      try {
        const playerData = await fetchCurrentPlayer();
        if (playerData) {
          setPlayers(prev =>
            prev.map(p =>
              p.id === 'player-1'
                ? {
                    ...p,
                    tileX: playerData.tileX ?? p.tileX,
                    tileY: playerData.tileY ?? p.tileY,
                    worldX: playerData.worldX ?? p.worldX,
                    worldY: playerData.worldY ?? p.worldY,
                  }
                : p
            )
          );
        }
      } catch (reloadError) {
        console.error('Erro ao recarregar dados do jogador:', reloadError);
      }
    }
  };

  const getTileColor = (tile: Tile) => {
    if (tile.type === 'locked') return 'bg-red-900/60';
    if (tile.type === 'special') return tile.isActive ? 'bg-yellow-500/80' : 'bg-yellow-600/40';
    return tile.isActive ? 'bg-primary/80' : 'bg-gray-700/40';
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(40, minmax(0, 1fr))' }}>
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            onClick={() => handleTileClick(tile)}
            className={`relative w-12 h-12 rounded-lg border border-white/20 transition-all cursor-pointer ${getTileColor(tile)}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (tile.x + tile.y * 40) * 0.02 }}
          >
            <span className="text-xs text-white font-bold opacity-70">
              {tile.type === 'locked' ? '🔒' : tile.type === 'special' ? '⭐' : ''}
            </span>
            {players
              .filter(p => p.tileX === tile.x && p.tileY === tile.y)
              .map(p => (
                <div key={p.id} className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-4 h-4 rounded-full ${p.color}`} />
                </div>
              ))}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
