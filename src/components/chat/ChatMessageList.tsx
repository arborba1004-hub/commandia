import { memo, useEffect, useMemo, useRef } from 'react';
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

const AZIDEIA_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_ce2c97a1cf324091851178166ed02d29~mv2.png';

const AZIDEIA_CORRERIA_ICON_URL =
  'https://static.wixstatic.com/media/50f4bf_9bda4af1a12b47679336479a80b16eb8~mv2.png';

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return value; }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return value; }
}

function getInitials(name: string) {
  return (name || 'J').trim().split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '').join('') || 'J';
}

const AVATAR_COLORS = [
  'bg-red-700', 'bg-orange-700', 'bg-amber-700',
  'bg-emerald-700', 'bg-cyan-700', 'bg-blue-700',
  'bg-violet-700', 'bg-pink-700',
];
function avatarColor(name: string) {
  return AVATAR_COLORS[(name || 'J').charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Parser de mensagens ────────────────────────────────────────────────────────
type BodyPart =
  | { type: 'text';  value: string }
  | { type: 'emoji'; imageUrl: string; label: string }
  | { type: 'image'; src: string; alt: string };

function parseBody(body: string): BodyPart[] {
  const imageTokenRegex  = /\[imgemoji:([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g;
  const customEmojiRegex = /:([a-z_]+):/g;

  const tokens: Array<{ index: number; length: number; part: BodyPart }> = [];

  let match: RegExpExecArray | null;

  // Formato [imgemoji:id|src|alt]
  while ((match = imageTokenRegex.exec(body)) !== null) {
    tokens.push({
      index:  match.index,
      length: match[0].length,
      part:   { type: 'image', src: match[2], alt: match[3] },
    });
  }

  // Formato :shortcode: — usa os CUSTOM_EMOJIS novos
  while ((match = customEmojiRegex.exec(body)) !== null) {
    const shortcode = match[0];
    const emoji = CUSTOM_EMOJIS.find((e) => e.shortcode === shortcode);
    if (emoji) {
      tokens.push({
        index:  match.index,
        length: match[0].length,
        part:   { type: 'emoji', imageUrl: emoji.imageUrl, label: emoji.label },
      });
    }
  }

  tokens.sort((a, b) => a.index - b.index);

  const parts: BodyPart[] = [];
  let last = 0;

  for (const token of tokens) {
    if (token.index > last) {
      parts.push({ type: 'text', value: body.slice(last, token.index) });
    }
    parts.push(token.part);
    last = token.index + token.length;
  }

  if (last < body.length) {
    parts.push({ type: 'text', value: body.slice(last) });
  }

  if (!parts.length) {
    parts.push({ type: 'text', value: body });
  }

  return parts;
}

// ── Renderiza o corpo da mensagem ─────────────────────────────────────────────
const MessageBody = memo(({ body }: { body: string }) => {
  const parts = useMemo(() => parseBody(body), [body]);
  return (
    <span className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {parts.map((p, i) => {
        if (p.type === 'emoji') {
          return (
            <Image key={i} src={p.imageUrl} alt={p.label}
              className="inline-block h-8 w-8 align-middle" draggable={false} />
          );
        }
        if (p.type === 'image') {
          return (
            <Image key={i} src={p.src} alt={p.alt}
              className="inline-block h-8 w-8 align-middle" draggable={false} />
          );
        }
        return <span key={i}>{p.value}</span>;
      })}
    </span>
  );
});

// ── Cartão de pedido de corre ─────────────────────────────────────────────────
const FactionHelpCard = memo(({
  request, currentUserId, onHelp, isHelpingRequest = false,
}: {
  request: FactionHelpRequest;
  currentUserId: string;
  onHelp?: (id: string) => void;
  isHelpingRequest?: boolean;
}) => {
  const helpCount = Number(request.helpCount || 0);
  const maxHelps  = Number(request.maxHelps  || 10);
  const remaining = Math.max(0, maxHelps - helpCount);
  const pct       = Math.min(100, (helpCount / maxHelps) * 100);
  const alreadyHelped = (request.helperIds || []).includes(String(currentUserId));
  const isOwn         = String(request.requesterId) === String(currentUserId);
  const isComplete    = request.status === 'completed' || remaining <= 0;
  const disabled      = isHelpingRequest || alreadyHelped || isOwn || isComplete;

  let label = 'Ajudar';
  if (isOwn)              label = 'Seu pedido';
  else if (alreadyHelped) label = 'Você ajudou';
  else if (isComplete)    label = 'Completo';
  else if (isHelpingRequest) label = 'Enviando...';

  return (
    <div className="rounded-2xl border border-red-500/30 bg-black/60 p-4">
      <div className="flex items-center gap-3">
        <Image src={HELP_ICON_URL} alt="Corre" className="h-14 w-14 object-contain shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm">{request.requesterName} pediu corre</p>
          <p className="text-xs text-zinc-400 mt-0.5">{request.message}</p>
          <div className="mt-2 h-2 rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-red-600 transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {helpCount}/{maxHelps} corres • Faltam {remaining}
          </p>
        </div>
        <button type="button" onClick={() => onHelp?.(request.id)} disabled={disabled}
          className="shrink-0 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">
          {label}
        </button>
      </div>
    </div>
  );
});


// ── Cartão Azidéia no chat da facção ───────────────────────────────────────────
const AzideiaRewardCard = memo(({ message }: { message: ChatMessage }) => {
  const totalMembers = Number(message.metadata?.memberCount ?? 0);
  const targetType = String(message.metadata?.targetType || 'x9');
  const rewardType = String(message.metadata?.rewardType || 'convoy_2x');
  const isCorreria = targetType === 'correria' || rewardType === 'corre';
  const killerName = String(
    message.metadata?.killerName
      || message.metadata?.negotiatorName
      || message.senderName
      || 'Jogador'
  );

  const openRewards = () => {
    window.dispatchEvent(new CustomEvent('openAzideiaRewards'));
  };

  return (
    <div className={`rounded-2xl border ${isCorreria ? 'border-emerald-500/30' : 'border-red-500/30'} bg-black/60 p-4`}>
      <div className="flex items-center gap-3">
        <Image
          src={isCorreria ? AZIDEIA_CORRERIA_ICON_URL : AZIDEIA_ICON_URL}
          alt={isCorreria ? 'Correria' : 'Azidéia'}
          className="h-16 w-16 object-contain shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-black uppercase tracking-wide ${isCorreria ? 'text-emerald-200' : 'text-red-200'}`}>
            {isCorreria ? 'Correria' : 'Azidéia'}
          </p>
          <p className="mt-0.5 text-sm text-white">
            {isCorreria
              ? `${killerName} negociou com um Correria. A facção recebeu Corres para coletar.`
              : `${killerName} eliminou um X9. A facção recebeu aceleradores para coletar.`}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Recompensa: {isCorreria ? '+1 Corre' : '+1 acelerador de comboio'} por membro{totalMembers > 0 ? ` • ${totalMembers} membros` : ''}
            {isCorreria ? ` • limite ${message.metadata?.dailyLimit ?? 100}/dia` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={openRewards}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black uppercase text-white ${isCorreria ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          Coletar
        </button>
      </div>
    </div>
  );
});

// ── Mensagem estilo WhatsApp (complexo / facção) ───────────────────────────────
const GroupMessageItem = memo(({
  message, currentUserId, factionHelpRequests, onHelpFactionRequest, isHelpingRequest,
}: {
  message: ChatMessage;
  currentUserId: string;
  factionHelpRequests: FactionHelpRequest[];
  onHelpFactionRequest?: (id: string) => void;
  isHelpingRequest?: boolean;
}) => {
  const isMine = String(message.senderId) === String(currentUserId);

  if (message.messageType === 'azideia_reward') {
    return <AzideiaRewardCard message={message} />;
  }

  if (message.messageType === 'faction_help_request') {
    const req = factionHelpRequests.find(
      (r) => String(r.id) === String(message.metadata?.requestId || '')
    );
    if (req) return (
      <FactionHelpCard request={req} currentUserId={currentUserId}
        onHelp={onHelpFactionRequest} isHelpingRequest={isHelpingRequest} />
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar do outro jogador */}
      {!isMine && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${avatarColor(message.senderName)}`}>
          {getInitials(message.senderName)}
        </div>
      )}

      <div className={`flex max-w-[75%] flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Nome + facção */}
        {!isMine && (
          <div className="mb-1 flex items-center gap-2 px-1">
            <span className="text-[11px] font-black text-zinc-300">
              {message.senderName}
            </span>
            {message.factionId && (
              <span className="rounded-full bg-red-700/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-300">
                {message.factionId}
              </span>
            )}
          </div>
        )}

        {/* Bolha */}
        <div className={`rounded-2xl px-3 py-2 ${
          isMine
            ? 'rounded-br-sm bg-red-700 text-white'
            : 'rounded-bl-sm bg-zinc-800 text-white'
        }`}>
          <MessageBody body={message.body} />
          <div className={`mt-1 text-[10px] ${isMine ? 'text-right text-red-200' : 'text-zinc-500'}`}>
            {formatTime(message.createdAt)}
            {isMine && <span className="ml-1">{message.read ? '✓✓' : '✓'}</span>}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Mensagem de mail ───────────────────────────────────────────────────────────
const MailMessageItem = memo(({
  message, currentUserId, onOpenMail,
}: {
  message: ChatMessage;
  currentUserId: string;
  onOpenMail?: (id: string) => void;
}) => {
  const isMine   = String(message.senderId) === String(currentUserId);
  const isUnread = !isMine && !message.read;
  const otherName = isMine
    ? (message.recipientName || 'Jogador')
    : (message.senderName   || 'Jogador');

  return (
    <button type="button" onClick={() => onOpenMail?.(message.id)}
      className={`w-full rounded-2xl border text-left p-4 transition hover:bg-white/5 ${
        isUnread ? 'border-yellow-400/40 bg-yellow-500/5' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${avatarColor(otherName)}`}>
            {getInitials(otherName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{otherName}</p>
            {message.subject && (
              <p className="truncate text-xs text-zinc-400">{message.subject}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[11px] text-zinc-500">{formatDate(message.createdAt)}</span>
          {isUnread && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
        </div>
      </div>
      <p className="mt-2 truncate text-sm text-zinc-400">{message.body}</p>
    </button>
  );
});

// ── Export principal ───────────────────────────────────────────────────────────
export default function ChatMessageList({
  messages, channel, currentUserId, isLoading = false,
  onOpenMail, factionHelpRequests = [], onHelpFactionRequest, isHelpingRequest = false,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevLastId   = useRef<string | null>(null);

  const ordered = useMemo(
    () => [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    [messages]
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const lastId = ordered.at(-1)?.id ?? null;
    if (lastId && prevLastId.current !== lastId) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      prevLastId.current = lastId;
    }
  }, [ordered]);

  if (isLoading && !ordered.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Carregando mensagens...
      </div>
    );
  }

  if (!ordered.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        {channel === 'mail' ? 'Nenhum correio.' : 'Nenhuma mensagem ainda.'}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-2">
        {ordered.map((msg) =>
          channel === 'mail' ? (
            <MailMessageItem key={msg.id} message={msg}
              currentUserId={currentUserId} onOpenMail={onOpenMail} />
          ) : (
            <GroupMessageItem key={msg.id} message={msg}
              currentUserId={currentUserId}
              factionHelpRequests={factionHelpRequests}
              onHelpFactionRequest={onHelpFactionRequest}
              isHelpingRequest={isHelpingRequest} />
          )
        )}
      </div>
    </div>
  );
}