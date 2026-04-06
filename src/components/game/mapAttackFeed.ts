type FeedItem = {
  id: string;
  message: string;
};

let listeners: ((items: FeedItem[]) => void)[] = [];
let feed: FeedItem[] = [];

export function pushAttackFeed(message: string) {
  const item = {
    id: Math.random().toString(),
    message,
  };

  feed = [item, ...feed.slice(0, 5)];

  listeners.forEach((l) => l(feed));
}

export function subscribeFeed(cb: (items: FeedItem[]) => void) {
  listeners.push(cb);
  cb(feed);

  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}