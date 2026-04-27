import { useState } from 'react';
import { Image } from '@/components/ui/image';

type EmojiItem = {
  id: string;
  label: string;
  shortcode: string;
  imageUrl: string;
};

interface EmojiPickerProps {
  onSelectEmoji: (value: string) => void;
}

function buildImageToken(id: string, src: string, alt: string) {
  return `[imgemoji:${id}|${src}|${alt}]`;
}

export default function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  const [customEmojis, setCustomEmojis] = useState<EmojiItem[]>([]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/emoji/upload', {
      method: 'POST',
      body: form,
    });

    const emoji: EmojiItem = await res.json();

    setCustomEmojis((prev) => [...prev, emoji]);

    onSelectEmoji(
      buildImageToken(emoji.id, emoji.imageUrl, emoji.label)
    );
  }

  return (
    <div className="w-[320px] rounded-2xl border border-border bg-card p-3 shadow-2xl">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Emojis e stickers
      </div>

      {/* UPLOAD DIRETO */}
      <label className="mb-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-3 text-xs text-muted-foreground hover:bg-muted">
        Upload emoji
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

      {/* CUSTOM EMOJIS */}
      <div className="grid grid-cols-6 gap-2">
        {customEmojis.map((emoji) => (
          <button
            key={emoji.id}
            type="button"
            onClick={() =>
              onSelectEmoji(
                buildImageToken(
                  emoji.id,
                  emoji.imageUrl,
                  emoji.label
                )
              )
            }
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
  );
}