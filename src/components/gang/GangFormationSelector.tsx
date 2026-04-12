import { motion } from 'framer-motion';
import { useGangBattleStore } from '@/stores/gangBattleStore';

const formations = [
  {
    id: 'offensive',
    label: 'OFENSIVA',
    icon: '⚔️',
    bonus: '+20% ataque, -10% defesa',
    activeClass: 'bg-gradient-to-r from-red-600 to-orange-600 border-white shadow-lg shadow-red-500/40',
  },
  {
    id: 'defensive',
    label: 'DEFENSIVA',
    icon: '🛡️',
    bonus: '+25% defesa, -10