import { motion } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import { getCollectionNameByLevel } from '@/data/luxoItems';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GaleriaPage() {
  const player = usePlayerStore((state) => state.player);
  const barracoLevel = player.niveis.barracoLevel;
  const collectionName = getCollectionNameByLevel(barracoLevel);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col relative bg-[#01020bff] overflow-hidden py-20 px-4">
        <div className="max-w-[100rem] mx-auto w-full">
          {/* Letreiro da Coleção */}
          <motion.div
            className="text-center mb-40"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-heading text-primary tracking-widest">
              Coleção {collectionName}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4" />
          </motion.div>

          {/* Grid de Containers */}
          <div className="grid grid-cols-2 gap-8 justify-items-center mt-12">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <motion.div
                key={item}
                className={`w-full max-w-sm h-96 rounded-lg border border-white/20 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-[0_0_20px_rgba(255,0,127,0.3)] ${item === 1 ? 'relative overflow-hidden p-0' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                {item === 1 ? (
                  <video
                    src="https://video.wixstatic.com/video/50f4bf_5c5ff0aa73984169aee6006f54c6643a/480p/mp4/file.mp4"
                    controls
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4">
                      <span className="text-3xl font-bold text-primary">{item}</span>
                    </div>
                    <h3 className="text-xl font-heading text-white mb-2">Item {item}</h3>
                    <p className="text-sm font-paragraph text-white/60 text-center">Descrição do item {item}</p>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
