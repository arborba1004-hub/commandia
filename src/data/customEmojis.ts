export interface CustomEmoji {
  id: string;
  label: string;
  shortcode: string;
  imageUrl: string;
}

export const CUSTOM_EMOJIS: CustomEmoji[] = [
  {
    id: 'comando-hostil',
    label: 'Hostil',
    shortcode: ':comando_hostil:',
    imageUrl: 'https://static.wixstatic.com/media/50f4bf_09f750dd2652488682d59d8381a26d0b~mv2.png',
  },
  {
    id: 'comando-apaixonado',
    label: 'Apaixonado',
    shortcode: ':comando_apaixonado:',
    imageUrl: 'https://static.wixstatic.com/media/50f4bf_beac5b6cf73840fd96f34c823f72359a~mv2.png',
  },
  {
    id: 'sextou',
    label: 'Sextou',
    shortcode: ':sextou:',
    imageUrl: 'https://static.wixstatic.com/media/50f4bf_506cc0570c80440185531ff103ac4398~mv2.png',
  },
];
