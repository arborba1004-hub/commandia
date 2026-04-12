export type GalleryVideoPalette = {
  hueRotate: number;
  saturate: number;
  brightness: number;
  contrast: number;
  overlay: string;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
};

export function getGalleryVideoPalette(level: number): GalleryVideoPalette {
  const paletteIndex = ((level - 1) % 6) + 1;

  switch (paletteIndex) {
    case 1:
      return {
        hueRotate: 0,
        saturate: 1.25,
        brightness: 0.95,
        contrast: 1.12,
        overlay: 'linear-gradient(135deg, rgba(60,110,255,0.22), rgba(170,80,255,0.18))',
        mixBlendMode: 'soft-light',
      };
    case 2:
      return {
        hueRotate: 40,
        saturate: 1.35,
        brightness: 1,
        contrast: 1.12,
        overlay: 'linear-gradient(135deg, rgba(255,90,170,0.20), rgba(255,180,70,0.22))',
        mixBlendMode: 'color',
      };
    case 3:
      return {
        hueRotate: 85,
        saturate: 1.4,
        brightness: 0.98,
        contrast: 1.15,
        overlay: 'linear-gradient(135deg, rgba(90,255,180,0.18), rgba(40,140,255,0.18))',
        mixBlendMode: 'overlay',
      };
    case 4:
      return {
        hueRotate: 140,
        saturate: 1.45,
        brightness: 0.96,
        contrast: 1.16,
        overlay: 'linear-gradient(135deg, rgba(70,255,120,0.18), rgba(20,255,220,0.18))',
        mixBlendMode: 'soft-light',
      };
    case 5:
      return {
        hueRotate: 220,
        saturate: 1.5,
        brightness: 0.94,
        contrast: 1.18,
        overlay: 'linear-gradient(135deg, rgba(255,60,90,0.20), rgba(120,40,255,0.20))',
        mixBlendMode: 'color',
      };
    default:
      return {
        hueRotate: 300,
        saturate: 1.35,
        brightness: 0.97,
        contrast: 1.14,
        overlay: 'linear-gradient(135deg, rgba(255,230,90,0.16), rgba(255,120,40,0.18))',
        mixBlendMode: 'soft-light',
      };
  }
}
