/**
 * useGoogleAuth.ts
 *
 * Mudanças desta versão:
 *   - Timeout de login: 8s → 60s (aguenta cold start do Render free tier)
 *   - Warm-up: pinga /health antes do login para iniciar o wake-up do servidor
 *   - Retry automático: até 2 tentativas com 3s de intervalo entre elas
 *   - Mensagem de loading dinâmica: "Acordando o servidor..." durante warm-up
 *   - Resto da lógica preservada integralmente
 */

import { useCallback, useEffect, useState } from 'react';
import { usePlayerStore }                     from '@/store/playerStore';
import { disconnectSocket }  from '@/socket';

export interface PlayerData {
  _id?: string; id?: string; googleId?: string;
  email?: string; name?: string; picture?: string; avatar?: string;
  [key: string]: any;
}

export interface AuthState {
  authToken:  string | null;
  playerData: PlayerData | null;
  isLoading:  boolean;
  loadingMessage: string | null; // mensagem dinâmica durante login
  error:      string | null;
}

const BACKEND_URL    = 'https://comando-backend.onrender.com';
const LOGIN_TIMEOUT  = 60_000; // 60 segundos — aguenta cold start do Render
const MAX_RETRIES    = 2;      // tenta até 2 vezes antes de desistir
const RETRY_DELAY_MS = 3_000;  // 3 segundos entre tentativas

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

/** Espera N milissegundos */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pinga /health para despertar o servidor antes do login.
 * Não lança erro — é só um "apertar a campainha" antes de entrar.
 */
async function warmUpBackend(): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
    console.log('🔥 Warm-up: servidor respondeu');
  } catch {
    console.log('🔥 Warm-up: servidor ainda dormindo, aguardando...');
  }
}

export function useGoogleAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    authToken:      null,
    playerData:     null,
    isLoading:      true,
    loadingMessage: null,
    error:          null,
  });

  const clearPlayer = usePlayerStore((state) => state.clearPlayer);

  // ── Restaura sessão do token existente ──────────────────────────────────────
  const restoreSession = useCallback(() => {
    if (typeof window === 'undefined') {
      console.log('⚠️ useGoogleAuth: restoreSession skipped during SSR/build');
      setAuthState({ authToken: null, playerData: null, isLoading: false, loadingMessage: null, error: null });
      return;
    }

    const token = readStorage('authToken');

    if (!token) {
      console.log('🔵 useGoogleAuth: Nenhum token encontrado, usuário não autenticado');
      setAuthState({ authToken: null, playerData: null, isLoading: false, loadingMessage: null, error: null });
      return;
    }

    console.log('🔵 useGoogleAuth: Token encontrado, disparando evento de autenticação...');
    window.dispatchEvent(new Event('authTokenChanged'));

    setAuthState({ authToken: token, playerData: null, isLoading: false, loadingMessage: null, error: null });
    console.log('🟢 useGoogleAuth: Sessão restaurada');
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ── Tentativa de login (usada pelo retry loop) ──────────────────────────────
  const attemptLogin = useCallback(async (credential: string) => {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), LOGIN_TIMEOUT);

    try {
      const backendResponse = await fetch(`${BACKEND_URL}/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ token: credential }),
        signal:  controller.signal,
      });

      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} - ${errorText}`);
      }

      const data = await backendResponse.json();

      if (!data?.token || !data?.player) {
        throw new Error('Resposta inválida do backend: token ou player ausente');
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }, []);

  // ── Login com Google ────────────────────────────────────────────────────────
  const handleGoogleResponse = useCallback(async (response: any) => {
    if (typeof window === 'undefined') {
      console.log('⚠️ useGoogleAuth: handleGoogleResponse skipped during SSR/build');
      return { ok: false, error: 'SSR/build environment' };
    }

    console.log('🔵 useGoogleAuth: handleGoogleResponse iniciado');

    const credential = response?.credential;
    if (!credential || typeof credential !== 'string') {
      console.error('🔴 useGoogleAuth: Sem credencial do Google');
      setAuthState((prev) => ({ ...prev, isLoading: false, error: 'Sem credencial do Google' }));
      return { ok: false, error: 'Sem credencial do Google' };
    }

    // 1. Inicia loading com warm-up
    setAuthState((prev) => ({ ...prev, isLoading: true, loadingMessage: 'Acordando o servidor...', error: null }));
    await warmUpBackend();

    // 2. Atualiza mensagem após warm-up
    setAuthState((prev) => ({ ...prev, loadingMessage: 'Entrando no jogo...' }));

    // 3. Retry loop — tenta até MAX_RETRIES vezes
    let lastError: string = 'Erro desconhecido';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🔵 useGoogleAuth: Tentativa ${attempt}/${MAX_RETRIES} de login`);

        const data = await attemptLogin(credential);

        const normalizedPlayer = normalizePlayer(data.player);
        console.log('🔵 useGoogleAuth: Player normalizado:', { id: normalizedPlayer._id, name: normalizedPlayer.name });

        writeStorage('authToken', data.token);
        console.log('🔵 useGoogleAuth: Token salvo');

        window.dispatchEvent(new Event('authTokenChanged'));
        console.log('🔵 useGoogleAuth: Evento de autenticação disparado');

        setAuthState({
          authToken:      data.token,
          playerData:     normalizedPlayer,
          isLoading:      false,
          loadingMessage: null,
          error:          null,
        });

        console.log('🟢 useGoogleAuth: Login bem-sucedido!');
        return { ok: true, token: data.token, player: normalizedPlayer };

      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Erro no login';
        console.error(`🔴 useGoogleAuth: Tentativa ${attempt} falhou:`, lastError);

        if (attempt < MAX_RETRIES) {
          console.log(`⏳ useGoogleAuth: Aguardando ${RETRY_DELAY_MS}ms antes de tentar novamente...`);
          setAuthState((prev) => ({
            ...prev,
            loadingMessage: `Servidor ocupado, tentando novamente... (${attempt}/${MAX_RETRIES})`,
          }));
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    // Todas as tentativas falharam
    console.error('🔴 useGoogleAuth: Todas as tentativas falharam. Último erro:', lastError);
    setAuthState((prev) => ({
      ...prev,
      isLoading:      false,
      loadingMessage: null,
      error:          lastError,
    }));
    return { ok: false, error: lastError };
  }, [attemptLogin]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (typeof window === 'undefined') {
      console.log('⚠️ useGoogleAuth: logout skipped during SSR/build');
      return;
    }

    console.log('🔵 useGoogleAuth: Logout iniciado');
    removeStorage('authToken');
    disconnectSocket();
    clearPlayer();
    setAuthState({ authToken: null, playerData: null, isLoading: false, loadingMessage: null, error: null });
    console.log('🟢 useGoogleAuth: Logout completo');
  }, [clearPlayer]);

  const isAuthenticated = Boolean(authState.authToken);

  return { ...authState, isAuthenticated, handleGoogleResponse, logout };
}
