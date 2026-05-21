import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import ConvoyShop from '@/components/shop/ConvoyShop';
import ConvoyAcceleratorShop from '@/components/shop/ConvoyAcceleratorShop';

export default function ShopPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'loja' | 'comboio' | 'aceleradores'>('loja');

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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 border-b border-white/10">
          <button
            onClick={() => setActiveTab('loja')}
            className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
              activeTab === 'loja'
                ? 'text-[#d9b764] border-b-2 border-[#d9b764]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            LOJA
          </button>
          <button
            onClick={() => setActiveTab('comboio')}
            className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
              activeTab === 'comboio'
                ? 'text-[#d9b764] border-b-2 border-[#d9b764]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            COMBOIO
          </button>
          <button
            onClick={() => setActiveTab('aceleradores')}
            className={`px-6 py-3 font-heading text-lg font-bold transition-all ${
              activeTab === 'aceleradores'
                ? 'text-[#d9b764] border-b-2 border-[#d9b764]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            ACELERADORES
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'loja' && (
          <>
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
          </>
        )}

        {activeTab === 'comboio' && (
          <ConvoyShop />
        )}

        {activeTab === 'aceleradores' && (
          <ConvoyAcceleratorShop />
        )}
      </div>
    </div>
  );
}
