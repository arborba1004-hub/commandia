export interface CustomEmoji {
  id: string;
  label: string;
  shortcode: string;
  imageUrl: string;
}

export const CUSTOM_EMOJIS: CustomEmoji[] = [
  {
    id: 'comando-hostil',
    label: 'Comando Hostil',
    shortcode: ':comando_hostil:',
    imageUrl: '/emojis/comando-hostil.png',
  },
  {
    id: 'comando-apaixonado',
    label: 'Comando Apaixonado',
    shortcode: ':comando_apaixonado:',
    imageUrl: '/emojis/comando-apaixonado.png',
  },
  {
    id: 'sextou',
    label: 'Sextou',
    shortcode: ':sextou:',
    imageUrl: '/emojis/sextou.png',
  },
];
