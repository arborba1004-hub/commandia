import { useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { usePlayerStore } from '@/store/playerStore';

export default function ChatComposer() {
  const { activeChannel, sendMessage } = useChatStore();
  const player = usePlayerStore((s) => s.player);

  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;

    sendMessage({
      channel: activeChannel,
      senderId: player._id!,
      senderName: player.name || 'Jogador',
      factionId: (player as any)?.faction?.factionId,
      body: text,
    });

    setText('');
  };

  return (
    <div className="p-2 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-2 bg-black text-white"
      />

      <button onClick={handleSend} className="bg-green-600 px-4">
        Enviar
      </button>
    </div>
  );
}