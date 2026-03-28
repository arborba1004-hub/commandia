import { DebugLog } from '@/hooks/useDebugLog';

interface GoogleAuthDebugPanelProps {
  logs: DebugLog[];
  googleScriptLoaded: boolean;
  googleAvailable: boolean;
  buttonRendered: boolean;
  credentialReceived: boolean;
  backendRequestStarted: boolean;
  backendResponseReceived: boolean;
  backendStatus?: number;
  backendResponse?: any;
  finalError?: string;
  playerName?: string;
  isLoginComplete: boolean;
}

export default function GoogleAuthDebugPanel({
  logs,
  googleScriptLoaded,
  googleAvailable,
  buttonRendered,
  credentialReceived,
  backendRequestStarted,
  backendResponseReceived,
  backendStatus,
  backendResponse,
  finalError,
  playerName,
  isLoginComplete,
}: GoogleAuthDebugPanelProps) {
  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'pending':
        return '⏳';
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-primary/30 max-h-[40vh] overflow-y-auto">
      <div className="p-3 space-y-2 font-mono text-xs">
        {/* Header */}
        <div className="text-primary font-bold mb-2">
          🔍 DEBUG: Google Login Flow
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3 pb-2 border-b border-primary/20">
          <div className={googleScriptLoaded ? 'text-green-400' : 'text-red-400'}>
            Script: {googleScriptLoaded ? '✓' : '✗'}
          </div>
          <div className={googleAvailable ? 'text-green-400' : 'text-red-400'}>
            window.google: {googleAvailable ? '✓' : '✗'}
          </div>
          <div className={buttonRendered ? 'text-green-400' : 'text-red-400'}>
            Button: {buttonRendered ? '✓' : '✗'}
          </div>
          <div className={credentialReceived ? 'text-green-400' : 'text-gray-500'}>
            Credential: {credentialReceived ? '✓' : '○'}
          </div>
          <div className={backendRequestStarted ? 'text-green-400' : 'text-gray-500'}>
            Backend Req: {backendRequestStarted ? '✓' : '○'}
          </div>
          <div className={backendResponseReceived ? 'text-green-400' : 'text-gray-500'}>
            Backend Res: {backendResponseReceived ? '✓' : '○'}
          </div>
        </div>

        {/* Backend Status */}
        {backendStatus && (
          <div className={backendStatus === 200 ? 'text-green-400' : 'text-red-400'}>
            HTTP Status: {backendStatus}
          </div>
        )}

        {/* Player Name */}
        {playerName && (
          <div className="text-green-400">
            Player: {playerName}
          </div>
        )}

        {/* Login Complete */}
        {isLoginComplete && (
          <div className="text-green-400 font-bold">
            ✓ Login Concluído
          </div>
        )}

        {/* Final Error */}
        {finalError && (
          <div className="text-red-400 bg-red-900/20 p-2 rounded">
            ✗ Erro: {finalError}
          </div>
        )}

        {/* Backend Response JSON */}
        {backendResponse && (
          <div className="bg-gray-900/50 p-2 rounded mt-2 max-h-24 overflow-y-auto">
            <div className="text-blue-400 mb-1">Backend Response:</div>
            <pre className="text-gray-300 text-xs whitespace-pre-wrap break-words">
              {JSON.stringify(backendResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="border-t border-primary/20 pt-2 mt-2">
            <div className="text-primary font-bold mb-1">Timeline:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className={`text-xs ${getStatusColor(log.status)}`}>
                  <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {' '}
                  <span>{getStatusIcon(log.status)}</span>
                  {' '}
                  <span className="text-gray-400">{log.stage}:</span>
                  {' '}
                  <span>{log.message}</span>
                  {log.details && (
                    <div className="text-gray-500 ml-4">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
