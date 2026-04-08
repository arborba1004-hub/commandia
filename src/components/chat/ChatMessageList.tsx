import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Shield, Hash, CheckCircle2 } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

type ChannelType = 'complexo' | 'faccao' | 'mail';

function formatTime(value?: string) {
  if (!value) return '--:--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateDivider(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getChannelLabel(channel: ChannelType) {
  if (channel === 'complexo') return 'Chat do Complexo';
  if (channel === 'faccao') return 'Chat da Facção';
  return 'Correio';
}

function getChannelIcon(channel: ChannelType) {
  if (channel === 'complexo') return <Hash size={16} />;
  if (channel === 'faccao') return <Shield size={16} />;
  return <Mail size={16} />;
}

export default function ChatMessageList() {
  const {
    activeChannel,
    complexoMessages,
    faccaoMessages,
    mailMessages,
    markMailAsRead,
    isLoading,
  } = useChatStore();

  const player = usePlayerStore((state) => state.player);

  const myId = player?._id || '';
  const myFactionId = player?.factionId || '';
  const currentChannel = (activeChannel || 'complexo') as ChannelType;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  const messages = useMemo(() => {
    if (currentChannel === 'complexo') {
      return [...complexoMessages];
    }

    if (currentChannel === 'faccao') {
      if (!myFactionId) return [];
      return faccaoMessages.filter((msg: any) => msg.factionId === myFactionId);
    }

    return mailMessages.filter(
      (msg: any) => msg.senderId === myId || msg.recipientId === myId
    );
  }, [currentChannel, complexoMessages, faccaoMessages, mailMessages, myFactionId, myId]);

  const groupedMessages = useMemo(() => {
    const groups: Array<
      | { type: 'date'; key: string; label: string }
      | { type: 'message'; key: string; data: any }
    > = [];

    let lastDate = '';

    for (const msg of messages) {
      const currentDate = formatDateDivider(msg.createdAt);

      if (currentDate && currentDate !== lastDate) {
        groups.push({
          type: 'date',
          key: `date-${currentDate}`,
          label: currentDate,
        });
        lastDate = currentDate;
      }

      groups.push({
        type: 'message',
        key: msg.id || `${msg.senderId}-${msg.createdAt}-${msg.body}`,
        data: msg,
      });
    }

    return groups;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [groupedMessages.length, currentChannel]);

  useEffect(() => {
    if (currentChannel !== 'mail') return;
    if (!myId) return;

    const unreadMine = messages.filter(
      (msg: any) =>
        msg.recipientId === myId &&
        !msg.read &&
        msg.id &&
        !markedReadRef.current.has(msg.id)
    );

    unreadMine.forEach((msg: any) => {
      markedReadRef.current.add(msg.id);
      markMailAsRead(msg.id);
    });
  }, [messages, currentChannel, myId, markMailAsRead]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-black/25 px-6 py-12 text-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-white/45">
            Carregando mensagens
          </p>
          <p className="mt-3 text-white/70">Buscando conversa...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-black/25 px-6 py-12 text-center">
        <div>
          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white/55">
            {getChannelIcon(currentChannel)}
            <span>{getChannelLabel(currentChannel)}</span>
          </div>

          <p className="text-lg font-bold text-white">Silêncio absoluto</p>
          <p className="mt-2 text-sm text-white/60">
            Nenhuma mensagem ainda. Quebre o gelo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-3 md:p-4">
      <div className="mb-3 flex items-center gap-2 px-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">
        {getChannelIcon(currentChannel)}
        <span>{getChannelLabel(currentChannel)}</span>
      </div>

      <div className="max-h-[62vh] overflow-y-auto pr-1">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {groupedMessages.map((entry) => {
              if (entry.type === 'date') {
                return (
                  <motion.div
                    key={entry.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-center py-2"
                  >
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white/45">
                      {entry.label}
                    </div>
                  </motion.div>
                );
              }

              const msg = entry.data;
              const isMyMessage = msg.senderId === myId;
              const isMail = currentChannel === 'mail';
              const time = formatTime(msg.createdAt);

              const senderName = msg.senderName?.trim() || 'ANÔNIMO';
              const factionLabel = msg.factionId ? `FACÇÃO ${msg.factionId}` : 'SEM FACÇÃO';
              const unreadForMe = isMail && msg.recipientId === myId && !msg.read;

              return (
                <motion.div
                  key={entry.key}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={[
                      'max-w-[88%] rounded-3xl border px-4 py-3 shadow-xl md:max-w-[72%]',
                      isMyMessage
                        ? 'border-red-500/25 bg-gradient-to-br from-red-600/18 to-red-900/16'
                        : 'border-white/10 bg-white/5',
                    ].join(' ')}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className={[
                          'text-xs font-black uppercase tracking-[0.15em]',
                          isMyMessage ? 'text-red-300' : 'text-white/85',
                        ].join(' ')}
                      >
                        {isMyMessage ? 'VOCÊ' : senderName}
                      </span>

                      {!isMyMessage && currentChannel !== 'mail' && (
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                          {factionLabel}
                        </span>
                      )}

                      {isMail && msg.subject && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                          {msg.subject}
                        </span>
                      )}

                      <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                        {time}
                      </span>
                    </div>

                    {isMail && (
                      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
                        {isMyMessage
                          ? `Para: ${msg.recipientName || 'Destinatário'}`
                          : `De: ${senderName}`}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/92">
                      {msg.body}
                    </div>

                    {unreadForMe && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                        <CheckCircle2 size={12} />
                        <span>Não lida</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}