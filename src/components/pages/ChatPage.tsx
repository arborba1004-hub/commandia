import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ChatComposer from '@/components/chat/ChatComposer';
import ChatMessageList from '@/components/chat/ChatMessageList';
import ChatTabs from '@/components/chat/ChatTabs';

export default function ChatPage() {
  return (
      <div className="min-h-screen bg-black text-white flex flex-col">
            <Header />

                  <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-4">
                          <div>
                                    <h1 className="text-4xl font-black text-white">Comunicação</h1>
                                              <p className="text-zinc-400 mt-2">
                                                          Complexo, facção e correio pessoal.
                                                                    </p>
                                                                            </div>

                                                                                    <ChatTabs />
                                                                                            <ChatMessageList />
                                                                                                    <ChatComposer />
                                                                                                          </main>

                                                                                                                <Footer />
                                                                                                                    </div>
                                                                                                                      );
                                                                                                                      }
