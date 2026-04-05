import Header from '@/components/Header';
import Map3D from '@/components/Map3D';

export default function GamePage() {
  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden">
        <Map3D />
      </div>
    </div>
  );
}