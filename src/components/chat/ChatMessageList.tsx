import { memo, useMemo } from 'react';
import type { ChatMessage, FactionHelpRequest } from '@/store/chatStore';
import { Image } from '@/components/ui/image';
import { CUSTOM_EMOJIS } from '@/data/customEmojis';

interface ChatMessageListProps {
  messages: ChatMessage[];
  channel: 'complexo' | 'faccao' | 'mail';
  currentUserId: string;
  isLoading?: boolean;
  onOpenMail?: (messageId: string) => void;
  factionHelpRequests?: FactionHelpRequest[];
  onHelpFactionRequest?: (requestId: string) => void;
  isHelpingRequest?: boolean;
}

const HELP_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_f469fff24bd3478eae136dd027c0106b~mv2.png';

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
  | { type: 'image'; id: string; src: string; alt: string }
  | { type: 'custom-emoji'; id: string; shortcode: string; imageUrl: string; label: string };

function parseMessageBody(body: string): BodyPart[] {
  const imageTokenRegex = /\[imgemoji:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g;
  const customEmojiRegex = /:([a-z_]+):/g;

  const parts: BodyPart[] = [];
  let match: RegExpExecArray | null;

  const tokens: Array<{ type: 'image' | 'custom-emoji'; index: number; length: number; data: any }> = [];

  while ((match = imageTokenRegex.exec(body)) !== null) {
    tokens.push({
      type: 'image',
      index: match.index,
      length: match[0].length,
      data: {
        id: match[1],
        src: match[2],
        alt: match[3],
      },
    });
  }

  while ((match = customEmojiRegex.exec(body)) !== null) {
    const shortcode = match[0];
    const emoji = CUSTOM_EMOJIS.find((e) => e.shortcode === shortcode);
    if (emoji) {
      tokens.push({
        type: 'custom-emoji',
        index: match.index,
        length: match[0].length,
        data: {
          id: emoji.id,
          shortcode: emoji.shortcode,
          imageUrl: emoji.imageUrl,
          label: emoji.label,
        },
      });
    }
  }

  tokens.sort((a, b) => a.index - b.index);

  let lastIndex = 0;

  for (const token of tokens) {
    if (token.index > lastIndex) {
      parts.push({
        type: 'text',
        value: body.slice(lastIndex, token.index),
      });
    }

    if (token.type === 'image') {
      parts.push({
        type: 'image',
        id: token.data.id,
        src: token.data.src,
        alt: token.data.alt,
      });
    } else {
      parts.push({
        type: 'custom-emoji',
        id: token.data.id,
        shortcode: token.data.shortcode,
        imageUrl: token.data.imageUrl,
        label: token.data.label,
      });
    }

    lastIndex = token.index + token.length;
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

        if (part.type === 'custom-emoji') {
          return (
            <Image
              key={`emoji-${part.id}-${index}`}
              src={part.imageUrl}
              alt={part.label}
              className="inline-block h-8 w-8 align-middle"
              draggable={false}
              loading="lazy"
            />
          );
        }

        return (
          <Image
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

const FactionHelpCard = memo(function FactionHelpCard({
  request,
  currentUserId,
  onHelp,
  isHelpingRequest = false,
}: {
  request: FactionHelpRequest;
  currentUserId: string;
  onHelp?: (requestId: string) => void;
  isHelpingRequest?: boolean;
}) {
  const helpCount = Number(request.helpCount || 0);
  const maxHelps = Number(request.maxHelps || 10);
  const remainingHelps = Math.max(0, maxHelps - helpCount);
  const progressPercent = Math.min(100, (helpCount / maxHelps) * 100);

  const alreadyHelped = (request.helperIds || []).includes(String(currentUserId));
  const isOwnRequest = String(request.requesterId) === String(currentUserId);
  const isCompleted = request.status === 'completed' || remainingHelps <= 0;

  const buttonDisabled =
    isHelpingRequest || alreadyHelped || isOwnRequest || isCompleted;

  let buttonLabel = 'Ajudar';
  if (isOwnRequest) buttonLabel = 'Seu pedido';
  else if (alreadyHelped) buttonLabel = 'Você ajudou';
  else if (isCompleted) buttonLabel = 'Completo';
  else if (isHelpingRequest) buttonLabel = 'Enviando...';

  return (
    <div className="rounded-3xl border border-red-500/30 bg-black/70 p-4 shadow-[0_0_25px_rgba(255,0,0,0.18)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex shrink-0 items-center justify-center">
          <Image
            src={HELP_ICON_URL}
            alt="Ajuda no corre"
            className="h-28 w-28 object-contain md:h-32 md:w-32"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Ajuda no corre
            </span>

            <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300">
              +1 corre por ajuda
            </span>
          </div>

          <div className="mt-3 text-lg font-black text-white">
            {request.requesterName} pediu fortalecimento
          </div>

          <p className="mt-1 text-sm text-zinc-300">
            {request.message || 'Família, fortalece no corre aí 🙏'}
          </p>

          <div className="mt-4 flex items-end gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Faltam
              </div>
              <div className="text-4xl font-black leading-none text-yellow-300">
                {remainingHelps}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                corres
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-400">
                <span>Progresso</span>
                <span>
                  {helpCount}/{maxHelps}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => onHelp?.(request.id)}
            disabled={buttonDisabled}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

const MessageItem = memo(function MessageItem({
  message,
  channel,
  currentUserId,
  onOpenMail,
  factionHelpRequests = [],
  onHelpFactionRequest,
  isHelpingRequest = false,
}: {
  message: ChatMessage;
  channel: 'complexo' | 'faccao' | 'mail';
  currentUserId: string;
  onOpenMail?: (messageId: string) => void;
  factionHelpRequests?: FactionHelpRequest[];
  onHelpFactionRequest?: (requestId: string) => void;
  isHelpingRequest?: boolean;
}) {
  const isMine = String(message.senderId || '') === String(currentUserId || '');
  const isMail = channel === 'mail';
  const isUnreadMail =
    isMail &&
    String(message.recipientId || '') === String(currentUserId || '') &&
    !message.read;

  if (message.messageType === 'faction_help_request') {
    const requestId = String(message.metadata?.requestId || '');
    const request = factionHelpRequests.find((item) => String(item.id) === requestId);

    if (request) {
      return (
        <FactionHelpCard
          request={request}
          currentUserId={currentUserId}
          onHelp={onHelpFactionRequest}
          isHelpingRequest={isHelpingRequest}
        />
      );
    }
  }

  const WrapperTag = isMail ? 'button' : 'div';

  return (
    <WrapperTag
      {...(isMail
        ? {
            type: 'button' as const,
            onClick: () => {
              onOpenMail?.(message.id);
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
            {isMail ? `De: ${message.senderName || 'Remetente'}` : message.senderName || 'Jogador'}
          </p>

          {isMail && (
            <p className="mt-1 text-xs text-muted-foreground">
              {message.subject?.trim() ? `Assunto: ${message.subject}` : 'Sem assunto'}
            </p>
          )}
        </div>

        <div className="shrink-0 text-[11px] text-muted-foreground">
          {formatDate(message.createdAt)}
        </div>
      </div>

      <MessageBody body={message.body} />

      <div className="mt-3 flex items-center gap-2">
        {message.system && (
          <span className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-300">
            Sistema
          </span>
        )}

        {message.messageType === 'faction_help_update' && (
          <span className="rounded-full bg-yellow-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
            Ajuda registrada
          </span>
        )}

        {isMail && isUnreadMail && (
          <span className="rounded-full bg-yellow-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-yellow-300">
            Não lida
          </span>
        )}

        {isMail && !isUnreadMail && (
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
            Lida
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
  factionHelpRequests = [],
  onHelpFactionRequest,
  isHelpingRequest = false,
}: ChatMessageListProps) {
  const orderedMessages = useMemo(() => {
    const copied = [...messages];

    if (channel === 'mail') {
      return copied.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return copied.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, channel]);

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
        {channel === 'mail' ? 'Nenhum correio recebido.' : 'Nenhuma mensagem ainda.'}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-3">
        {orderedMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            channel={channel}
            currentUserId={currentUserId}
            onOpenMail={onOpenMail}
            factionHelpRequests={factionHelpRequests}
            onHelpFactionRequest={onHelpFactionRequest}
            isHelpingRequest={isHelpingRequest}
          />
        ))}
      </div>
    </div>
  );
}