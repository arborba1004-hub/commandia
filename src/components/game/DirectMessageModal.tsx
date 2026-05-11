import { useEffect, useRef, useState, useMemo } from 'react';
import { X, Send, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import { Image } from '@/components/ui/image';

export type DirectMessageTarget = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

interface DirectMessageModalProps {
  isOpen: boolean;
  target: DirectMessageTarget | null;
  onClose: () => void;
}

function getInitials(name: string) {
  return (name || 'J').trim().split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '').join('') || 'J';
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

export default function DirectMessageModal({
  isOpen, target, onClose,
}: DirectMessageModalProps) {
  const [text, setText]       = useState('');
  const [sent, setSent]       = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  const player        = usePlayerStore((s) => s.player);
  const currentUserId = String((player as any)?._id || (player as any)?.googleId || '');

  const mailMessages      = useChatStore((s) => s.mailMessages);
  const isSending         = useChatStore((s) => s.isSending);
  const sendMailMessage   = useChatStore((s) => s.sendMailMessage);
  const fetchMessages     = useChatStore((s) => s.fetchMessages);

  // Filtra mensagens da conversa com esse jogador específico
  const conversation = useMemo(() => {
    if (!target?.id || !currentUserId) return [];
    return [...mailMessages]
      .filter((m) => {
        const sid = String(m.senderId    || '');
        const rid = String(m.recipientId || '');
        const tid = String(target.id);
        return (
          (sid === currentUserId && rid === tid) ||
          (sid === tid && rid === currentUserId)
        );
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [mailMessages, target?.id, currentUserId]);

  // Carrega mensagens ao abrir
  useEffect(() => {
    if (isOpen && target?.id) {
      setSent(false);
      setText('');
      void fetchMessages('mail', true);
    }
  }, [isOpen, target?.id]);

  // Scroll para o fim quando chegam mensagens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [conversation.length, isOpen]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !target?.id || isSending) return;

    const ok = await sendMailMessage({
      recipientId:   target.id,
      recipientName: target.name,
      body,
    });

    if (ok) {
      setText('');
      setSent(true);
      await fetchMessages('mail', true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  if (!target) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#090909] p-0 text-white">
        <div className="flex flex-col" style={{ maxHeight: '80vh' }}>

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            {target.avatarUrl ? (
              <Image src={target.avatarUrl} alt={target.name} className="h-9 w-9 rounded-full object-cover border border-white/10" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-700 font-black text-sm text-white">
                {getInitials(target.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate font-black text-white">{target.name}</p>
              <p className="text-[11px] text-zinc-500">Correio pessoal</p>
            </div>
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Histórico da conversa */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[120px] max-h-[320px]">
            {conversation.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-sm text-zinc-600">
                Nenhuma mensagem ainda. Seja o primeiro a escrever.
              </div>
            ) : (
              conversation.map((msg) => {
                const isMine = String(msg.senderId) === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      isMine
                        ? 'rounded-br-sm bg-red-700 text-white'
                        : 'rounded-bl-sm bg-zinc-800 text-white'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div className={`mt-1 text-[10px] ${isMine ? 'text-right text-red-200' : 'text-zinc-500'}`}>
                        {formatTime(msg.createdAt)}
                        {isMine && <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compositor */}
          <div className="border-t border-white/10 px-4 py-3">
            {sent && conversation.length > 0 && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                ✓ Mensagem enviada
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={`Mensagem para ${target.name}...`}
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/50"
                style={{ maxHeight: '100px' }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() || isSending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white disabled:opacity-40 hover:bg-red-500 transition"
              >
                <Send size={16} />
              </button>
            </div>

            {/* Link para abrir a conversa completa no chat */}
            {conversation.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = `/chat?channel=mail&recipientId=${target.id}&recipientName=${encodeURIComponent(target.name)}`;
                }}
                className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition"
              >
                Ver conversa completa no correio <ArrowRight size={12} />
              </button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}