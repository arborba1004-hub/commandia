import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

export default function ChatMessageList() {
  const { activeChannel, complexoMessages, faccaoMessages, mailMessages } =
    useChatStore();

  const player = usePlayerStore((s) => s.player);

  const myId = player?._id;
  const myFactionId = (player as any)?.faction?.factionId;

  let messages = [];

  if (activeChannel === 'complexo') {
    messages = complexoMessages;
  }

  if (activeChannel === 'faccao') {
    messages = faccaoMessages.filter(
      (m) => m.factionId === myFactionId
    );
  }

  if (activeChannel === 'mail') {
    messages = mailMessages.filter(
      (m) =>
        m.senderId === myId ||
        m.recipientId === myId
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className="bg-zinc-800 p-2 rounded">
          <b>{msg.senderName}:</b> {msg.body}
        </div>
      ))}
    </div>
  );
}