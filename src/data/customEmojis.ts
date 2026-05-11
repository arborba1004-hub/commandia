export type CustomEmoji = {
  id: string;
  label: string;
  shortcode: string;
  imageUrl: string;
};

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
  
  {
    id: "1777237845773",
    label: "1777198095616",
    shortcode: ":1777198095616:",
    imageUrl: "/emojis/1777198095616-1777237845773.png"
  },
  {
    id: "1777237845774",
    label: "1777198327216",
    shortcode: ":1777198327216:",
    imageUrl: "/emojis/1777198327216-1777237845774.png"
  },
  {
    id: "1777237845774",
    label: "1777198421581",
    shortcode: ":1777198421581:",
    imageUrl: "/emojis/1777198421581-1777237845774.png"
  }
];