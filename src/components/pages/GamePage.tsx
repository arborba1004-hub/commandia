import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';

export default function GamePage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="w-full h-[40vh] relative overflow-hidden">
          <Image
            src="https://static.wixstatic.com/media/50f4bf_b03fe356a9884af58d4b39af0b538876~mv2.jpeg"
            alt="Game background"
            className="w-full h-full object-cover"
            width={1920}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
