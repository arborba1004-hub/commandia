import { Image } from '@/components/ui/image';
type ChatChannelType = 'complexo' | 'faccao' | 'mail';

interface ChatTabsProps {
  activeChannel: ChatChannelType;
  onChangeChannel: (channel: ChatChannelType) => void;
  unreadMailCount?: number;
  hasFaction?: boolean;
}

const TAB_ICONS: Record<ChatChannelType, string> = {
  complexo:
    'https://static.wixstatic.com/media/50f4bf_af442ef88fac45288bc762a40c07c343~mv2.png',
  faccao:
    'https://static.wixstatic.com/media/50f4bf_f00228a9eaa84c13ab83c4f3a6365649~mv2.png',
  mail:
    'https://static.wixstatic.com/media/50f4bf_e602f889654541a9aa2dfd057dad00bc~mv2.png',
};

export default function ChatTabs({
  activeChannel,
  onChangeChannel,
  unreadMailCount = 0,
  hasFaction = false,
}: ChatTabsProps) {
  const tabs: Array<{
    key: ChatChannelType;
    label: string;
    disabled?: boolean;
    badge?: number;
  }> = [
    { key: 'complexo', label: 'Complexo' },
    { key: 'faccao', label: 'Facção', disabled: !hasFaction },
    { key: 'mail', label: 'Correio', badge: unreadMailCount },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {tabs.map((tab) => {
        const isActive = activeChannel === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) onChangeChannel(tab.key);
            }}
            className={[
              'relative flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 transition-all',
              isActive
                ? 'border-red-500 bg-red-600 text-white shadow-lg'
                : 'border-border bg-card text-foreground hover:bg-muted',
              tab.disabled ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
          >
            <Image src={TAB_ICONS[tab.key]} alt={tab.label} className="h-10 w-10 object-contain" draggable={false} />

            <span className="text-xs font-black uppercase tracking-wide">
              {tab.label}
            </span>

            {!!tab.badge && tab.badge > 0 && (
              <span className="absolute right-2 top-2 min-w-[22px] rounded-full bg-yellow-400 px-2 py-1 text-[11px] font-black leading-none text-black">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}