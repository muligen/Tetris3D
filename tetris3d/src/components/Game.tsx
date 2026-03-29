import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTetrisStore } from '../stores/tetrisStore';
import { GameBoard } from './GameBoard';
import { ScoreBoard } from './ScoreBoard';
import { GameOver } from './GameOver';
import { TouchControls } from './TouchControls';
import { Leaderboard } from './Leaderboard';
import { ModeSelector } from './ModeSelector';
import { MiniModeSelector } from './ModeSelector';
import { EnhancedBackground } from './effects/EnhancedBackground';
import { LineClearEffect } from './effects/LineClearEffect';
import { LandingBurstEffect } from './effects/LandingBurstEffect';
import { ImpactRipple } from './effects/ImpactRipple';
import { ComboFlashEffect } from './effects/ComboFlashEffect';

// Screen shake component
function ScreenShake() {
  const { camera } = useThree();
  const originalPosition = useRef<THREE.Vector3>(new THREE.Vector3(5, 9.5, 28));
  const shakeIntensity = useTetrisStore((state) => state.screenShakeIntensity);
  const updateScreenShake = useTetrisStore((state) => state.updateScreenShake);

  useFrame((_, delta) => {
    if (shakeIntensity > 0) {
      const intensity = updateScreenShake(delta);
      if (intensity > 0) {
        const offsetX = (Math.random() - 0.5) * intensity * 0.5;
        const offsetY = (Math.random() - 0.5) * intensity * 0.5;
        const offsetZ = (Math.random() - 0.5) * intensity * 0.5;

        camera.position.set(
          originalPosition.current.x + offsetX,
          originalPosition.current.y + offsetY,
          originalPosition.current.z + offsetZ
        );
      } else {
        camera.position.copy(originalPosition.current);
      }
    }
  });

  return null;
}

// Landing effects component
function LandingEffects() {
  const landingImpact = useTetrisStore((state) => state.landingImpact);

  if (!landingImpact) return null;

  return (
    <>
      {/* Particle burst effect */}
      <LandingBurstEffect
        position={landingImpact.position}
        color={landingImpact.color}
        intensity={landingImpact.intensity}
      />

      {/* Impact ripple effect */}
      <ImpactRipple
        position={landingImpact.position}
        color={landingImpact.color}
        intensity={landingImpact.intensity}
      />
    </>
  );
}

// Game scene component
function GameScene() {
  const game = useTetrisStore((state) => state.game);
  const clearedRows = useTetrisStore((state) => state.clearedRows);
  const lineClearEnhanced = useTetrisStore((state) => state.lineClearEnhanced);
  const comboFlashIntensity = useTetrisStore((state) => state.comboFlashIntensity);
  const clearLineClear = useTetrisStore((state) => state.clearLineClear);
  const clearLineClearEnhanced = useTetrisStore((state) => state.clearLineClearEnhanced);

  if (!game) return null;

  return (
    <>
      {/* Enhanced background */}
      <EnhancedBackground />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 8, 0]} intensity={0.5} />

      {/* Game board */}
      <GameBoard board={game.getBoard()} currentPiece={game.getCurrentPiece()} />

      {/* Landing impact effects */}
      <LandingEffects />

      {/* Line clear effects - use enhanced version if available */}
      {lineClearEnhanced ? (
        <LineClearEffect
          rows={lineClearEnhanced.rows}
          rowColors={lineClearEnhanced.rowColors}
          combo={lineClearEnhanced.combo}
          onComplete={clearLineClearEnhanced}
        />
      ) : clearedRows.length > 0 ? (
        <LineClearEffect
          rows={clearedRows}
          onComplete={clearLineClear}
        />
      ) : null}

      {/* Combo flash effect */}
      {comboFlashIntensity > 0 && (
        <ComboFlashEffect intensity={comboFlashIntensity} />
      )}

      {/* Screen shake */}
      <ScreenShake />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
        target={[5, 9.5, 0]}
      />
    </>
  );
}

