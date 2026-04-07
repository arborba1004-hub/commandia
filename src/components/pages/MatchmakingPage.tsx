/**
 * Matchmaking Page - Demonstração Wix Realtime API
 * 
 * Este componente demonstra:
 * 1. Inscrição em um channel ('lobby_jogos')
 * 2. Ouvir mensagens do backend
 * 3. Publicar no channel resource específico da partida
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MensagemLobby {
  tipo: string;
  jogador?: string;
  totalNaFila?: number;
  idPartida?: string;
  seuOponente?: {
    jogador1Nome: string;
    jogador2Nome: string;
  };
  mensagem?: string;
  timestamp: string;
}

export default function MatchmakingPage() {
  const [procurando, setProcurando] = useState(false);
  const [statusLobby, setStatusLobby] = useState<string>('');
  const [mensagens, setMensagens] = useState<MensagemLobby[]>([]);
  const [idPartidaAtual, setIdPartidaAtual] = useState<string | null>(null);
  const [oponenteEncontrado, setOponenteEncontrado] = useState<any>(null);
  const subscriptionRef = useRef<any>(null);
  const jogadorIdRef = useRef<string>(Math.random().toString(36).substr(2, 9));

  /**
   * CONCEITO: Inscrição em Channel
   * 
   * Quando o jogador clica "Encontrar Jogo", ele se inscreve no canal 'lobby_jogos'
   * Isso significa que ele receberá TODAS as mensagens publicadas nesse canal
   */
  const handleEncontrarJogo = async () => {
    try {
      setProcurando(true);
      setStatusLobby('🔍 Procurando por um jogo...');

      // ✅ INSCREVER NO CHANNEL (frontend)
      // Usar Wix Realtime para se inscrever no canal 'lobby_jogos'
      if (window.Wix?.Realtime) {
        subscriptionRef.current = window.Wix.Realtime.subscribe('lobby_jogos', (mensagem: any) => {
          console.log('[Frontend] Mensagem recebida:', mensagem);
          
          // Adicionar à lista de mensagens
          setMensagens(prev => [...prev, mensagem]);

          // Tratar diferentes tipos de mensagens
          if (mensagem.tipo === 'jogador_encontrado') {
            // ✅ JOGADOR ENCONTRADO!
            setOponenteEncontrado(mensagem.seuOponente);
            setIdPartidaAtual(mensagem.idPartida);
            setStatusLobby(`✅ Jogo encontrado! Seu oponente: ${mensagem.seuOponente.jogador1Nome}`);
            setProcurando(false);

            // Mostrar alerta
            alert(`🎮 Jogo encontrado!\n\nVocê vs ${mensagem.seuOponente.jogador1Nome}\n\nPartida: ${mensagem.idPartida}`);
          } else if (mensagem.tipo === 'jogador_entrou') {
            setStatusLobby(`👥 ${mensagem.jogador} entrou. Fila: ${mensagem.totalNaFila} jogadores`);
          } else if (mensagem.tipo === 'partida_criada') {
            setStatusLobby(`🎮 Partida criada: ${mensagem.jogador1} vs ${mensagem.jogador2}`);
          }
        });

        // Chamar backend para inscrever na fila
        const resultado = await window.Wix.invokeAPI('inscreverNoLobby', {
          jogadorId: jogadorIdRef.current,
          nome: `Jogador_${jogadorIdRef.current.substr(0, 4)}`,
          nivel: 1
        });

        console.log('[Frontend] Inscrito no lobby:', resultado);
      } else {
        setStatusLobby('❌ Wix Realtime não disponível');
      }
    } catch (erro) {
      console.error('[Frontend] Erro ao procurar jogo:', erro);
      setStatusLobby('❌ Erro ao procurar jogo');
      setProcurando(false);
    }
  };

  /**
   * CONCEITO: Cancelar inscrição
   * 
   * Quando o jogador cancela, ele se desinscreve do canal
   */
  const handleCancelarBusca = async () => {
    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      await window.Wix?.invokeAPI('removerDoLobby', {
        jogadorId: jogadorIdRef.current
      });

      setProcurando(false);
      setStatusLobby('❌ Busca cancelada');
      setMensagens([]);
    } catch (erro) {
      console.error('[Frontend] Erro ao cancelar:', erro);
    }
  };

  /**
   * CONCEITO: Publicar no Channel Resource
   * 
   * Após encontrar um jogo, o jogador pode enviar mensagens específicas
   * para a partida usando o channel resource 'canalPartida_{idPartida}'
   */
  const handleEnviarMensagemPartida = async () => {
    if (!idPartidaAtual) return;

    try {
      const resultado = await window.Wix?.invokeAPI('publicarNoCanal', {
        idPartida: idPartidaAtual,
        mensagem: `${jogadorIdRef.current} está pronto para começar!`
      });

      console.log('[Frontend] Mensagem enviada para partida:', resultado);
      setStatusLobby('✅ Mensagem enviada para a partida');
    } catch (erro) {
      console.error('[Frontend] Erro ao enviar mensagem:', erro);
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-5xl font-bold text-white mb-4">
            🎮 Matchmaking Lobby
          </h1>
          <p className="font-paragraph text-lg text-slate-300">
            Demonstração Wix Realtime API - Channels & Channel Resources
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 border border-primary rounded-lg p-8 mb-8"
        >
          <h2 className="font-heading text-2xl text-white mb-4">Status</h2>
          <p className="font-paragraph text-lg text-slate-200 mb-4">{statusLobby}</p>
          
          {/* Botões de Ação */}
          <div className="flex gap-4">
            <button
              onClick={handleEncontrarJogo}
              disabled={procurando}
              className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-pink-600 disabled:opacity-50 transition"
            >
              {procurando ? '⏳ Procurando...' : '🔍 Encontrar Jogo'}
            </button>

            {procurando && (
              <button
                onClick={handleCancelarBusca}
                className="px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition"
              >
                ❌ Cancelar
              </button>
            )}

            {oponenteEncontrado && (
              <button
                onClick={handleEnviarMensagemPartida}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
              >
                ✅ Pronto para Começar
              </button>
            )}
          </div>
        </motion.div>

        {/* Oponente Encontrado */}
        {oponenteEncontrado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-900 to-green-800 border border-green-500 rounded-lg p-8 mb-8"
          >
            <h2 className="font-heading text-2xl text-white mb-4">⚔️ Oponente Encontrado!</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="font-paragraph text-slate-200 mb-2">Você</p>
                <p className="font-heading text-2xl text-white">{oponenteEncontrado.jogador2Nome}</p>
              </div>
              <div className="text-center">
                <p className="font-paragraph text-slate-200 mb-2">Oponente</p>
                <p className="font-heading text-2xl text-white">{oponenteEncontrado.jogador1Nome}</p>
              </div>
            </div>
            {idPartidaAtual && (
              <p className="font-paragraph text-sm text-slate-300 mt-4 text-center">
                Partida: {idPartidaAtual}
              </p>
            )}
          </motion.div>
        )}

        {/* Mensagens do Lobby */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-8"
        >
          <h2 className="font-heading text-2xl text-white mb-4">📨 Mensagens do Lobby</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mensagens.length === 0 ? (
              <p className="font-paragraph text-slate-400">Nenhuma mensagem ainda...</p>
            ) : (
              mensagens.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-700 p-4 rounded border border-slate-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-heading text-primary font-bold">{msg.tipo}</span>
                    <span className="font-paragraph text-xs text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-paragraph text-slate-200 text-sm">
                    {msg.mensagem || msg.jogador || JSON.stringify(msg, null, 2)}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Explicação Técnica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-8"
        >
          <h2 className="font-heading text-2xl text-white mb-4">📚 Como Funciona</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-lg text-primary mb-2">1️⃣ Channel (lobby_jogos)</h3>
              <p className="font-paragraph text-slate-300">
                Todos os jogadores se inscrevem no mesmo canal. Quando o backend publica uma mensagem,
                <strong> TODOS recebem</strong>. Ideal para notificações gerais do lobby.
              </p>
            </div>

            <div>
              <h3 className="font-heading text-lg text-primary mb-2">2️⃣ Channel Resource (canalPartida_ID)</h3>
              <p className="font-paragraph text-slate-300">
                Após encontrar um jogo, os 2 jogadores se inscrevem em um canal específico.
                Mensagens neste canal são <strong>isoladas apenas para essa partida</strong>.
              </p>
            </div>

            <div>
              <h3 className="font-heading text-lg text-primary mb-2">📡 Frontend vs Backend</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded">
                  <p className="font-heading text-white mb-2">Frontend (site.js)</p>
                  <ul className="font-paragraph text-slate-300 text-sm space-y-1">
                    <li>✅ Se inscreve em canais</li>
                    <li>✅ Ouve mensagens</li>
                    <li>❌ Não publica (segurança)</li>
                  </ul>
                </div>
                <div className="bg-slate-700 p-4 rounded">
                  <p className="font-heading text-white mb-2">Backend (lobby.jsw)</p>
                  <ul className="font-paragraph text-slate-300 text-sm space-y-1">
                    <li>✅ Publica mensagens</li>
                    <li>✅ Controla lógica</li>
                    <li>✅ Gerencia filas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
