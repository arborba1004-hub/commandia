// src/components/chat/ChatComposer.tsx (PARTE 1)
import { useState, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Image, AtSign, Hash, Lock } from 'lucide-react';

const EMOJIS = ['😎', '🔥', '💰', '💎', '🔫', '🚔', '💀', '👑', '💵', '💊', '🔪', '🩸', '🏎️', '🍾', '💍', '💼', '📿', '💣', '🦍', '🐍', '⚡', '🎲', '🏆', '🥷'];

export default function ChatComposer() {
  const { activeChannel, sendComplexoMessage, sendFaccaoMessage, sendMailMessage, isLoading } = useChatStore();
  const player = usePlayerStore((state) => state.player);
  const [body, setBody] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const emojiPickerRef = useRef<HTMLDivElement>(null);
// PARTE 2 – handlers
  const senderId = player?._id || '';
  const senderName = player?.name || 'Jogador';
  const factionId = player?.factionId || '';

  const handleSend = async () => {
    if (!body.trim()) return;
    if (!senderId || !senderName) return;

    try {
      if (activeChannel === 'complexo') {
        await sendComplexoMessage({ senderId, senderName, body: body.trim() });
      } else if (activeChannel === 'faccao') {
        if (!factionId) return;
        await sendFaccaoMessage({ senderId, senderName, factionId, body: body.trim() });
      } else if (activeChannel === 'mail') {
        if (!recipientId.trim() || !recipientName.trim()) return;
        await sendMailMessage({
          senderId,
          senderName,
          recipientId: recipientId.trim(),
          recipientName: recipientName.trim(),
          subject: subject.trim() || '📨 Sem assunto',
          body: body.trim(),
        });
        setRecipientId('');
        setRecipientName('');
        setSubject('');
      }
      setBody('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  };

  const addEmoji = (emoji: string) => setBody(prev => prev + emoji);
// PARTE 3 – JSX com campos específicos para correio
  return (
    <div className="rounded-3xl border border-white/10 bg-black/60 backdrop-blur-sm p-4 shadow-xl">
      {activeChannel === 'mail' && (
        <div className="space-y-3 mb-4">
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="👤 Nome do destinatário"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-primary"
          />
          <input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="🆔 ID do destinatário"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-primary"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="📌 Assunto"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="relative flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              activeChannel === 'complexo' ? '💬 Fale com todo o Complexo...' :
              activeChannel === 'faccao' ? '👥 Mensagem para a facção...' :
              '✉️ Escreva sua mensagem...'
            }
            className="min-h-[80px] w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none resize-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          
          {/* Botão de emoji */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-3 bottom-3 text-2xl hover:scale-110 transition"
          >
            😎
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-4 rounded-2xl font-black disabled:opacity-50 transition-all"
        >
          <Send size={22} />
        </button>
      </div>

      {/* Emoji Picker flutuante */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-4 bg-zinc-900 border border-white/20 rounded-2xl p-3 grid grid-cols-6 gap-2 z-50 shadow-2xl"
          >
            {EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => addEmoji(emoji)} className="text-2xl p-2 hover:bg-zinc-800 rounded-xl transition-all">
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}