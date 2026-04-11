import { memo, useEffect, useMemo, useRef } from 'react';
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

type BodyPart =
  | { type: 'text'; value: string }
  | { type: 'image'; id: string; src: string; alt: string };

function parseMessageBody(body: string): BodyPart[] {
  const tokenRegex = /\[imgemoji:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g;
  const parts: BodyPart[] = [];

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

  if (!parts.length) {
    parts.push({
      type: 'text',
      value: body,
    });
  }

  return parts;
}

const MessageBody = memo(function MessageBody({ body }: { body: string }) {
  const parts = useMemo(() => parseMessageBody(body), [body]);

  return (
    <div className="text-sm leading-relaxed text-foreground">
      {parts.map((part, index) => {
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
            loading="lazy"
          />
        );
      })}
    </div>
  );
});

const MessageItem = memo(function MessageItem({
  message,
  channel,
  currentUserId,
  onOpenMail,
}: {
  message: ChatMessage;
  channel: 'complexo' | 'faccao' | 'mail';
  currentUserId: string;
  onOpenMail?: (messageId: string) => void;
}) {
  const isMine = String(message.senderId || '') === String(currentUserId || '');
  const isMail = channel === 'mail';
  const isUnreadMail =
    isMail &&
    String(message.recipientId || '') === String(currentUserId || '') &&
    !message.read;

  const WrapperTag = isMail ? 'button' : 'div';

  return (
    <WrapperTag
      {...(isMail
        ? {
            type: 'button' as const,
            onClick: () => {
              if (onOpenMail) onOpenMail(message.id);
            },
          }
        : {})}
      className={[
        'w-full rounded-2xl border text-left transition-colors',
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

      <MessageBody body={message.body} />

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
    </WrapperTag>
  );
});

export default function ChatMessageList({
  messages,
  channel,
  currentUserId,
  isLoading = false,
  onOpenMail,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousLastMessageIdRef = useRef<string | null>(null);

  const orderedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (!containerRef.current) return;

    const lastMessageId =
      orderedMessages.length > 0 ? orderedMessages[orderedMessages.length - 1].id : null;

    if (lastMessageId && previousLastMessageIdRef.current !== lastMessageId) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      previousLastMessageIdRef.current = lastMessageId;
    }
  }, [orderedMessages]);

  if (isLoading && orderedMessages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-muted-foreground">
        Carregando mensagens...
      </div>
    );
  }

  if (!orderedMessages.length) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-muted-foreground">
        {channel === 'mail' ? 'Nenhum correio encontrado.' : 'Nenhuma mensagem ainda.'}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 py-4 will-change-transform"
    >
      <div className="flex flex-col gap-3">
        {orderedMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            channel={channel}
            currentUserId={currentUserId}
            onOpenMail={onOpenMail}
          />
        ))}
      </div>
    </div>
  );
}