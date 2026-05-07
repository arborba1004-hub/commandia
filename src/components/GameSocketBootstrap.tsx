import { useGameSocket } from '@/hooks/useGameSocket';

export default function GameSocketBootstrap() {
  useGameSocket();
  return null;
}
