import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LuxuryshowroomPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Background Image Section */}
      <div 
        className="flex-1 w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://static.wixstatic.com/media/50f4bf_34b2b7b344ac47a7b0b73f0bf5d4f03e~mv2.png)',
          backgroundAttachment: 'fixed',
          minHeight: 'calc(100vh - 200px)',
        }}
      />
      
      <Footer />
    </div>
  );
}
