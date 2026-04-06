import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatTabs from '@/components/chat/ChatTabs';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import { useChatStore } from '@/store/chatStore';

export default function ChatPage() {
  const activeChannel = useChatStore((state) => state.activeChannel);

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
          <h1 className="text-4xl font-black text-white">{channelTitle}</h1>
          <p className="text-zinc-400 mt-2">{channelSubtitle}</p>
        </div>

        <ChatTabs />
        <ChatMessageList />
        <ChatComposer />
      </main>

      <Footer />
    </div>
  );
}