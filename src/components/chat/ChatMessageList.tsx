// src/components/chat/ChatMessageList.tsx (PARTE 1)
import { useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import { motion } from 'framer-motion';
import { Crown, Shield, Skull, User, Mail } from 'lucide-react';

export default function ChatMessageList() {
  const { activeChannel, complexoMessages, faccaoMessages, mailMessages, markMailAsRead } = useChatStore();
  const player = usePlayerStore((state) => state.player);
  const myId = player?._id || '';
  const myFactionId = player?.factionId || null;

  const messages = useMemo(() => {
    if (activeChannel === 'complexo') return complexoMessages;
    if (activeChannel === 'faccao') return faccaoMessages.filter(msg => msg.factionId === myFactionId);
    return mailMessages.filter(msg => msg.senderId === myId || msg.recipientId === myId);
  }, [activeChannel, complexoMessages, faccaoMessages, mailMessages, myFactionId, myId]);

  useEffect(() => {
    if (activeChannel !== 'mail') return;
    const unread = messages.filter(msg => msg.recipientId === myId && !msg.read);
    unread.forEach(msg => markMailAsRead(msg.id));
  }, [messages, myId, activeChannel]);

// PARTE 2 – renderização com nome personalizado e facção
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 border border-white/10 rounded-3xl bg-black/40">
        <Skull className="w-16 h-16 mb-3 text-gray-600" />
        <p className="text-xl font-black">SILÊNCIO ABSOLUTO</p>
        <p className="text-sm">Nenhuma mensagem ainda. Quebre o gelo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
      {messages.map((msg, idx) => {
        const isMyMessage = msg.senderId === myId;
        const senderName = msg.senderName || 'ANÔNIMO';
        const senderFaction = msg.factionId ? `🎭 ${msg.factionId}` : '💀 SEM FACÇÃO';
        const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const isMail = activeChannel === 'mail';

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: isMyMessage ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02 }}
            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-3xl p-4 shadow-lg ${
              isMyMessage 
                ? 'bg-gradient-to-r from-red-900 to-red-950 text-white border border-red-500/30' 
                : 'bg-zinc-900/90 border border-white/10 text-gray-200'
            }`}>
              {/* Cabeçalho com nome e facção */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {!isMyMessage && (
                  <div className="flex items-center gap-1 text-yellow-500 text-xs font-black">
                    <Shield size={12} /> {senderFaction}
                  </div>
                )}
                <span className={`font-black ${isMyMessage ? 'text-yellow-300' : 'text-primary'}`}>
                  {senderName}
                </span>
                {isMail && msg.subject && (
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Mail size={10} /> {msg.subject}
                  </span>
                )}
                <span className="text-[10px] text-gray-500 ml-auto">{time}</span>
              </div>

              {/* Mensagem */}
              <p className="break-words whitespace-pre-wrap text-base leading-relaxed">
                {msg.body}
              </p>

              {/* Indicador de não lida para correio */}
              {activeChannel === 'mail' && !msg.read && msg.recipientId === myId && (
                <div className="mt-2 text-[10px] text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> NÃO LIDA
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}