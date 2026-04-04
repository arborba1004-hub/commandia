import { useState } from 'react';
import { motion } from 'framer-motion';

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

  const handleTileClick = (id: string) => {
    setTiles(tiles.map(tile =>
      tile.id === id ? { ...tile, isActive: !tile.isActive } : tile
    ));
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
            onClick={() => handleTileClick(tile.id)}
            className={`w-12 h-12 rounded-lg border border-white/20 transition-all cursor-pointer ${getTileColor(tile)}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (tile.x + tile.y * 40) * 0.02 }}
          >
            <span className="text-xs text-white font-bold opacity-70">
              {tile.type === 'locked' ? '🔒' : tile.type === 'special' ? '⭐' : ''}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
