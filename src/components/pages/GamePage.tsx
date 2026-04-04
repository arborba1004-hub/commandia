import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GamePage() {
  return (
    <div className="w-full h-screen relative overflow-hidden">

      {/* BACKGROUND */}
      <div
        className="absolute top-0 left-0 w-full h-[50%] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://static.wixstatic.com/media/50f4bf_3af16a6d99f04e67b6805bb21bb1dd39~mv2.jpeg")',
        }}
      />

      {/* CHÃO BASE (ONDE O GRID VAI ENCAIXAR) */}
      <div
        id="grid-base"
        className="absolute bottom-0 left-0 w-full h-[50%] bg-cover bg-top"
        style={{
          backgroundImage:
            'url("https://static.wixstatic.com/media/50f4bf_df004e568945465ba2231dc36addfe09~mv2.jpeg")',
        }}
      />

      {/* TRANSIÇÃO ENTRE FUNDO E CHÃO */}
      <div className="absolute top-[45%] left-0 w-full h-[10%] bg-gradient-to-b from-transparent via-black/40 to-transparent z-[2]" />

      <Header />
      <Footer />
    </div>
  );
}