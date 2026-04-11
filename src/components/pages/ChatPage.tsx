import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatTabs from '@/components/chat/chatTabs';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

type MailRecipient = {
  id: string;
  name: string;
};

export default function ChatPage() {
  const player = usePlayerStore((state) => state.player);

  const {
    activeChannel,
    setActiveChannel,
    complexoMessages,
    faccaoMessages,
    mailMessages,
    isLoading,
    isSending,
    syncError,
    loadChat,
    startChatPolling,
    stopChatPolling,
    sendComplexoMessage,
    sendFaccaoMessage,
    sendMailMessage,
    markMailAsRead,
  } = useChatStore();

  const [mailRecipientId, setMailRecipientId] = useState('');
  const [mailRecipientName, setMailRecipientName] = useState('');
  const [mailSubject, setMailSubject] = useState('');

  useEffect(() => {
    void loadChat();
    startChatPolling();

    return () => {
      stopChatPolling();
    };
  }, [loadChat, startChatPolling, stopChatPolling]);

  const currentMessages = useMemo(() => {
    if (activeChannel === 'complexo') return complexoMessages;
    if (activeChannel === 'faccao') return faccaoMessages;
    return mailMessages;
  }, [activeChannel, complexoMessages, faccaoMessages, mailMessages]);

  const unreadMailCount = useMemo(() => {
    const myId = String(player?._id || player?.googleId || '');
    return mailMessages.filter(
      (message) =>
        message.channel === 'mail' &&
        String(message.recipientId || '') === myId &&
        !message.read
    ).length;
  }, [mailMessages, player?._id, player?.googleId]);

  const handleSendMessage = async (body: string) => {
    if (activeChannel === 'complexo') {
      return sendComplexoMessage({ body });
    }

    if (activeChannel === 'faccao') {
      return sendFaccaoMessage({
        body,
        factionId: (player as any)?.factionId || null,
      });
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

  const mailRecipientsPreview: MailRecipient[] = useMemo(() => {
    const myId = String(player?._id || player?.googleId || '');

    const map = new Map<string, MailRecipient>();

    for (const message of mailMessages) {
      const senderId = String(message.senderId || '');
      const recipientId = String(message.recipientId || '');

      if (senderId && senderId !== myId) {
        map.set(senderId, {
          id: senderId,
          name: message.senderName || 'Jogador',
        });
      }

      if (recipientId && recipientId !== myId) {
        map.set(recipientId, {
          id: recipientId,
          name: message.recipientName || 'Jogador',
        });
      }
    }

    return Array.from(map.values()).slice(0, 8);
  }, [mailMessages, player?._id, player?.googleId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-28 pt-4">
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
            onChangeChannel={setActiveChannel}
            unreadMailCount={unreadMailCount}
            hasFaction={Boolean((player as any)?.factionId)}
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
              currentUserId={String(player?._id || player?.googleId || '')}
              isLoading={isLoading}
              onOpenMail={handleMailOpen}
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
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}