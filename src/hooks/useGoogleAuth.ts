/**
 * useGoogleAuth.ts
 *
 * MUDANÇAS vs. versão anterior:
 *   - Remove startPolling / stopPolling (polling eliminado)
 *   - Remove localStorage.setItem('playerData') — hidratação vem do socket
 *   - Adiciona reconnectSocket() após login para autenticar o socket com o novo token
 *   - restoreSession() apenas verifica se existe token; estado do player vem do socket
 *   - useSocketLogout() do useGameSocket é o ponto correto para desconectar socket
 *   - Adiciona console.log para debug do fluxo de login
 */

import { useCallback, useEffect, useState } from 'react';
import { usePlayerStore }                     from '@/store/playerStore';
import { reconnectSocket, disconnectSocket }  from '@/socket';

export interface PlayerData {
  _id?: string; id?: string; googleId?: string;
  email?: string; name?: string; picture?: string; avatar?: string;
  [key: string]: any;
}

export interface AuthState {
  authToken:  string | null;
  playerData: PlayerData | null;
  isLoading:  boolean;
  error:      string | null;
}

const BACKEND_URL = 'https://comando-backend.onrender.com';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStorage(key: string): string | null {
  if (!canUseStorage()) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key: string, value: string) {
  if (!canUseStorage()) return;
  try { localStorage.setItem(key, value); } catch {}
}

function removeStorage(key: string) {
  if (!canUseStorage()) return;
  try { localStorage.removeItem(key); } catch {}
}

function normalizePlayer(rawPlayer: any): PlayerData {
  return { ...(rawPlayer || {}), _id: String(rawPlayer?._id ?? rawPlayer?.id ?? rawPlayer?.googleId ?? '') };
}

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    authToken:  null,
    playerData: null,
    isLoading:  true,
    error:      null,
  });

  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  // ── Restaura sessão do token existente ──────────────────────────────────────
  // NÃO tenta parsear playerData do localStorage — o socket envia playerInit
  const restoreSession = useCallback(() => {
    // Skip during SSR/build to prevent infinite loops
    if (typeof window === 'undefined') {
      console.log('⚠️ useGoogleAuth: restoreSession skipped during SSR/build');
      setAuthState({ authToken: null, playerData: null, isLoading: false, error: null });
      return;
    }

    const token = readStorage('authToken');

    if (!token) {
      console.log('🔵 useGoogleAuth: Nenhum token encontrado, usuário não autenticado');
      setAuthState({ authToken: null, playerData: null, isLoading: false, error: null });
      return;
    }

    console.log('🔵 useGoogleAuth: Token encontrado, conectando socket...');
    // Token existe → conecta socket (ele enviará playerInit automaticamente)
    reconnectSocket();

    setAuthState({ authToken: token, playerData: null, isLoading: false, error: null });
    console.log('🟢 useGoogleAuth: Sessão restaurada');
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ── Login com Google ────────────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(async (response: any) => {
    try {
      // Skip during SSR/build to prevent infinite loops
      if (typeof window === 'undefined') {
        console.log('⚠️ useGoogleAuth: handleGoogleResponse skipped during SSR/build');
        return { ok: false, error: 'SSR/build environment' };
      }

      console.log('🔵 useGoogleAuth: handleGoogleResponse iniciado');
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const credential = response?.credential;
      if (!credential || typeof credential !== 'string') {
        console.error('🔴 useGoogleAuth: Sem credencial do Google');
        throw new Error('Sem credencial do Google');
      }

      console.log('🔵 useGoogleAuth: Credencial recebida, enviando para backend...');

      // Backend REQUIRED - no fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const backendResponse = await fetch(`${BACKEND_URL}/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ token: credential }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('🔴 useGoogleAuth: Backend error:', errorText);
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
      }

      const data = await backendResponse.json();
      console.log('🔵 useGoogleAuth: Resposta do backend recebida:', { hasToken: !!data?.token, hasPlayer: !!data?.player });

      if (!data?.token || !data?.player) {
        console.error('🔴 useGoogleAuth: Resposta inválida do backend', data);
        throw new Error('Resposta inválida do backend: token ou player ausente');
      }

      const normalizedPlayer = normalizePlayer(data.player);
      console.log('🔵 useGoogleAuth: Player normalizado:', { id: normalizedPlayer._id, name: normalizedPlayer.name });

      // Persiste APENAS o token (playerData vai embora)
      writeStorage('authToken', data.token);
      console.log('🔵 useGoogleAuth: Token salvo no localStorage');

      // Conecta socket com o novo token → backend enviará playerInit
      reconnectSocket();
      console.log('🔵 useGoogleAuth: Socket reconectado');

      setAuthState({
        authToken:  data.token,
        playerData: normalizedPlayer,
        isLoading:  false,
        error:      null,
      });

      console.log('🟢 useGoogleAuth: Login bem-sucedido!');
      return { ok: true, token: data.token, player: normalizedPlayer };
    } catch (error) {
      console.error('🔴 useGoogleAuth: Erro login Google:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro no login';
      setAuthState((prev) => (
        {
          ...prev,
          isLoading: false,
          error: errorMsg,
        }
      ));
      return { ok: false, error: errorMsg };
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    // Skip during SSR/build to prevent infinite loops
    if (typeof window === 'undefined') {
      console.log('⚠️ useGoogleAuth: logout skipped during SSR/build');
      return;
    }

    console.log('🔵 useGoogleAuth: Logout iniciado');
    removeStorage('authToken');
    // NÃO remove playerData pois não existe mais no localStorage
    disconnectSocket();
    clearPlayer();
    setAuthState({ authToken: null, playerData: null, isLoading: false, error: null });
    console.log('🟢 useGoogleAuth: Logout completo');
  }, [clearPlayer]);

  const isAuthenticated = Boolean(authState.authToken);

  return { ...authState, isAuthenticated, handleGoogleResponse, logout };
}
