import { useState } from 'react';
import { useGangStore } from '@/store/gangStore';
import { usePlayerStore } from '@/store/playerStore';

export default function GangDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  const gang = useGangStore((state) => state.gang);
  const gangError = useGangStore((state) => state.error);
  const gangIsLoading = useGangStore((state) => state.isLoading);
  const gangIsSubmitting = useGangStore((state) => state.isSubmitting);
  
  const player = usePlayerStore((state) => state.player);
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-96 w-96 overflow-auto rounded-lg border border-purple-500 bg-black p-4 text-xs text-white">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Gang Debug</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-purple-400 hover:text-purple-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-zinc-300">
        <div>
          <strong>Auth Token:</strong>
          <div className="break-all text-[10px]">
            {token ? `${token.substring(0, 20)}...` : 'NOT SET'}
          </div>
        </div>

        <div>
          <strong>Gang Loading:</strong> {gangIsLoading ? '✓' : '✗'}
        </div>

        <div>
          <strong>Gang Submitting:</strong> {gangIsSubmitting ? '✓' : '✗'}
        </div>

        <div>
          <strong>Gang Error:</strong>
          <div className="text-red-400">{gangError || 'None'}</div>
        </div>

        <div>
          <strong>Gang Data:</strong>
          <div className="break-all text-[10px]">
            {gang ? (
              <>
                Members: {gang.members?.length || 0}
                <br />
                CT Level: {gang.ct?.level || 0}
                <br />
                Max Members: {gang.maxMembers || 0}
              </>
            ) : (
              'NO DATA'
            )}
          </div>
        </div>

        <div>
          <strong>Player Dirty Money:</strong>
          <div>{player?.balances?.dirtyMoney || 0}</div>
        </div>

        <div>
          <strong>Player ID:</strong>
          <div className="break-all text-[10px]">{player?._id || 'NOT SET'}</div>
        </div>
      </div>
    </div>
  );
}
