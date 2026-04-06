import { useChatStore } from '@/store/chatStore';

export default function ChatTabs() {
  const activeChannel = useChatStore((state) => state.activeChannel);
    const setActiveChannel = useChatStore((state) => state.setActiveChannel);

      const tabClass = (active: boolean) =>
          `flex-1 rounded-2xl px-4 py-3 font-black transition-all ${
                active
                        ? 'bg-emerald-500 text-black'
                                : 'bg-zinc-800 text-white hover:bg-zinc-700'
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
                                                                                                                                                                        </button>
                                                                                                                                                                            </div>
                                                                                                                                                                              );
                                                                                                                                                                              }
