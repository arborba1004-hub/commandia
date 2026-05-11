import type { GalleryVideoPalette } from '@/data/galleryVideoPalettes';

interface TintedVideoCardProps {
  src: string;
  palette: GalleryVideoPalette;
}

export default function TintedVideoCard({
  src,
  palette,
}: TintedVideoCardProps) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      <video
        src={src}
        controls
        loop
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover rounded-lg"
        style={{
          filter: `
            hue-rotate(${palette.hueRotate}deg)
            saturate(${palette.saturate})
            brightness(${palette.brightness})
            contrast(${palette.contrast})
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          background: palette.overlay,
          mixBlendMode: palette.mixBlendMode || 'soft-light',
        }}
      />
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 via-transparent to-white/5" />
    </div>
  );
}
