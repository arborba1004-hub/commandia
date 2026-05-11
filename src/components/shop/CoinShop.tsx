import { useState } from 'react';
import { useCoinStore } from '@/stores/coinStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Coins } from 'lucide-react';

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: '1', coins: 100, price: 4.99, bonus: 0 },
  { id: '2', coins: 500, price: 19.99, bonus: 50, popular: true },
  { id: '3', coins: 1200, price: 39.99, bonus: 200 },
  { id: '4', coins: 2500, price: 79.99, bonus: 500 },
];

export default function CoinShop() {
  const { coins, addCoins } = useCoinStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: CoinPackage) => {
    setLoading(pkg.id);
    try {
      // Simulate purchase
      await new Promise(resolve => setTimeout(resolve, 500));
      addCoins(pkg.coins + pkg.bonus);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-4xl">Coin Shop</h1>
        </div>
        <p className="text-secondary-foreground/70">Your current coins: <span className="font-bold text-primary">{coins}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COIN_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className={`p-6 relative border-2 transition-all ${
              pkg.popular
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-secondary/20 hover:border-primary/50'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                POPULAR
              </div>
            )}

            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="font-heading text-3xl">{pkg.coins}</span>
              </div>
              {pkg.bonus > 0 && (
                <p className="text-sm text-primary font-bold">+{pkg.bonus} bonus</p>
              )}
            </div>

            <div className="mb-4 text-center">
              <p className="text-2xl font-bold">${pkg.price}</p>
            </div>

            <Button
              onClick={() => handlePurchase(pkg)}
              disabled={loading === pkg.id}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading === pkg.id ? 'Processing...' : 'Buy'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
