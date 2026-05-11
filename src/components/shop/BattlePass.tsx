import { useState } from 'react';
import { useBattlePassStore } from '@/stores/battlePassStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Lock } from 'lucide-react';

interface BattlePassReward {
  level: number;
  name: string;
  reward: string;
  unlocked: boolean;
  premium: boolean;
}

export default function BattlePass() {
  const { level, experience, maxExperience, rewards } = useBattlePassStore();
  const [showPremium, setShowPremium] = useState(false);

  const mockRewards: BattlePassReward[] = [
    { level: 1, name: 'Starter Pack', reward: '100 Coins', unlocked: true, premium: false },
    { level: 5, name: 'Rare Skin', reward: 'Exclusive Cosmetic', unlocked: level >= 5, premium: true },
    { level: 10, name: 'Weapon Skin', reward: 'Epic Weapon Skin', unlocked: level >= 10, premium: false },
    { level: 15, name: 'Avatar Frame', reward: 'Legendary Frame', unlocked: level >= 15, premium: true },
    { level: 20, name: 'Ultimate Reward', reward: '1000 Coins + Skin', unlocked: level >= 20, premium: false },
  ];

  const progressPercent = (experience / maxExperience) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="font-heading text-4xl">Battle Pass</h1>
          </div>
          <Button
            onClick={() => setShowPremium(!showPremium)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {showPremium ? 'Show Free' : 'Show Premium'}
          </Button>
        </div>

        <Card className="p-6 border-2 border-secondary/20">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-heading text-2xl">Level {level}</span>
              <span className="text-sm text-secondary-foreground/70">
                {experience} / {maxExperience} XP
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-secondary-foreground/70">Current Tier</p>
              <p className="font-bold text-lg">Free Pass</p>
            </div>
            <div>
              <p className="text-secondary-foreground/70">Premium Status</p>
              <p className="font-bold text-lg text-primary">Inactive</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="font-heading text-2xl mb-4">Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {mockRewards
            .filter(r => !showPremium || r.premium)
            .map((reward) => (
              <Card
                key={reward.level}
                className={`p-4 text-center border-2 transition-all ${
                  reward.unlocked
                    ? 'border-primary bg-primary/5'
                    : 'border-secondary/20 opacity-60'
                }`}
              >
                <div className="mb-3">
                  {reward.premium && !reward.unlocked && (
                    <Lock className="w-5 h-5 mx-auto text-secondary-foreground/50 mb-2" />
                  )}
                  <p className="font-heading text-lg">Level {reward.level}</p>
                </div>
                <p className="text-sm font-bold mb-2">{reward.name}</p>
                <p className="text-xs text-secondary-foreground/70">{reward.reward}</p>
              </Card>
            ))}
        </div>
      </div>

      <Card className="p-6 border-2 border-primary bg-primary/5">
        <h3 className="font-heading text-xl mb-3">Upgrade to Premium</h3>
        <p className="text-secondary-foreground/70 mb-4">
          Unlock exclusive rewards and earn double XP with the premium battle pass.
        </p>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Upgrade Now - $9.99
        </Button>
      </Card>
    </div>
  );
}
