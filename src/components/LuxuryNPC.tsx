import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';

interface Props {
  onNPCLoaded?: () => void;
}

export default function LuxuryNPC({ onNPCLoaded }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
      onNPCLoaded?.();
    }, 800);
  }, [onNPCLoaded]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Image
        src="https://static.wixstatic.com/media/50f4bf_6a18b3ab08d24e0094b813673baa88e0~mv2.png"
        alt="Luxury NPC Character"
        width={300}
        className={`transition-all duration-700 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      />
    </div>
  );
}