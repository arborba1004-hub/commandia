import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlayerStore } from '@/store/playerStore';
import { getLuxurySystem } from '@/data/luxoItems';


  
    

const diamondBorderStyle = `
  position: relative;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 3px;
    background: linear-gradient(135deg, 
      #ffffff 0%, 
      #e0e7ff 25%, 
      #c7d2fe 50%, 
      #e0e7ff 75%, 
      #ffffff 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    box-shadow: 
      inset 0 0 20px rgba(255, 255, 255, 0.8),
      inset 0 0 10px rgba(224, 231, 255, 0.6),
      0 0 30px rgba(199, 210, 254, 0.5),
      0 0 60px rgba(224, 231, 255, 0.3);
    animation: diamondGlow 3s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: 8px;
    border: 2px solid transparent;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(224, 231, 255, 0.2)) border-box;
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    box-shadow: 
      inset 0 0 15px rgba(255, 255, 255, 0.6),
      0 0 20px rgba(199, 210, 254, 0.4);
    pointer-events: none;
  }
`;

export default function Item5Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes goldenGlow {
          0%, 100% {
            box-shadow: 
              0 0 15px rgba(184, 134, 11, 0.8),
              0 0 30px rgba(218, 165, 32, 0.6),
              inset 0 0 20px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow: 
              0 0 25px rgba(218, 165, 32, 1),
              0 0 50px rgba(184, 134, 11, 0.8),
              inset 0 0 30px rgba(255, 255, 255, 0.5);
          }
        }
        
        .diamond-container {
          position: relative;
          background-color: #ffffff;
          background-image: url('https://static.wixstatic.com/media/50f4bf_b1fc21c54e3e481f88ea8b18b914cf71~mv2.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 12px;
          padding: 3px;
          border: 3px solid #b8860b;
          box-shadow: 
            0 0 20px rgba(184, 134, 11, 0.8),
            0 0 40px rgba(218, 165, 32, 0.6),
            inset 0 0 20px rgba(255, 255, 255, 0.3);
          animation: goldenGlow 3s ease-in-out infinite;
        }
        
        .diamond-container img {
          filter: hue-rotate(45deg) saturate(4.5) brightness(1.35) contrast(2) drop-shadow(0 0 15px rgba(218, 165, 32, 0.8));
          mix-blend-mode: screen;
          position: relative;
        }
        
        .image-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .image-wrapper::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(126, 34, 206, 0.6) 50%, rgba(168, 85, 247, 0.5) 100%);
          border-radius: 8px;
          pointer-events: none;
          mix-blend-mode: multiply;
        }

      `}</style>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-[100rem] px-4">
          <div className="grid grid-cols-2 gap-6 md:gap-8">
            {/* Container 1 */}
            <div className="diamond-container p-8 flex items-center justify-center min-h-[200px]">
              <div className="image-wrapper w-[35%]" style={{ transform: 'translateY(20%)' }}>
                <Image 
                  src="https://static.wixstatic.com/media/50f4bf_00a8afb265134653af7d21ba5770b27b~mv2.png"
                  alt="Dominio do Comando - Submundo Urbano"
                  width={300}
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>

            {/* Container 2 */}
            <div className="diamond-container p-8 flex items-center justify-center min-h-[200px]">
              <div className="image-wrapper w-[36%]" style={{ transform: 'translateY(20%)' }}>
                <Image 
                  src="https://static.wixstatic.com/media/50f4bf_a554900cd83f4e88a88806d38f9cd32e~mv2.png"
                  alt="Luxury item with chain and pendant"
                  width={300}
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>

            {/* Container 3 */}
            <div className="diamond-container p-8 flex items-center justify-center min-h-[200px]">
              <div className="image-wrapper w-[36%]" style={{ transform: 'translateY(20%)' }}>
                <Image 
                  src="https://static.wixstatic.com/media/50f4bf_f96cb9362f6440ecb0b5f4c3fcacb92b~mv2.png"
                  alt="Luxury chain pendant with diamond details"
                  width={300}
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>

            {/* Container 4 */}
            <div className="diamond-container p-8 flex items-center justify-center min-h-[200px]">
              <div className="image-wrapper w-[36%]" style={{ transform: 'translateY(20%)' }}>
                <Image 
                  src="https://static.wixstatic.com/media/50f4bf_8d00b01bac824f33a0520fc6e023ad64~mv2.png"
                  alt="Luxury diamond watch with chain band"
                  width={300}
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>

            {/* Container 5 */}
            <div className="diamond-container p-8 flex items-center justify-center min-h-[200px]">
              <div className="image-wrapper w-[36%]" style={{ transform: 'translateY(20%)' }}>
                <Image 
                  src="https://static.wixstatic.com/media/50f4bf_82b9c1dc5a864d6ead79493341f040d0~mv2.png"
                  alt="Luxury handbag - Dominio do Comando"
                  width={300}
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>

            {/* Container 6 */}
            <div className="diamond-container p-8 flex items-center justify-center min-h-[200px]">
              <div className="image-wrapper w-[36%]" style={{ transform: 'translateY(20%)' }}>
                <Image 
                  src="https://static.wixstatic.com/media/50f4bf_e523b8d5c4a74dc3beca49e44936e700~mv2.png"
                  alt="Luxury diamond-studded sunglasses"
                  width={300}
                  className="w-full h-auto relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}    