import { useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';

export default function ChatMessageList() {
  const activeChannel = useChatStore((state) => state.activeChannel);
  const complexoMessages = useChatStore((state) => state.complexoMessages);
  const faccaoMessages = useChatStore((state) => state.faccaoMessages);
  const mailMessages = useChatStore((state) => state.mailMessages);
  const markMailAsRead = useChatStore((state) => state.markMailAsRead);

  const messages = useMemo(() => {
    if (activeChannel === 'complexo') return complexoMessages;
    if (activeChannel === 'faccao') return faccaoMessages;
    return mailMessages;
  }, [activeChannel, complexoMessages, faccaoMessages, mailMessages]);

  useEffect(() => {
    if (activeChannel !== 'mail') return;

    mailMessages.forEach((msg) => {
      if (!msg.read) {
        markMailAsRead(msg.id);
      }
    });
  }, [activeChannel, mailMessages, markMailAsRead]);

  return (
    <div className="h-[460px] overflow-y-auto rounded-3xl border border-white/10 bg-black/40 p-4 space-y-3 shadow-[inset_0_0_40px_rgba(0,0,0,0.4)]">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-zinc-400">
          <p className="text-xl font-bold">Nada por aqui ainda</p>
          <p className="text-sm mt-2">
            As mensagens deste canal aparecerão aqui.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-2xl border p-4 transition-all ${
            activeChannel === 'mail'
              ? msg.read
                ? 'border-zinc-800 bg-zinc-900/70'
                : 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(0,255,120,0.08)]'
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
        </div>
      ))}
    </div>
  );
}