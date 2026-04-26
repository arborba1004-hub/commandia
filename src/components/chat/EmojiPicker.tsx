import { Image } from '@/components/ui/image';
import CUSTOM_EMOJIS from '@/data/customEmojis.json';

type EmojiPickerItem =
  | { type: 'unicode'; value: string }
  | { type: 'image'; id: string; src: string; alt: string };

interface EmojiPickerProps {
  onSelectEmoji: (value: string) => void;
}

const EMOJI_ITEMS: EmojiPickerItem[] = [
  { type: 'unicode', value: '💥' }
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

      {/* Custom Emojis Section */}
      <div className="mb-3 border-b border-border pb-3">
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Customizados
        </div>

        <div className="grid grid-cols-6 gap-2">
          {CUSTOM_EMOJIS.map((emoji) => (
            <button
              key={emoji.id}
              type="button"
              onClick={() => onSelectEmoji(emoji.shortcode)}
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-background hover:bg-muted"
              title={emoji.label}
            >
              <Image
                src={emoji.imageUrl}
                alt={emoji.label}
                className="h-10 w-10 object-contain"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Unicode Emojis Section */}
      <div>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">
          Padrão
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
                  onSelectEmoji(
                    buildImageToken(item.id, item.src, item.alt)
                  );
                }
              }}
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-background hover:bg-muted"
            >
              {item.type === 'unicode' ? (
                <span className="text-xl">{item.value}</span>
              ) : (
                <Image
                  src={item.src}
                  alt={item.alt}
                  className="h-10 w-10 object-contain"
                  draggable={false}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}