export function Game() {
  const game = useTetrisStore((state) => state.game);
  const highScore = useTetrisStore((state) => state.highScore);
  const currentMode = useTetrisStore((state) => state.currentMode);
  const soundEnabled = useTetrisStore((state) => state.soundEnabled);
  const showLeaderboard = useTetrisStore((state) => state.showLeaderboard);
  const showModeSelector = useTetrisStore((state) => state.showModeSelector);
  const comboCount = useTetrisStore((state) => state.comboCount);
  useTetrisStore((state) => state.version); // Subscribe to version for re-renders
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(0);

  // Initialize game - callbacks are already set up in tetrisStore init()
  useEffect(() => {
    if (!game) {
      useTetrisStore.getState().init();
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!game) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          useTetrisStore.getState().moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          useTetrisStore.getState().moveRight();
          break;
        case 'ArrowUp':
          e.preventDefault();
          useTetrisStore.getState().rotate();
          break;
        case 'ArrowDown':
          e.preventDefault();
          useTetrisStore.getState().hardDrop();
          break;
        case ' ':
          e.preventDefault();
          useTetrisStore.getState().hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          useTetrisStore.getState().togglePause();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          useTetrisStore.getState().restart();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          useTetrisStore.getState().toggleModeSelector();
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          useTetrisStore.getState().toggleLeaderboard();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          useTetrisStore.getState().toggleSound();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game]);

  // Game loop
  useEffect(() => {
    const animate = (time: number) => {
      requestRef.current = requestAnimationFrame(animate);

      if (!game || game.getState() === 'paused') {
        previousTimeRef.current = time;
        return;
      }

      const deltaTime = time - previousTimeRef.current;
      previousTimeRef.current = time;

      useTetrisStore.getState().update(deltaTime);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [game]);

  if (!game) {
    return <div>Loading...</div>;
  }

  const isGameOver = game.isGameOver();
  const isPaused = game.getState() === 'paused';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black', overflow: 'hidden' }}>
      {/* Three.js Canvas */}
      <Canvas
        camera={{
          position: [5, 9.5, 28],
          fov: 45,
        }}
        shadows
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      >
        <GameScene />
      </Canvas>

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, color: '#fff', fontFamily: 'monospace' }}>
        {/* Top toolbar */}
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'auto', gap: 8 }}>
          {/* Mode selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MiniModeSelector
              currentMode={currentMode}
              onModeChange={(mode) => useTetrisStore.getState().switchMode(mode)}
            />
            <button
              onClick={() => useTetrisStore.getState().toggleLeaderboard()}
              style={{ padding: '4px 12px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, color: '#fff', fontSize: 14, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
            >
              Leaderboard (L)
            </button>
          </div>

          {/* Center: Combo display and Sound */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {comboCount > 1 && (
              <div style={{
                padding: '4px 16px',
                backgroundColor: comboCount >= 4 ? 'rgba(255, 215, 0, 0.8)' : comboCount >= 2 ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 100, 255, 0.8)',
                borderRadius: 4,
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255,255,255,0.5)',
                animation: 'pulse 0.5s ease-in-out infinite',
              }}>
                {comboCount}x COMBO!
              </div>
            )}
            <button
              onClick={() => useTetrisStore.getState().toggleSound()}
              style={{ padding: '4px 12px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, color: '#fff', fontSize: 14, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
            >
              {soundEnabled ? 'Sound (S)' : 'Sound (S)'}
            </button>
          </div>

          {/* Right: Fullscreen */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            style={{ padding: '4px 12px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, color: '#fff', fontSize: 14, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
          >
            {document.fullscreenElement ? 'Exit (F)' : 'Fullscreen (F)'}
          </button>
        </div>

        {/* Score board - right side middle */}
        <ScoreBoard
          score={game.getScore()}
          highScore={highScore}
          level={game.getLevel()}
          lines={game.getLines()}
          nextPieceType={game.getNextPieceType()}
        />

        {/* Pause overlay */}
        {isPaused && !isGameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', pointerEvents: 'auto' }}>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#fff' }}>PAUSED</div>
            <p style={{ fontSize: 20, color: '#ccc', marginTop: 16 }}>Press P to resume</p>
            <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
              <button
                onClick={() => useTetrisStore.getState().toggleLeaderboard()}
                style={{ padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 16, border: 'none', cursor: 'pointer' }}
              >
                Leaderboard
              </button>
              <button
                onClick={() => useTetrisStore.getState().toggleModeSelector()}
                style={{ padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: 16, border: 'none', cursor: 'pointer' }}
              >
                Change Mode
              </button>
            </div>
          </div>
        )}

        {/* Game over */}
        {isGameOver && (
          <GameOver
            score={game.getScore()}
            level={game.getLevel()}
            lines={game.getLines()}
            mode={currentMode}
            onRestart={() => useTetrisStore.getState().restart()}
          />
        )}

        {/* Touch controls (mobile) */}
        <TouchControls
          onMoveLeft={() => useTetrisStore.getState().moveLeft()}
          onMoveRight={() => useTetrisStore.getState().moveRight()}
          onRotate={() => useTetrisStore.getState().rotate()}
          onHardDrop={() => useTetrisStore.getState().hardDrop()}
          onTogglePause={() => useTetrisStore.getState().togglePause()}
        />
      </div>

      {/* Mode selector dialog */}
      {showModeSelector && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40 p-4 pointer-events-auto">
          <div className="relative">
            <button
              onClick={() => useTetrisStore.getState().toggleModeSelector()}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full text-black font-bold text-xl hover:bg-gray-200 transition-all"
              aria-label="Close"
            >
              x
            </button>
            <ModeSelector
              currentMode={currentMode}
              onModeChange={(mode) => {
                useTetrisStore.getState().switchMode(mode);
                useTetrisStore.getState().toggleModeSelector();
              }}
            />
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <Leaderboard onClose={() => useTetrisStore.getState().toggleLeaderboard()} />
      )}

      {/* CSS for combo animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
