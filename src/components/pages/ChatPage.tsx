// src/components/pages/ChatPage.tsx (PARTE 1)
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, AtSign, Hash, Shield } from 'lucide-react';
import EmojiPicker from '@/components/chat/EmojiPicker';

export default function ChatPage() {
  const token = localStorage.getItem('authToken');
  const { player, loadPlayer, isLoaded } = usePlayerStore();
  const { 
    activeChannel, setActiveChannel, 
    complexoMessages, faccaoMessages, mailMessages,
    sendComplexoMessage, sendFaccaoMessage, sendMailMessage,
    loadChat, startChatPolling, stopChatPolling, isLoading,
    setCurrentUser
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
// PARTE 2 – useEffect e lógica principal
  useEffect(() => {
    if (token && !isLoaded) loadPlayer();
  }, [token, isLoaded]);

  useEffect(() => {
    if (player?._id) {
      // Set current user and faction for backend polling
      setCurrentUser(player._id, player.factionId);
      loadChat();
      startChatPolling();
      return () => {
        stopChatPolling();
      };
    }
  }, [player?._id, player?.factionId]);

  if (!token || !player?._id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-6 rounded-2xl bg-red-950/40 border border-red-500/30">
          <p className="text-red-300 text-xl font-black">🔒 ACESSO NEGADO</p>
          <p className="text-gray-400 mt-2">Faça login para acessar o chat</p>
          <button onClick={() => window.location.href='/'} className="mt-4 bg-primary px-6 py-2 rounded-xl">Voltar</button>
        </div>
      </div>
    );
  }

  const messages = activeChannel === 'complexo' ? complexoMessages :
                    activeChannel === 'faccao' ? faccaoMessages : mailMessages;

  const handleSend = async () => {
    if (!messageText.trim()) return;
    if (activeChannel === 'complexo') {
      await sendComplexoMessage({ senderId: player._id, senderName: player.name, body: messageText });
    } else if (activeChannel === 'faccao') {
      await sendFaccaoMessage({ senderId: player._id, senderName: player.name, factionId: player.factionId, body: messageText });
    } else if (activeChannel === 'mail') {
      if (!recipientId || !recipientName) return;
      await sendMailMessage({
        senderId: player._id, senderName: player.name,
        recipientId, recipientName, subject: subject || '📨 Mensagem', body: messageText
      });
      setRecipientId(''); setRecipientName(''); setSubject('');
    }
    setMessageText('');
    setShowEmojiPicker(false);
  };

// PARTE 3 – JSX com abas temáticas
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
      <Header />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 bg-clip-text text-transparent">COMPLEXO DO CRIME</h1>
          <p className="text-gray-400 mt-2">Comunique-se com o submundo</p>
        </motion.div>

        {/* Abas estilizadas */}
        <div className="flex gap-3 mb-8 justify-center flex-wrap">
          {[
            { id: 'complexo', label: '🌍 COMPLEXO', icon: <Hash />, color: 'from-blue-600 to-cyan-600' },
            { id: 'faccao', label: '👥 FACÇÃO', icon: <Shield />, color: 'from-red-700 to-orange-700' },
            { id: 'mail', label: '📩 CORREIO', icon: <AtSign />, color: 'from-emerald-700 to-teal-700' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveChannel(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-wider transition-all ${
                activeChannel === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-${tab.id === 'complexo' ? 'blue' : tab.id === 'faccao' ? 'red' : 'green'}-500/50`
                  : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800 border border-white/10'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Campo de destinatário e assunto para correio */}
        {activeChannel === 'mail' && (
          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
            <input type="text" placeholder="👤 Nome do destinatário" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="w-full bg-zinc-900 rounded-xl p-3 text-white" />
            <input type="text" placeholder="🆔 ID do destinatário" value={recipientId} onChange={e => setRecipientId(e.target.value)} className="w-full bg-zinc-900 rounded-xl p-3 text-white" />
            <input type="text" placeholder="📌 Assunto" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-zinc-900 rounded-xl p-3 text-white" />
          </div>
        )}

// PARTE 4 – Lista de mensagens e input com emojis
        <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-3xl p-5 mb-4 h-[500px] overflow-y-auto space-y-3">
          {messages.map(msg => {
            const isMyMsg = msg.senderId === player._id;
            const senderFac = msg.factionId ? `🔫 ${msg.factionId}` : '💀 SOLITÁRIO';
            const displaySenderName = msg.senderName || 'ANÔNIMO';
            return (
              <div key={msg.id} className={`flex ${isMyMsg ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 ${isMyMsg ? 'bg-gradient-to-r from-red-800 to-red-950 text-white' : 'bg-zinc-900 border border-white/10 text-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="font-black">{displaySenderName}</span>
                    {!isMyMsg && <span className="text-yellow-500 text-[10px]">{senderFac}</span>}
                    <span className="text-gray-500 text-[10px]">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {msg.subject && <p className="text-primary text-xs font-bold mb-1">📌 {msg.subject}</p>}
                  <p className="break-words">{msg.body}</p>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && <div className="text-center text-gray-500 py-10">💬 Nenhuma mensagem ainda. Domine o chat.</div>}
        </div>

        {/* Área de envio com emojis */}
        <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex gap-2 items-center">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-2xl p-2 hover:bg-zinc-800 rounded-xl">😎</button>
          <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 bg-transparent p-3 text-white outline-none" onKeyPress={e => e.key === 'Enter' && handleSend()} />
          <button onClick={handleSend} disabled={isLoading} className="bg-primary text-black p-3 rounded-xl font-black disabled:opacity-50"><Send size={20} /></button>
        </div>
        {showEmojiPicker && <EmojiPicker onSelect={(emoji) => setMessageText(prev => prev + emoji)} />}
      </main>
      <Footer />
    </div>
  );
}