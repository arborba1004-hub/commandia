import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatTabs from '@/components/chat/chatTabs';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

interface ExtendedPlayer {
  _id?: string;
  googleId?: string;
  factionId?: string;
  name?: string;
  email?: string;
}

type MailRecipient = {
  id: string;
  name: string;
};

type ChatChannelType = 'complexo' | 'faccao' | 'mail';

function isValidChannel(value: string | null): value is ChatChannelType {
  return value === 'complexo' || value === 'faccao' || value === 'mail';
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const player = usePlayerStore((state) => state.player) as ExtendedPlayer | null;

  const activeChannel = useChatStore((state) => state.activeChannel);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const complexoMessages = useChatStore((state) => state.complexoMessages);
  const faccaoMessages = useChatStore((state) => state.faccaoMessages);
  const mailMessages = useChatStore((state) => state.mailMessages);
  const factionHelpRequests = useChatStore((state) => state.factionHelpRequests);
  const isLoading = useChatStore((state) => state.isLoading);
  const isSending = useChatStore((state) => state.isSending);
  const isHelpingRequest = useChatStore((state) => state.isHelpingRequest);
  const syncError = useChatStore((state) => state.syncError);
  const loadChat = useChatStore((state) => state.loadChat);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const fetchFactionHelpRequests = useChatStore((state) => state.fetchFactionHelpRequests);
  const startChatPolling = useChatStore((state) => state.startChatPolling);
  const stopChatPolling = useChatStore((state) => state.stopChatPolling);
  const sendComplexoMessage = useChatStore((state) => state.sendComplexoMessage);
  const sendFaccaoMessage = useChatStore((state) => state.sendFaccaoMessage);
  const sendMailMessage = useChatStore((state) => state.sendMailMessage);
  const markMailAsRead = useChatStore((state) => state.markMailAsRead);
  const createFactionHelpRequest = useChatStore((state) => state.createFactionHelpRequest);
  const helpFactionRequest = useChatStore((state) => state.helpFactionRequest);

  const [mailRecipientId, setMailRecipientId] = useState('');
  const [mailRecipientName, setMailRecipientName] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  const currentUserId = String(player?._id || player?.googleId || '');
  const hasFaction = Boolean(player?.factionId);

  useEffect(() => {
    if (hasBootstrapped) return;

    const queryChannel = searchParams.get('channel');
    const sessionChannel = sessionStorage.getItem('chat_active_channel');

    if (isValidChannel(queryChannel)) {
      setActiveChannel(queryChannel);
    } else if (isValidChannel(sessionChannel)) {
      setActiveChannel(sessionChannel);
    }

    setHasBootstrapped(true);
  }, [hasBootstrapped, searchParams, setActiveChannel]);

  useEffect(() => {
    if (!hasBootstrapped) return;

    void loadChat();
    startChatPolling();

    return () => {
      stopChatPolling();
    };
  }, [hasBootstrapped, loadChat, startChatPolling, stopChatPolling]);

  useEffect(() => {
    if (!hasBootstrapped) return;

    sessionStorage.setItem('chat_active_channel', activeChannel);
    setSearchParams({ channel: activeChannel }, { replace: true });

    void fetchMessages(activeChannel, true);

    if (activeChannel === 'faccao' && hasFaction) {
      void fetchFactionHelpRequests(true);
    }
  }, [
    activeChannel,
    hasBootstrapped,
    setSearchParams,
    fetchMessages,
    fetchFactionHelpRequests,
    hasFaction,
  ]);

  const currentMessages = useMemo(() => {
    if (activeChannel === 'complexo') return complexoMessages;
    if (activeChannel === 'faccao') return faccaoMessages;
    return mailMessages;
  }, [activeChannel, complexoMessages, faccaoMessages, mailMessages]);

  const unreadMailCount = useMemo(() => {
    return mailMessages.filter(
      (message) =>
        message.channel === 'mail' &&
        String(message.recipientId || '') === currentUserId &&
        !message.read
    ).length;
  }, [mailMessages, currentUserId]);

  const currentUserRequestedToday = useMemo(() => {
    return factionHelpRequests.some(
      (request) => String(request.requesterId) === currentUserId
    );
  }, [factionHelpRequests, currentUserId]);

  const handleSendMessage = async (body: string) => {
    if (activeChannel === 'complexo') {
      return sendComplexoMessage({ body });
    }

    if (activeChannel === 'faccao') {
      if (!hasFaction) {
        return false;
      }

      return sendFaccaoMessage({
        body,
        factionId: player?.factionId || null,
      });
    }

    if (!mailRecipientId.trim() || !mailRecipientName.trim()) {
      return false;
    }

    return sendMailMessage({
      recipientId: mailRecipientId,
      recipientName: mailRecipientName,
      subject: mailSubject,
      body,
    });
  };

  const handleMailOpen = async (messageId: string) => {
    await markMailAsRead(messageId);
  };

  const handleChangeChannel = (channel: ChatChannelType) => {
    if (channel === 'faccao' && !hasFaction) return;
    setActiveChannel(channel);
  };

  const handleCreateHelpRequest = async () => {
    await createFactionHelpRequest({
      message: 'Família, fortalece no corre aí 🙏',
    });
  };

  const handleHelpRequest = async (requestId: string) => {
    await helpFactionRequest(requestId);
  };

  const mailRecipientsPreview: MailRecipient[] = useMemo(() => {
    const map = new Map<string, MailRecipient>();

    for (const message of mailMessages) {
      const senderId = String(message.senderId || '');
      const recipientId = String(message.recipientId || '');

      if (senderId && senderId !== currentUserId) {
        map.set(senderId, {
          id: senderId,
          name: message.senderName || 'Jogador',
        });
      }

      if (recipientId && recipientId !== currentUserId) {
        map.set(recipientId, {
          id: recipientId,
          name: message.recipientName || 'Jogador',
        });
      }
    }

    return Array.from(map.values()).slice(0, 8);
  }, [mailMessages, currentUserId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-28 pt-[140px] md:pt-[160px]">
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

        {activeChannel === 'mail' && (
          <div className="mb-4 rounded-3xl border border-border bg-card p-4">
            <h2 className="mb-3 font-heading text-lg font-bold uppercase">
              Novo correio
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={mailRecipientId}
                onChange={(e) => setMailRecipientId(e.target.value)}
                placeholder="ID do destinatário"
                className="rounded-2xl border border-border bg-background px-4 py-3 outline-none"
              />

              <input
                value={mailRecipientName}
                onChange={(e) => setMailRecipientName(e.target.value)}
                placeholder="Nome do destinatário"
                className="rounded-2xl border border-border bg-background px-4 py-3 outline-none"
              />

              <div className="md:col-span-2">
                <input
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  placeholder="Assunto"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none"
                />
              </div>
            </div>

            {mailRecipientsPreview.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Contatos recentes
                </p>

                <div className="flex flex-wrap gap-2">
                  {mailRecipientsPreview.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => {
                        setMailRecipientId(recipient.id);
                        setMailRecipientName(recipient.name);
                      }}
                      className="rounded-full border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
                      type="button"
                    >
                      {recipient.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {activeChannel === 'complexo'
                ? 'Chat do Complexo'
                : activeChannel === 'faccao'
                  ? 'Chat da Facção'
                  : 'Correio Pessoal'}
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatMessageList
              messages={currentMessages}
              channel={activeChannel}
              currentUserId={currentUserId}
              isLoading={isLoading}
              onOpenMail={handleMailOpen}
              factionHelpRequests={activeChannel === 'faccao' ? factionHelpRequests : []}
              onHelpFactionRequest={handleHelpRequest}
              isHelpingRequest={isHelpingRequest}
            />
          </div>

          <div className="border-t border-border p-4">
            <ChatComposer
              channel={activeChannel}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              mailReady={
                activeChannel !== 'mail' ||
                Boolean(mailRecipientId.trim() && mailRecipientName.trim())
              }
              disabled={activeChannel === 'faccao' && !hasFaction}
              onRequestHelp={
                activeChannel === 'faccao' && hasFaction ? handleCreateHelpRequest : undefined
              }
              requestHelpDisabled={
                activeChannel === 'faccao' &&
                (!hasFaction || currentUserRequestedToday || isHelpingRequest)
              }
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}