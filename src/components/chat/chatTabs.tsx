import { useChatStore } from '@/store/chatStore';

export default function ChatTabs() {
  const active = useChatStore((s) => s.activeChannel);
  const setChannel = useChatStore((s) => s.setActiveChannel);

  return (
    <div className="flex gap-2 p-2">
      <button
        onClick={() => setChannel('complexo')}
        className={active === 'complexo' ? 'text-green-400' : ''}
      >
        🌍 Complexo
      </button>

      <button
        onClick={() => setChannel('faccao')}
        className={active === 'faccao' ? 'text-green-400' : ''}
      >
        👥 Facção
      </button>

      <button
        onClick={() => setChannel('mail')}
        className={active === 'mail' ? 'text-green-400' : ''}
      >
        📩 Correio
      </button>
    </div>
  );
}