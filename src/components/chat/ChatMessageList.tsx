import { useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import type { ChatMessage } from '@/types/chat';

export default function ChatMessageList() {
  const activeChannel = useChatStore((state) => state.activeChannel);
  const complexoMessages = useChatStore((state) => state.complexoMessages);
  const faccaoMessages = useChatStore((state) => state.faccaoMessages);
  const mailMessages = useChatStore((state) => state.mailMessages);
  const markMailAsRead = useChatStore((state) => state.markMailAsRead);
  const isLoading = useChatStore((state) => state.isLoading);

  const player = usePlayerStore((state) => state.player);

  const myId = player?._id || '';
  const myFactionId =
    (player as any)?.faction?.factionId ||
    (player as any)?.factionId ||
    null;

  const messages: ChatMessage[] = useMemo(() => {
    if (activeChannel === 'complexo') {
      return complexoMessages;
    }

    if (activeChannel === 'faccao') {
      return faccaoMessages.filter((msg) => msg.factionId === myFactionId);
    }

    return mailMessages.filter(
      (msg) => msg.senderId === myId || msg.recipientId === myId
    );
  }, [activeChannel, complexoMessages, faccaoMessages, mailMessages, myFactionId, myId]);

  useEffect(() => {
    if (activeChannel !== 'mail') return;
    if (!myId) return;

    const unreadForMe = messages.filter(
      (msg) => msg.recipientId === myId && !msg.read
    );

    unreadForMe.forEach((msg) => {
      void markMailAsRead(msg.id);
    });
  }, [activeChannel, messages, myId, markMailAsRead]);

  return (
    <div className="flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-black/40 p-4 space-y-3">
      {isLoading && messages.length === 0 && (
        <div className="text-center text-zinc-400 py-8">
          Carregando mensagens...
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className="text-center text-zinc-500 py-8">
          Nenhuma mensagem ainda.
        </div>
      )}

      {messages.map((msg) => {
        const isMyMail =
          activeChannel === 'mail' && msg.senderId === myId;

        return (
          <div
            key={msg.id}
            className={`rounded-2xl border p-4 ${
              activeChannel === 'mail'
                ? isMyMail
                  ? 'border-emerald-500/20 bg-emerald-950/20'
                  : 'border-zinc-800 bg-zinc-900/70'
                : 'border-zinc-800 bg-zinc-900/70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-white">{msg.senderName}</p>

                {activeChannel === 'mail' && msg.recipientName && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Para: {msg.recipientName}
                  </p>
                )}
              </div>

              <p className="text-xs text-zinc-400 whitespace-nowrap">
                {new Date(msg.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>

            {activeChannel === 'mail' && msg.subject && (
              <p className="mt-3 text-sm font-black uppercase tracking-wide text-emerald-400">
                {msg.subject}
              </p>
            )}

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-200">
              {msg.body}
            </p>

            {msg.system && (
              <div className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-950/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-300">
                Sistema
              </div>
            )}

            {activeChannel === 'mail' && !msg.read && msg.recipientId === myId && (
              <div className="mt-3 inline-flex rounded-full border border-red-500/20 bg-red-950/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-red-300">
                Não lida
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}