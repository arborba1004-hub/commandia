import { useChatStore } from '@/store/chatStore';
import { useMemo } from 'react';

export default function ChatMessageList() {
  const activeChannel = useChatStore((state) => state.activeChannel);
    const complexoMessages = useChatStore((state) => state.complexoMessages);
      const faccaoMessages = useChatStore((state) => state.faccaoMessages);
        const mailMessages = useChatStore((state) => state.mailMessages);

          const messages = useMemo(() => {
              if (activeChannel === 'complexo') return complexoMessages;
                  if (activeChannel === 'faccao') return faccaoMessages;
                      return mailMessages;
                        }, [activeChannel, complexoMessages, faccaoMessages, mailMessages]);

                          return (
                              <div className="h-[420px] overflow-y-auto rounded-3xl border border-white/10 bg-black/40 p-4 space-y-3">
                                    {messages.length === 0 && (
                                            <div className="h-full flex items-center justify-center text-zinc-400">
                                                      Nenhuma mensagem ainda.
                                                              </div>
                                                                    )}

                                                                          {messages.map((msg) => (
                                                                                  <div
                                                                                            key={msg.id}
                                                                                                      className={`rounded-2xl border p-3 ${
                                                                                                                  activeChannel === 'mail'
                                                                                                                                ? msg.read
                                                                                                                                                ? 'border-zinc-700 bg-zinc-900/60'
                                                                                                                                                                : 'border-emerald-500/40 bg-emerald-950/20'
                                                                                                                                                                              : 'border-zinc-800 bg-zinc-900/60'
                                                                                                                                                                                        }`}
                                                                                                                                                                                                >
                                                                                                                                                                                                          <div className="flex items-center justify-between gap-3">
                                                                                                                                                                                                                      <p className="font-black text-white">{msg.senderName}</p>
                                                                                                                                                                                                                                  <p className="text-xs text-zinc-400">
                                                                                                                                                                                                                                                {new Date(msg.createdAt).toLocaleString('pt-BR')}
                                                                                                                                                                                                                                                            </p>
                                                                                                                                                                                                                                                                      </div>

                                                                                                                                                                                                                                                                                {activeChannel === 'mail' && msg.subject && (
                                                                                                                                                                                                                                                                                            <p className="mt-2 text-sm font-bold text-emerald-400">
                                                                                                                                                                                                                                                                                                          {msg.subject}
                                                                                                                                                                                                                                                                                                                      </p>
                                                                                                                                                                                                                                                                                                                                )}

                                                                                                                                                                                                                                                                                                                                          <p className="mt-2 whitespace-pre-line text-sm text-zinc-200">
                                                                                                                                                                                                                                                                                                                                                      {msg.body}
                                                                                                                                                                                                                                                                                                                                                                </p>

                                                                                                                                                                                                                                                                                                                                                                          {activeChannel === 'mail' && msg.recipientName && (
                                                                                                                                                                                                                                                                                                                                                                                      <p className="mt-2 text-xs text-zinc-500">
                                                                                                                                                                                                                                                                                                                                                                                                    Para: {msg.recipientName}
                                                                                                                                                                                                                                                                                                                                                                                                                </p>
                                                                                                                                                                                                                                                                                                                                                                                                                          )}
                                                                                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                        ))}
                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                                                                                                              }
