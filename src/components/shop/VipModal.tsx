import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check } from 'lucide-react';

interface VipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VipTier {
  name: string;
  price: number;
  duration: string;
  benefits: string[];
  color: string;
}

const VIP_TIERS: VipTier[] = [
  {
    name: 'VIP',
    price: 9.99,
    duration: 'Monthly',
    benefits: [
      '2x Coin Rewards',
      'Daily Bonus Coins',
      'Priority Support',
      'Exclusive Cosmetics',
    ],
    color: 'bg-blue-500',
  },
  {
    name: 'VIP+',
    price: 19.99,
    duration: 'Monthly',
    benefits: [
      '3x Coin Rewards',
      'Daily Bonus Coins',
      'Priority Support',
      'Exclusive Cosmetics',
      'Battle Pass Free',
      'Weekly Rewards',
    ],
    color: 'bg-purple-500',
  },
  {
    name: 'VIP Premium',
    price: 49.99,
    duration: 'Monthly',
    benefits: [
      '5x Coin Rewards',
      'Daily Bonus Coins',
      '24/7 Support',
      'All Cosmetics',
      'Battle Pass Free',
      'Weekly Rewards',
      'Monthly Exclusive Items',
    ],
    color: 'bg-yellow-500',
  },
];

export default function VipModal({ open, onOpenChange }: VipModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (tierName: string) => {
    setLoading(tierName);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Handle purchase
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" />
            VIP Membership
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {VIP_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="border-2 border-secondary/20 rounded-lg p-6 hover:border-primary/50 transition-all"
            >
              <div className={`${tier.color} text-white rounded-lg p-3 mb-4 text-center`}>
                <h3 className="font-heading text-2xl">{tier.name}</h3>
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold">${tier.price}</p>
                <p className="text-sm text-secondary-foreground/70">{tier.duration}</p>
              </div>

              <div className="space-y-3 mb-6">
                {tier.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePurchase(tier.name)}
                disabled={loading === tier.name}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading === tier.name ? 'Processing...' : 'Subscribe'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
