import { useState } from 'react';
import EmojiPicker from '@/components/chat/EmojiPicker';

interface ChatComposerProps {
  channel: 'complexo' | 'faccao' | 'mail';
  onSendMessage: (body: string) => Promise<boolean> | boolean;
  isSending?: boolean;
  mailReady?: boolean;
}

export default function ChatComposer({
  channel,
  onSendMessage,
  isSending = false,
  mailReady = true,
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);

  const placeholder =
    channel === 'complexo'
      ? 'Manda a visão pro complexo...'
      : channel === 'faccao'
        ? 'Fala com a facção...'
        : 'Escreva seu correio pessoal...';

  const canSend = message.trim().length > 0 && !isSending && mailReady;

  const handleSend = async () => {
    const body = message.trim();
    if (!body || !canSend) return;

    const ok = await onSendMessage(body);
    if (ok) {
      setMessage('');
      setEmojiOpen(false);
    }
  };

  return (
    <div className="relative">
      {emojiOpen && (
        <div className="absolute bottom-[72px] left-0 z-20">
          <EmojiPicker
            onSelectEmoji={(emoji) => {
              setMessage((prev) => prev + emoji);
            }}
          />
        </div>
      )}

      <div className="flex items-end gap-3">
        <button
          type="button"
          onClick={() => setEmojiOpen((prev) => !prev)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-xl hover:bg-muted"
        >
          😊
        </button>

        <div className="flex-1 rounded-2xl border border-border bg-background px-4 py-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={mailReady ? placeholder : 'Preencha destinatário e nome primeiro...'}
            disabled={isSending || !mailReady}
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            void handleSend();
          }}
          disabled={!canSend}
          className="h-12 rounded-2xl bg-red-600 px-5 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50"
        >
          {isSending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}