export type WorldPlayer = {
  id: string;

  tileX: number;
  tileY: number;

  targetTileX: number;
  targetTileY: number;

  lastServerUpdate: number;
  lastSocketUpdate: number;

  barracoLevel?: number;
  power?: number;
};

export class MMOWorldEngine {
  private players = new Map<string, WorldPlayer>();

  // 📦 Snapshot (autoridade do servidor)
  upsertSnapshot(players: any[]) {
    for (const p of players) {
      const existing = this.players.get(p.id);

      this.players.set(p.id, {
        id: p.id,

        tileX: p.tileX,
        tileY: p.tileY,

        targetTileX: p.tileX,
        targetTileY: p.tileY,

        lastServerUpdate: Date.now(),
        lastSocketUpdate: existing?.lastSocketUpdate ?? 0,

        barracoLevel: p.barracoLevel,
        power: p.power,
      });
    }
  }

  // ⚡ Socket (tempo real)
  applySocketMove(data: {
    playerId: string;
    tileX: number;
    tileY: number;
  }) {
    const p = this.players.get(data.playerId);
    if (!p) return;

    p.targetTileX = data.tileX;
    p.targetTileY = data.tileY;

    p.lastSocketUpdate = Date.now();
  }

  // 🎯 Interpolação (o segredo do MMO suave)
  tickLerp(alpha = 0.18) {
    for (const p of this.players.values()) {
      p.tileX += (p.targetTileX - p.tileX) * alpha;
      p.tileY += (p.targetTileY - p.tileY) * alpha;
    }
  }

  getPlayers() {
    return Array.from(this.players.values());
  }
}