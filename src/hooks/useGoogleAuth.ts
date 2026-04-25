/**
 * useGoogleAuth.ts
 *
 * MUDANÇAS vs. versão anterior:
 *   - Remove startPolling / stopPolling (polling eliminado)
 *   - Remove localStorage.setItem('playerData') — hidratação vem do socket
 *   - Adiciona reconnectSocket() após login para autenticar o socket com o novo token
 *   - restoreSession() apenas verifica se existe token; estado do player vem do socket
 *   - useSocketLogout() do useGameSocket é o ponto correto para desconectar socket
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
    const token = readStorage('authToken');

    if (!token) {
      setAuthState({ authToken: null, playerData: null, isLoading: false, error: null });
      return;
    }

    // Token existe → conecta socket (ele enviará playerInit automaticamente)
    reconnectSocket();

    setAuthState({ authToken: token, playerData: null, isLoading: false, error: null });
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ── Login com Google ────────────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(async (response: any) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const credential = response?.credential;
      if (!credential || typeof credential !== 'string') {
        throw new Error('Sem credencial do Google');
      }

      const backendResponse = await fetch(`${BACKEND_URL}/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ token: credential }),
      });

      const data = await backendResponse.json().catch(() => null);

      if (!backendResponse.ok) {
        throw new Error(data?.error || data?.message || 'Falha na autenticação');
      }

      if (!data?.token || !data?.player) {
        throw new Error('Resposta inválida do backend');
      }

      const normalizedPlayer = normalizePlayer(data.player);

      // Persiste APENAS o token (playerData vai embora)
      writeStorage('authToken', data.token);

      // Conecta socket com o novo token → backend enviará playerInit
      reconnectSocket();

      setAuthState({
        authToken:  data.token,
        playerData: normalizedPlayer,
        isLoading:  false,
        error:      null,
      });

      return { ok: true, token: data.token, player: normalizedPlayer };
    } catch (error) {
      console.error('Erro login Google:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro no login',
      }));
      return { ok: false, error: error instanceof Error ? error.message : 'Erro no login' };
    }
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    removeStorage('authToken');
    // NÃO remove playerData pois não existe mais no localStorage
    disconnectSocket();
    clearPlayer();
    setAuthState({ authToken: null, playerData: null, isLoading: false, error: null });
  }, [clearPlayer]);

  const isAuthenticated = Boolean(authState.authToken);

  return { ...authState, isAuthenticated, handleGoogleResponse, logout };
}
