import { useMemo } from 'react';
import { useChatStore } from '@/store/chatStore';

export default function ChatTabs() {
  const activeChannel = useChatStore((state) => state.activeChannel);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const mailMessages = useChatStore((state) => state.mailMessages);

  const unreadCount = useMemo(() => {
    return mailMessages.filter((msg) => !msg.read).length;
  }, [mailMessages]);

  const tabClass = (active: boolean) =>
    `relative flex-1 rounded-2xl px-4 py-3 font-black transition-all ${
      active
        ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(0,255,120,0.35)]'
        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-white/10'
    }`;

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => setActiveChannel('complexo')}
        className={tabClass(activeChannel === 'complexo')}
      >
        Complexo
      </button>

      <button
        onClick={() => setActiveChannel('faccao')}
        className={tabClass(activeChannel === 'faccao')}
      >
        Facção
      </button>

      <button
        onClick={() => setActiveChannel('mail')}
        className={tabClass(activeChannel === 'mail')}
      >
        Correio

        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[26px] h-[26px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-2 border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}