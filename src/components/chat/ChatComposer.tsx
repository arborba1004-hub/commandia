import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Smile, AtSign, Hash, Lock, Mail } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

const EMOJIS = [
  '😀',
  '😂',
  '😍',
  '😎',
  '🥶',
  '🤬',
  '😭',
  '😈',
  '🔥',
  '💥',
  '💎',
  '💰',
  '🔫',
  '🚔',
  '👑',
  '⚡',
  '❤️',
  '🍀',
  '🍷',
  '🌹',
  '🤝',
  '👏',
  '🙏',
  '😏',
];

type ChannelType = 'complexo' | 'faccao' | 'mail';

function channelPlaceholder(channel: ChannelType) {
  if (channel === 'complexo') return 'Fale com todo o Complexo...';
  if (channel === 'faccao') return 'Mensagem para a facção...';
  return 'Escreva sua mensagem...';
}

function channelLabel(channel: ChannelType) {
  if (channel === 'complexo') return 'Canal do Complexo';
  if (channel === 'faccao') return 'Canal da Facção';
  return 'Correio';
}

function channelIcon(channel: ChannelType) {
  if (channel === 'complexo') return <Hash size={16} />;
  if (channel === 'faccao') return <Lock size={16} />;
  return <Mail size={16} />;
}

export default function ChatComposer() {
  const {
    activeChannel,
    sendComplexoMessage,
    sendFaccaoMessage,
    sendMailMessage,
    isLoading,
  } = useChatStore();

  const player = usePlayerStore((state) => state.player);

  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const composerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const senderId = player?._id || '';
  const senderName = player?.name || 'Jogador';
  const factionId = player?.factionId || '';

  const currentChannel = (activeChannel || 'complexo') as ChannelType;

  const canSend = useMemo(() => {
    if (!body.trim()) return false;
    if (!senderId || !senderName) return false;

    if (currentChannel === 'faccao') {
      return !!factionId;
    }

    if (currentChannel === 'mail') {
      return !!recipientId.trim() && !!recipientName.trim();
    }

    return true;
  }, [body, senderId, senderName, currentChannel, factionId, recipientId, recipientName]);

  useEffect(() => {
    setErrorMessage('');
    setShowEmojiPicker(false);

    if (currentChannel !== 'mail') {
      setRecipientId('');
      setRecipientName('');
      setSubject('');
    }
  }, [currentChannel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!composerRef.current) return;
      if (!composerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const resetMailFields = () => {
    setRecipientId('');
    setRecipientName('');
    setSubject('');
  };

  const resetComposer = () => {
    setBody('');
    setShowEmojiPicker(false);
    setErrorMessage('');
    if (currentChannel === 'mail') {
      resetMailFields();
    }
  };

  const addEmoji = (emoji: string) => {
    setBody((prev) => `${prev}${emoji}`);
    textareaRef.current?.focus();
  };

  const validateBeforeSend = () => {
    if (!body.trim()) {
      setErrorMessage('Digite uma mensagem antes de enviar.');
      return false;
    }

    if (!senderId || !senderName) {
      setErrorMessage('Jogador não identificado.');
      return false;
    }

    if (currentChannel === 'faccao' && !factionId) {
      setErrorMessage('Você precisa estar em uma facção para enviar aqui.');
      return false;
    }

    if (currentChannel === 'mail') {
      if (!recipientName.trim()) {
        setErrorMessage('Informe o nome do destinatário.');
        return false;
      }

      if (!recipientId.trim()) {
        setErrorMessage('Informe o ID do destinatário.');
        return false;
      }
    }

    setErrorMessage('');
    return true;
  };

  const handleSend = async () => {
    if (isLoading) return;
    if (!validateBeforeSend()) return;

    try {
      if (currentChannel === 'complexo') {
        await sendComplexoMessage({
          senderId,
          senderName,
          body: body.trim(),
        });
      } else if (currentChannel === 'faccao') {
        await sendFaccaoMessage({
          senderId,
          senderName,
          factionId,
          body: body.trim(),
        });
      } else {
        await sendMailMessage({
          senderId,
          senderName,
          recipientId: recipientId.trim(),
          recipientName: recipientName.trim(),
          subject: subject.trim() || 'Sem assunto',
          body: body.trim(),
        });
      }

      resetComposer();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setErrorMessage('Não foi possível enviar a mensagem agora.');
    }
  };

  const handleTextareaKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  return (
    <div
      ref={composerRef}
      className="relative rounded-3xl border border-white/10 bg-black/35 p-3 shadow-2xl backdrop-blur-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-white/80">
          {channelIcon(currentChannel)}
          <span>{channelLabel(currentChannel)}</span>
        </div>

        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Abrir emojis"
        >
          <Smile size={18} />
        </button>
      </div>

      <AnimatePresence>
        {currentChannel === 'mail' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            <div className="rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                <AtSign size={14} />
                <span>Destinatário</span>
              </div>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome do destinatário"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                <Hash size={14} />
                <span>ID do destinatário</span>
              </div>
              <input
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="ID do destinatário"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/45">
                <Mail size={14} />
                <span>Assunto</span>
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={channelPlaceholder(currentChannel)}
            rows={4}
            className="min-h-[96px] w-full resize-none rounded-2xl border border-white/10 bg-zinc-900/90 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-white/30 focus:border-red-500/60"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="absolute bottom-3 right-3 rounded-lg p-1 text-white/55 transition hover:bg-white/5 hover:text-white"
            aria-label="Selecionar emoji"
          >
            <Smile size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || isLoading}
          className="flex h-[56px] min-w-[56px] items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white transition hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Enviar mensagem"
        >
          <Send size={20} />
        </button>
      </div>

      {currentChannel === 'faccao' && !factionId && (
        <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Você ainda não está em uma facção.
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-[calc(100%+12px)] left-0 z-50 w-full max-w-[360px] rounded-3xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-md"
          >
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
              Emojis rápidos
            </div>

            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="rounded-xl border border-white/5 bg-white/5 p-2 text-xl transition hover:scale-105 hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}