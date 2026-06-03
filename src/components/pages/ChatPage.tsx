import { useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import ChatTabs from '@/components/chat/chatTabs';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import { useChatStore } from '@/store/chatStore';
import type { ChatMessage } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AzideiaRewardsModal from '@/components/chat/AzideiaRewardsModal';
import { Image } from '@/components/ui/image';
import { AZIDEIA_CORRERIA_ICON_URL, AZIDEIA_ICON_URL } from '@/data/azideiaCatalog';

interface ExtendedPlayer {
  _id?: string;
  googleId?: string;
  factionId?: string;
  name?: string;
}

type ChatChannelType = 'complexo' | 'faccao' | 'mail';

function isValidChannel(value: string | null): value is ChatChannelType {
  return value === 'complexo' || value === 'faccao' || value === 'mail';
}

// ── Agrupa mensagens de mail por conversa ────────────────────────────────────
type Conversation = {
  partnerId: string;
  partnerName: string;
  messages: ChatMessage[];
  lastMessage: ChatMessage;
  unreadCount: number;
};

function buildConversations(
  messages: ChatMessage[],
  currentUserId: string
): Conversation[] {
  const map = new Map<string, ChatMessage[]>();

  for (const msg of messages) {
    const senderId   = String(msg.senderId   || '');
    const recipientId = String(msg.recipientId || '');
    const partnerId  = senderId === currentUserId ? recipientId : senderId;
    if (!partnerId || partnerId === currentUserId) continue;
    if (!map.has(partnerId)) map.set(partnerId, []);
    map.get(partnerId)!.push(msg);
  }

  const convs: Conversation[] = [];
  for (const [partnerId, msgs] of map.entries()) {
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const last = sorted[sorted.length - 1];
    const partnerName =
      String(last.senderId) === currentUserId
        ? (last.recipientName || 'Jogador')
        : (last.senderName   || 'Jogador');
    const unread = sorted.filter(
      (m) => String(m.recipientId) === currentUserId && !m.read
    ).length;
    convs.push({ partnerId, partnerName, messages: sorted, lastMessage: last, unreadCount: unread });
  }

  return convs.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime()
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '').join('') || '?';
}

