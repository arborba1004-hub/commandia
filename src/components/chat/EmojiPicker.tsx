import { Image } from '@/components/ui/image';
type EmojiPickerItem =
  | { type: 'unicode'; value: string }
  | { type: 'image'; id: string; src: string; alt: string };

interface EmojiPickerProps {
  onSelectEmoji: (value: string) => void;
}

const EMOJI_ITEMS: EmojiPickerItem[] = [
  { type: 'unicode', value: '🔥' },
  { type: 'unicode', value: '💰' },
  { type: 'unicode', value: '💎' },
  { type: 'unicode', value: '🚔' },
  { type: 'unicode', value: '🔫' },
  { type: 'unicode', value: '😈' },
  { type: 'unicode', value: '😎' },
  { type: 'unicode', value: '😂' },
  { type: 'unicode', value: '😭' },
  { type: 'unicode', value: '❤️' },
  { type: 'unicode', value: '💣' },
  { type: 'unicode', value: '⚡' },
  { type: 'unicode', value: '👑' },
  { type: 'unicode', value: '🖤' },
  { type: 'unicode', value: '🤝' },
  { type: 'unicode', value: '😡' },
  { type: 'unicode', value: '🥶' },
  { type: 'unicode', value: '🍀' },
  { type: 'unicode', value: '🎯' },
  { type: 'unicode', value: '🏆' },
  { type: 'unicode', value: '📩' },
  { type: 'unicode', value: '📦' },
  { type: 'unicode', value: '🚀' },
  { type: 'unicode', value: '💥' },

  {
    type: 'image',
    id: 'comando-apaixonado',
    src: 'https://static.wixstatic.com/media/50f4bf_510e83d240c84061a9ae051d0c4be0af~mv2.png',
    alt: 'Comando Apaixonado',
  },
  {
    type: 'image',
    id: 'comando-hostil',
    src: 'https://static.wixstatic.com/media/50f4bf_fe66f84eeecf4b18ad5c8a07b3e807f7~mv2.png',
    alt: 'Comando Hostil',
  },
  {
    type: 'image',
    id: 'sextou',
    src: 'https://static.wixstatic.com/media/50f4bf_0fe37c167b134ab280c353da7c7dd9f2~mv2.png',
    alt: 'Sextou',
  },
];

function buildImageToken(id: string, src: string, alt: string) {
  return `[imgemoji:${id}|${src}|${alt}]`;
}

export default function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  return (
    <div className="w-[320px] rounded-2xl border border-border bg-card p-3 shadow-2xl">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Emojis e stickers
      </div>

      <div className="grid grid-cols-6 gap-2">
        {EMOJI_ITEMS.map((item, index) => (
          <button
            key={item.type === 'unicode' ? `${item.value}-${index}` : item.id}
            type="button"
            onClick={() => {
              if (item.type === 'unicode') {
                onSelectEmoji(item.value);
              } else {
                onSelectEmoji(buildImageToken(item.id, item.src, item.alt));
              }
            }}
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-background hover:bg-muted"
          >
            {item.type === 'unicode' ? (
              <span className="text-xl">{item.value}</span>
            ) : (
              <Image src={item.src} alt={item.alt} className="h-10 w-10 object-contain" draggable={false} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}