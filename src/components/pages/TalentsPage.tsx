import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TalentsMenu from '@/components/TalentsMenu';
import TalentSystemGuide from '@/components/TalentSystemGuide';
import TalentProgressTracker from '@/components/TalentProgressTracker';
import { BookOpen, Zap } from 'lucide-react';

export default function TalentsPage() {
  const [activeTab, setActiveTab] = useState('menu');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-pink-600/20 border-b border-primary p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold font-heading text-primary mb-2">
            👑 TALENTOS DO CRIME
          </h1>
          <p className="text-gray-300 font-paragraph">
            Desbloqueie habilidades criminosas e domine o jogo com poderes únicos
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-black border-b border-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <TalentProgressTracker />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-black p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 mb-6">
              <TabsTrigger value="menu" className="data-[state=active]:bg-primary flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Menu de Talentos
              </TabsTrigger>
              <TabsTrigger value="guide" className="data-[state=active]:bg-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Guia Completo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu">
              <TalentsMenu />
            </TabsContent>

            <TabsContent value="guide">
              <TalentSystemGuide />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
