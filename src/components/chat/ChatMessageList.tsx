import { useEffect, useMemo, useRef } from 'react';
import type { ChatMessage } from '@/store/chatStore';

interface ChatMessageListProps {
  messages: ChatMessage[];
  channel: 'complexo' | 'faccao' | 'mail';
  currentUserId: string;
  isLoading?: boolean;
  onOpenMail?: (messageId: string) => void;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function renderMessageBody(body: string) {
  const tokenRegex = /\[imgemoji:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g;
  const parts: Array<{ type: 'text'; value: string } | { type: 'image'; id: string; src: string; alt: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: body.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: 'image',
      id: match[1],
      src: match[2],
      alt: match[3],
    });

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < body.length) {
    parts.push({
      type: 'text',
      value: body.slice(lastIndex),
    });
  }

  return parts.map((part, index) => {
    if (part.type === 'text') {
      return (
        <span key={`text-${index}`} className="whitespace-pre-wrap break-words">
          {part.value}
        </span>
      );
    }

    return (
      <img
        key={`img-${part.id}-${index}`}
        src={part.src}
        alt={part.alt}
        className="my-2 h-20 w-20 object-contain"
        draggable={false}
      />
    );
  });
}

export default function ChatMessageList({
  messages,
  channel,
  currentUserId,
  isLoading = false,
  onOpenMail,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-muted-foreground">
        Carregando mensagens...
      </div>
    );
  }

  if (!orderedMessages.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-muted-foreground">
        {channel === 'mail'
          ? 'Nenhum correio encontrado.'
          : 'Nenhuma mensagem ainda.'}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-3">
        {orderedMessages.map((message) => {
          const isMine = String(message.senderId || '') === String(currentUserId || '');
          const isMail = channel === 'mail';
          const isUnreadMail =
            isMail &&
            String(message.recipientId || '') === String(currentUserId || '') &&
            !message.read;

          return (
            <button
              key={message.id}
              type="button"
              onClick={() => {
                if (isMail && onOpenMail) onOpenMail(message.id);
              }}
              className={[
                'w-full rounded-2xl border text-left transition-all',
                isMine
                  ? 'self-end border-red-500/30 bg-red-500/10'
                  : 'border-border bg-card',
                isMail ? 'p-4 hover:bg-muted/60' : 'p-3',
                isUnreadMail ? 'ring-1 ring-yellow-400/60' : '',
              ].join(' ')}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black uppercase tracking-wide">
                    {message.senderName || 'Jogador'}
                  </p>

                  {isMail && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isMine
                        ? `Para: ${message.recipientName || 'Destinatário'}`
                        : `De: ${message.senderName || 'Remetente'}`}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDate(message.createdAt)}
                </div>
              </div>

              {isMail && message.subject && (
                <p className="mb-2 text-sm font-bold text-foreground">
                  Assunto: {message.subject}
                </p>
              )}

              <div className="text-sm leading-relaxed text-foreground">
                {renderMessageBody(message.body)}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {message.system && (
                  <span className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-300">
                    Sistema
                  </span>
                )}

                {isMail && isUnreadMail && (
                  <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
                    Não lida
                  </span>
                )}

                {isMail && !isUnreadMail && (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
                    {message.read ? 'Lida' : 'Enviada'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}