import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

export default function ChatComposer() {
  const activeChannel = useChatStore((state) => state.activeChannel);
  const sendComplexoMessage = useChatStore((state) => state.sendComplexoMessage);
  const sendFaccaoMessage = useChatStore((state) => state.sendFaccaoMessage);
  const sendMailMessage = useChatStore((state) => state.sendMailMessage);
  const isLoading = useChatStore((state) => state.isLoading);
  const syncError = useChatStore((state) => state.syncError);

  const player = usePlayerStore((state) => state.player);

  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const senderId = player?._id || '';
  const senderName = player?.name || 'Jogador';
  const factionId =
    (player as any)?.faction?.factionId ||
    (player as any)?.factionId ||
    '';

  const handleSend = async () => {
    if (!body.trim() || !senderId) return;

    try {
      if (activeChannel === 'complexo') {
        await sendComplexoMessage({
          senderId,
          senderName,
          body: body.trim(),
        });

        setBody('');
        return;
      }

      if (activeChannel === 'faccao') {
        if (!factionId) return;

        await sendFaccaoMessage({
          senderId,
          senderName,
          factionId,
          body: body.trim(),
        });

        setBody('');
        return;
      }

      if (!recipientId.trim() || !recipientName.trim()) return;

      await sendMailMessage({
        senderId,
        senderName,
        recipientId: recipientId.trim(),
        recipientName: recipientName.trim(),
        subject: subject.trim() || 'Sem assunto',
        body: body.trim(),
      });

      setBody('');
      setSubject('');
      setRecipientId('');
      setRecipientName('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-black/40 p-4">
      {activeChannel === 'mail' && (
        <>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Nome do destinatário"
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
          />

          <input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="ID do destinatário"
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
          />

          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto"
            className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none"
          />
        </>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          activeChannel === 'complexo'
            ? 'Fale com todo o Complexo...'
            : activeChannel === 'faccao'
              ? 'Fale com a sua facção...'
              : 'Escreva sua mensagem...'
        }
        className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none resize-none"
      />

      {syncError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {syncError}
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={isLoading}
        className="w-full rounded-2xl bg-emerald-500 px-4 py-4 font-black text-black disabled:opacity-60"
      >
        {isLoading ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  );
}