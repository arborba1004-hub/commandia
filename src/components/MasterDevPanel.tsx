/**
 * MasterDevPanel.tsx
 * 
 * Painel de Desenvolvedor Profissional Master para investigar problemas de renderização 3D.
 * 
 * Funcionalidades:
 * - Monitorar carregamento de modelos GLB
 * - Verificar scene graph e visibilidade
 * - Testar renderização de modelos individuais
 * - Diagnosticar problemas de materiais e geometrias
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

interface GLBLoadLog {
  timestamp: number;
  url: string;
  status: 'loading' | 'success' | 'error' | 'timeout';
  duration?: number;
  error?: string;
  meshCount?: number;
  materialCount?: number;
}

interface SceneAnalysis {
  totalChildren: number;
  meshCount: number;
  lightCount: number;
  groupCount: number;
  visibleMeshes: number;
  hiddenMeshes: number;
  orphanedGeometries: number;
  orphanedMaterials: number;
}

export default function MasterDevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [glbLogs, setGlbLogs] = useState<GLBLoadLog[]>([]);
  const [sceneAnalysis, setSceneAnalysis] = useState<SceneAnalysis | null>(null);
  const [activeScene, setActiveScene] = useState<THREE.Scene | null>(null);
  const [autoMonitor, setAutoMonitor] = useState(false);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Interceptar carregamento de GLB
  useEffect(() => {
    if (!THREE?.GLTFLoader?.prototype?.load) return;
    
    const originalLoad = THREE.GLTFLoader.prototype.load;
    
    (THREE.GLTFLoader.prototype as any).load = function(
      url: string,
      onLoad: any,
      onProgress?: any,
      onError?: any
    ) {
      const startTime = performance.now();
      const logEntry: GLBLoadLog = {
        timestamp: Date.now(),
        url,
        status: 'loading',
      };

      const wrappedOnLoad = (gltf: any) => {
        const duration = performance.now() - startTime;
        let meshCount = 0;
        let materialCount = new Set<THREE.Material>();

        gltf.scene.traverse((child: any) => {
          if (child.isMesh) meshCount++;
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => materialCount.add(m));
            } else {
              materialCount.add(child.material);
            }
          }
        });

        logEntry.status = 'success';
        logEntry.duration = Math.round(duration);
        logEntry.meshCount = meshCount;
        logEntry.materialCount = materialCount.size;

        setGlbLogs(prev => [...prev, logEntry]);
        console.log('[MASTER_DEV] GLB Carregado:', logEntry);

        onLoad(gltf);
      };

      const wrappedOnError = (error: any) => {
        const duration = performance.now() - startTime;
        logEntry.status = 'error';
        logEntry.duration = Math.round(duration);
        logEntry.error = error?.message || String(error);

        setGlbLogs(prev => [...prev, logEntry]);
        console.error('[MASTER_DEV] Erro ao carregar GLB:', logEntry);

        onError?.(error);
      };

      return originalLoad.call(this, url, wrappedOnLoad, onProgress, wrappedOnError);
    };

    return () => {
      if (THREE?.GLTFLoader?.prototype?.load) {
        (THREE.GLTFLoader.prototype as any).load = originalLoad;
      }
    };
  }, []);

  // Analisar scene
  const analyzeScene = (scene: THREE.Scene) => {
    let totalChildren = 0;
    let meshCount = 0;
    let lightCount = 0;
    let groupCount = 0;
    let visibleMeshes = 0;
    let hiddenMeshes = 0;

    scene.traverse((obj: any) => {
      totalChildren++;

      if (obj.isMesh) {
        meshCount++;
        if (obj.visible) visibleMeshes++;
        else hiddenMeshes++;
      }

      if (obj.isLight) lightCount++;
      if (obj.isGroup) groupCount++;
    });

    const analysis: SceneAnalysis = {
      totalChildren,
      meshCount,
      lightCount,
      groupCount,
      visibleMeshes,
      hiddenMeshes,
      orphanedGeometries: 0,
      orphanedMaterials: 0,
    };

    setSceneAnalysis(analysis);
    console.log('[MASTER_DEV] Scene Analysis:', analysis);
    return analysis;
  };

  // Monitorar automaticamente
  useEffect(() => {
    if (!autoMonitor) {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      return;
    }

    monitorIntervalRef.current = setInterval(() => {
      // Procurar por scenes ativas no DOM
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length > 0) {
        // Tentar acessar a scene através do renderer
        const canvas = canvases[0] as any;
        if (canvas.__renderer?.scene) {
          analyzeScene(canvas.__renderer.scene);
        }
      }
    }, 2000);

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };
  }, [autoMonitor]);

  // Injetar hook no Map3D para capturar a scene
  useEffect(() => {
    if (!THREE?.Scene?.prototype?.add) return;
    
    const originalAdd = THREE.Scene.prototype.add;
    
    (THREE.Scene.prototype as any).add = function(...args: any[]) {
      const result = originalAdd.apply(this, args);
      
      // Se for uma scene com muitos objetos, provavelmente é o mapa
      if (this.children.length > 50) {
        setActiveScene(this);
      }
      
      return result;
    };

    return () => {
      if (THREE?.Scene?.prototype?.add) {
        (THREE.Scene.prototype as any).add = originalAdd;
      }
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-900 text-white rounded-full shadow-lg hover:bg-purple-800 transition-colors"
        title="Abrir Painel de Desenvolvedor Master"
      >
        <Zap size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-gray-900 text-white rounded-lg shadow-2xl border border-purple-500 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          <h3 className="font-bold text-sm">MASTER DEV PANEL</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-300 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="glb" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="w-full bg-gray-800 rounded-none border-b border-gray-700">
          <TabsTrigger value="glb" className="text-xs">GLB Logs</TabsTrigger>
          <TabsTrigger value="scene" className="text-xs">Scene</TabsTrigger>
        </TabsList>

        {/* GLB Logs Tab */}
        <TabsContent value="glb" className="flex-1 overflow-y-auto p-2 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs flex items-center gap-1">
              <input
                type="checkbox"
                checked={autoMonitor}
                onChange={(e) => setAutoMonitor(e.target.checked)}
                className="w-3 h-3"
              />
              Auto Monitor
            </label>
            <button
              onClick={() => setGlbLogs([])}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Limpar
            </button>
          </div>

          {glbLogs.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">
              Nenhum GLB carregado ainda
            </div>
          ) : (
            glbLogs.map((log, idx) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded border ${
                  log.status === 'success'
                    ? 'bg-green-900/30 border-green-600'
                    : log.status === 'error'
                    ? 'bg-red-900/30 border-red-600'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {log.status === 'success' && <CheckCircle2 size={12} className="text-green-400" />}
                  {log.status === 'error' && <AlertCircle size={12} className="text-red-400" />}
                  {log.status === 'loading' && <AlertTriangle size={12} className="text-yellow-400" />}
                  <span className="font-mono truncate">{log.url.split('/').pop()}</span>
                </div>
                <div className="text-gray-300 space-y-0.5">
                  <div>Status: <span className="text-yellow-300">{log.status}</span></div>
                  {log.duration && <div>Tempo: <span className="text-blue-300">{log.duration}ms</span></div>}
                  {log.meshCount && <div>Meshes: <span className="text-blue-300">{log.meshCount}</span></div>}
                  {log.materialCount && <div>Materiais: <span className="text-blue-300">{log.materialCount}</span></div>}
                  {log.error && <div className="text-red-300">Erro: {log.error}</div>}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Scene Analysis Tab */}
        <TabsContent value="scene" className="flex-1 overflow-y-auto p-2 space-y-2">
          <button
            onClick={() => activeScene && analyzeScene(activeScene)}
            className="w-full text-xs px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded mb-2"
          >
            Analisar Scene Agora
          </button>

          {sceneAnalysis ? (
            <div className="space-y-2 text-xs">
              <div className="bg-gray-800 p-2 rounded space-y-1">
                <div>Total Children: <span className="text-blue-300">{sceneAnalysis.totalChildren}</span></div>
                <div>Meshes: <span className="text-blue-300">{sceneAnalysis.meshCount}</span></div>
                <div>Lights: <span className="text-blue-300">{sceneAnalysis.lightCount}</span></div>
                <div>Groups: <span className="text-blue-300">{sceneAnalysis.groupCount}</span></div>
                <div>Visíveis: <span className="text-green-300">{sceneAnalysis.visibleMeshes}</span></div>
                <div>Ocultos: <span className="text-red-300">{sceneAnalysis.hiddenMeshes}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">Clique em "Analisar" para começar</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-400">
        <div>Logs: {glbLogs.length}</div>
        <div>Scene: {sceneAnalysis ? 'Analisada' : 'Aguardando'}</div>
      </div>
    </div>
  );
}
