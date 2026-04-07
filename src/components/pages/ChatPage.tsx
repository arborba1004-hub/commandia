import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';
import { useEffect } from 'react';


export default function ChatPage() {
  const activeChannel = useChatStore((state) => state.activeChannel);
  const setActiveChannel = useChatStore((state) => state.setActiveChannel);
  const mailMessages = useChatStore((state) => state.mailMessages);
  const loadChat = useChatStore((state) => state.loadChat);
  const syncError = useChatStore((state) => state.syncError);

  const player = usePlayerStore((state) => state.player);
  const isLoaded = usePlayerStore((state) => state.isLoaded);

  useEffect(() => {
    if (isLoaded && player?._id) {
      loadChat();
    }
  }, [isLoaded, player?._id, loadChat]);

  const unreadCount = mailMessages.filter((msg) => !msg.read).length;

  const channelTitle =
    activeChannel === 'complexo'
      ? 'Chat do Complexo'
      : activeChannel === 'faccao'
        ? 'Chat da Facção'
        : 'Correio Pessoal';

  const channelSubtitle =
    activeChannel === 'complexo'
      ? 'Converse com todos os jogadores da comunidade.'
      : activeChannel === 'faccao'
        ? 'Comunicação privada da sua facção.'
        : 'Mensagens privadas e avisos do sistema.';

  const tabClass = (active: boolean) =>
    `relative rounded-2xl px-4 py-3 font-black transition-all ${
      active
        ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(0,255,120,0.35)]'
        : 'bg-zinc-900 text-white hover:bg-zinc-800 border border-white/10'
    }`;

  if (!isLoaded || !player?._id) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Faça login para acessar o chat</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 space-y-4">
          <div>
            <h1 className="text-4xl font-black text-white">{channelTitle}</h1>
            <p className="text-zinc-400 mt-2">{channelSubtitle}</p>
          </div>

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
        </div>

        {syncError && (
          <div className="rounded-3xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {syncError}
          </div>
        )}

        <ChatMessageList />
        <ChatComposer />
      </main>

      <Footer />
    </div>
  );
}