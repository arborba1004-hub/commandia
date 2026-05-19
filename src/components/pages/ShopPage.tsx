import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { ChevronLeft } from 'lucide-react';

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/game')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="font-heading text-3xl font-bold text-[#d9b764]">LOJA</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Shop Badge */}
        <div className="flex justify-center mb-12">
          <Image
            src="https://static.wixstatic.com/media/50f4bf_aee79b79a6ac4c89bbc8bbadfffdb2c6~mv2.png"
            alt="Loja"
            className="h-48 w-48 object-contain drop-shadow-[0_0_20px_rgba(217,183,100,0.3)]"
          />
        </div>

        {/* Empty State */}
        <div className="text-center py-20">
          <p className="font-paragraph text-white/60 text-lg mb-4">
            A loja está em construção...
          </p>
          <p className="font-paragraph text-white/40 text-sm">
            Volte em breve para descobrir itens exclusivos
          </p>
        </div>
      </div>
    </div>
  );
}