// ── Componente: lista de conversas ────────────────────────────────────────────
function ConversationList({
  conversations,
  onSelect,
  currentUserId,
}: {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  currentUserId: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
        <span className="text-5xl">✉️</span>
        <p className="text-sm">Nenhuma conversa ainda.</p>
        <p className="text-xs text-zinc-600">
          Clique no barraco de um jogador no mapa para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {conversations.map((conv) => {
        const isMine = String(conv.lastMessage.senderId) === currentUserId;
        return (
          <button
            key={conv.partnerId}
            type="button"
            onClick={() => onSelect(conv)}
            className="flex items-center gap-3 px-4 py-4 text-left transition hover:bg-white/5 active:bg-white/10"
          >
            {/* Avatar */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-700 text-lg font-black text-white">
              {getInitials(conv.partnerName)}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-black text-white">{conv.partnerName}</p>
                <span className="shrink-0 text-[11px] text-zinc-500">
                  {formatTime(conv.lastMessage.createdAt)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-400">
                {isMine ? 'Você: ' : ''}
                {conv.lastMessage.body}
              </p>
            </div>

            {/* Badge não lido */}
            {conv.unreadCount > 0 && (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white">
                {conv.unreadCount}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Componente: tela da conversa (tipo WhatsApp) ──────────────────────────────
function ConversationView({
  conversation,
  currentUserId,
  isSending,
  onBack,
  onSend,
  onMarkRead,
}: {
  conversation: Conversation;
  currentUserId: string;
  isSending: boolean;
  onBack: () => void;
  onSend: (body: string) => Promise<boolean>;
  onMarkRead: (id: string) => void;
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Marca não lidas como lidas ao abrir
  useEffect(() => {
    conversation.messages.forEach((m) => {
      if (String(m.recipientId) === currentUserId && !m.read) {
        onMarkRead(m.id);
      }
    });
  }, [conversation.partnerId]);

  // Scroll para o fim quando chegam novas mensagens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages.length]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || isSending) return;
    const ok = await onSend(body);
    if (ok) setText('');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header da conversa */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-zinc-950 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl p-2 text-white/70 hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-700 font-black text-white">
          {getInitials(conversation.partnerName)}
        </div>
        <p className="font-black text-white">{conversation.partnerName}</p>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {conversation.messages.map((msg) => {
          const isMine = String(msg.senderId) === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? 'rounded-br-sm bg-red-700 text-white'
                    : 'rounded-bl-sm bg-zinc-800 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <div className={`mt-1 flex items-center gap-1 text-[11px] ${isMine ? 'justify-end text-red-200' : 'text-zinc-500'}`}>
                  {formatTime(msg.createdAt)}
                  {isMine && (
                    <span>{msg.read ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compositor */}
      <div className="flex items-end gap-2 border-t border-white/10 bg-zinc-950 px-4 py-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Digite uma mensagem..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-red-500/60"
          style={{ maxHeight: '120px' }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ── ChatPage principal ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const player = usePlayerStore((state) => state.player) as ExtendedPlayer | null;
  const playerLoaded = usePlayerStore((state) => state.isLoaded);

  const activeChannel    = useChatStore((s) => s.activeChannel);
  const setActiveChannel = useChatStore((s) => s.setActiveChannel);
  const complexoMessages = useChatStore((s) => s.complexoMessages);
  const faccaoMessages   = useChatStore((s) => s.faccaoMessages);
  const mailMessages     = useChatStore((s) => s.mailMessages);
  const factionHelpRequests    = useChatStore((s) => s.factionHelpRequests);
  const isLoading        = useChatStore((s) => s.isLoading);
  const isSending        = useChatStore((s) => s.isSending);
  const isHelpingRequest = useChatStore((s) => s.isHelpingRequest);
  const syncError        = useChatStore((s) => s.syncError);
  const loadChat                  = useChatStore((s) => s.loadChat);
  const fetchMessages             = useChatStore((s) => s.fetchMessages);
  const fetchFactionHelpRequests  = useChatStore((s) => s.fetchFactionHelpRequests);
  const startChatPolling          = useChatStore((s) => s.startChatPolling);
  const stopChatPolling           = useChatStore((s) => s.stopChatPolling);
  const sendComplexoMessage = useChatStore((s) => s.sendComplexoMessage);
  const sendFaccaoMessage   = useChatStore((s) => s.sendFaccaoMessage);
  const sendMailMessage     = useChatStore((s) => s.sendMailMessage);
  const markMailAsRead      = useChatStore((s) => s.markMailAsRead);
  const createFactionHelpRequest = useChatStore((s) => s.createFactionHelpRequest);
  const helpFactionRequest       = useChatStore((s) => s.helpFactionRequest);

  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [azideiaRewardsOpen, setAzideiaRewardsOpen] = useState(false);

  // ── Conversa selecionada no correio ─────────────────────────────────────
  const [selectedPartnerId,   setSelectedPartnerId]   = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');

  const currentUserId = String(player?._id || player?.googleId || '');
  const hasFaction    = Boolean(player?.factionId);


  // Bootstrap: lê canal e destinatário da URL
  useEffect(() => {
    if (hasBootstrapped) return;

    const queryChannel = searchParams.get('channel');
    const recipientId  = searchParams.get('recipientId');
    const recipientName = searchParams.get('recipientName');

    if (isValidChannel(queryChannel)) {
      setActiveChannel(queryChannel);
    } else {
      setActiveChannel('complexo');
    }

    // Pré-seleciona conversa se veio do mapa
    if (recipientId && recipientName) {
      setSelectedPartnerId(recipientId);
      setSelectedPartnerName(decodeURIComponent(recipientName));
      setActiveChannel('mail');
    }

    setHasBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!hasBootstrapped) return;
    void loadChat();
    startChatPolling();
    return () => stopChatPolling();
  }, [hasBootstrapped]);

  useEffect(() => {
    if (!hasBootstrapped) return;
    setSearchParams({ channel: activeChannel }, { replace: true });
    void fetchMessages(activeChannel, true);
    if (activeChannel === 'faccao' && player?.factionId) {
      void fetchFactionHelpRequests(true);
    }
  }, [activeChannel, hasBootstrapped, player?.factionId]);

  useEffect(() => {
    const handler = () => setAzideiaRewardsOpen(true);
    window.addEventListener('openAzideiaRewards', handler as EventListener);
    return () => window.removeEventListener('openAzideiaRewards', handler as EventListener);
  }, []);

  // ── Conversas agrupadas ──────────────────────────────────────────────────
  const conversations = useMemo(
    () => buildConversations(mailMessages, currentUserId),
    [mailMessages, currentUserId]
  );

  const selectedConversation = useMemo(() => {
    if (!selectedPartnerId) return null;
    // Pode ser uma conversa existente ou nova (ainda sem mensagens)
    return conversations.find((c) => c.partnerId === selectedPartnerId) ?? null;
  }, [conversations, selectedPartnerId]);

  const unreadMailCount = useMemo(
    () => conversations.reduce((acc, c) => acc + c.unreadCount, 0),
    [conversations]
  );

  // ── Send handlers ────────────────────────────────────────────────────────
  const handleSendComplexo = async (body: string) => sendComplexoMessage({ body });

  const handleSendFaccao = async (body: string) => {
    if (!hasFaction) return false;
    return sendFaccaoMessage({ body, factionId: player?.factionId || null });
  };

  const handleSendMail = async (body: string): Promise<boolean> => {
    if (!selectedPartnerId || !selectedPartnerName) return false;
    const ok = await sendMailMessage({
      recipientId:   selectedPartnerId,
      recipientName: selectedPartnerName,
      body,
    });
    if (ok) await fetchMessages('mail', true);
    return ok;
  };

  const handleMarkRead = (id: string) => { void markMailAsRead(id); };

  const handleChangeChannel = (ch: ChatChannelType) => {
    if (ch === 'faccao' && !hasFaction) return;
    setActiveChannel(ch);
    setSelectedPartnerId(null);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedPartnerId(conv.partnerId);
    setSelectedPartnerName(conv.partnerName);
  };

  const handleBackToList = () => {
    setSelectedPartnerId(null);
    setSelectedPartnerName('');
  };

  if (!playerLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-red-300">Você precisa estar autenticado para acessar o chat.</p>
      </div>
    );
  }

  // ── CORREIO: conversa aberta (tela cheia no mobile) ──────────────────────
  if (activeChannel === 'mail' && selectedPartnerId) {
    // Conversa com mensagens existentes ou conversa nova (sem histórico ainda)
    const conv: Conversation = selectedConversation ?? {
      partnerId:    selectedPartnerId,
      partnerName:  selectedPartnerName,
      messages:     [],
      lastMessage:  {} as ChatMessage,
      unreadCount:  0,
    };

    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <div className="flex flex-1 flex-col" style={{ height: '100vh' }}>
          <ConversationView
            conversation={conv}
            currentUserId={currentUserId}
            isSending={isSending}
            onBack={handleBackToList}
            onSend={handleSendMail}
            onMarkRead={handleMarkRead}
          />
        </div>
        <AzideiaRewardsModal open={azideiaRewardsOpen} onClose={() => setAzideiaRewardsOpen(false)} />
      </div>
    );
  }

  // ── LAYOUT PRINCIPAL ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-28 pt-8 md:pt-10">
        <div className="mb-4">
          <h1 className="font-heading text-3xl font-black uppercase tracking-wide">
            Comunicação
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chat do complexo, chat da facção e correio pessoal.
          </p>
        </div>

        <div className="mb-4">
          <ChatTabs
            activeChannel={activeChannel}
            onChangeChannel={handleChangeChannel}
            unreadMailCount={unreadMailCount}
            hasFaction={hasFaction}
          />
        </div>

        {syncError && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {syncError}
          </div>
        )}

        {/* ── CORREIO: lista de conversas ────────────────────────────────── */}
        {activeChannel === 'mail' && (
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Correio Pessoal
              </p>
            </div>

            {isLoading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : (
              <ConversationList
                conversations={conversations}
                currentUserId={currentUserId}
                onSelect={handleSelectConversation}
              />
            )}
          </div>
        )}

        {/* ── COMPLEXO / FACÇÃO: igual ao anterior ──────────────────────── */}
        {activeChannel !== 'mail' && (
          <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {activeChannel === 'complexo' ? 'Chat do Complexo' : 'Chat da Facção'}
              </p>

              {activeChannel === 'faccao' && hasFaction && (
                <button
                  type="button"
                  onClick={() => setAzideiaRewardsOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/35 bg-black/40 px-3 py-2 text-xs font-black uppercase text-white shadow-lg shadow-red-950/20 active:scale-95"
                  aria-label="Abrir coleta Azidéia da facção"
                  title="Coleta Azidéia"
                >
                  <span className="relative flex h-8 w-12 items-center">
                    <Image src={AZIDEIA_ICON_URL} alt="Azidéia" className="absolute left-0 h-8 w-8 object-contain" />
                    <Image src={AZIDEIA_CORRERIA_ICON_URL} alt="Correria" className="absolute right-0 h-8 w-8 object-contain" />
                  </span>
                  Coleta Azidéia
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <ChatMessageList
                messages={activeChannel === 'complexo' ? complexoMessages : faccaoMessages}
                channel={activeChannel}
                currentUserId={currentUserId}
                isLoading={isLoading}
                factionHelpRequests={activeChannel === 'faccao' ? factionHelpRequests : []}
                onHelpFactionRequest={(id) => { void helpFactionRequest(id); }}
                isHelpingRequest={isHelpingRequest}
              />
            </div>

            <div className="border-t border-border p-4">
              <ChatComposer
                channel={activeChannel}
                onSendMessage={activeChannel === 'complexo' ? handleSendComplexo : handleSendFaccao}
                isSending={isSending}
                mailReady={true}
                disabled={activeChannel === 'faccao' && !hasFaction}
                onRequestHelp={
                  activeChannel === 'faccao' && hasFaction
                    ? () => { void createFactionHelpRequest({ message: 'Família, fortalece no corre aí 🙏' }); }
                    : undefined
                }
                requestHelpDisabled={activeChannel === 'faccao' && !hasFaction}
              />
            </div>
          </div>
        )}
      </main>

      <AzideiaRewardsModal open={azideiaRewardsOpen} onClose={() => setAzideiaRewardsOpen(false)} />
    </div>
  );
}