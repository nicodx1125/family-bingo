// app/page.tsx
'use client';

import { useBingo } from '@/hooks/useBingo';
import { BingoRoller } from '@/components/BingoRoller';
import { BingoGrid } from '@/components/BingoGrid';
import { ResetModal } from '@/components/ResetModal';
import { SettingsModal } from '@/components/SettingsModal';
import { getBingoAudio } from '@/utils/audio';
import confetti from 'canvas-confetti';
import { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, PanelRightClose, PanelRightOpen } from 'lucide-react';

export default function Home() {
    const {
        history,
        currentNumber,
        isRolling,
        gamePhase,
        isManualClimax,
        startRoll,
        drawNumber,
        addToHistory,
        resetGame,
        toggleManualClimax,
        remainingCount,
        climaxTriggerRemaining,
        setClimaxTriggerRemaining
    } = useBingo();

    // Local state to track if we are in the "reveal animation" phase (pachinko or normal)
    // When true, we do NOT show the current number in the grid yet (delayed commit).
    const [isRevealingResult, setIsRevealingResult] = useState(false);

    // Modal States
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Layout State
    const [isGridVisible, setIsGridVisible] = useState(true);

    const handleStop = useCallback(() => {
        // Only draw the number internally (stops rolling logic) but don't add to history
        drawNumber();
        // Start visual reveal phase
        setIsRevealingResult(true);
        // Visual effects (animation) are handled by BingoRoller, which will call onRevealComplete
    }, [drawNumber]);

    // Auto-stop effect (3 seconds)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRolling && !isRevealingResult) {
            timer = setTimeout(() => {
                handleStop();
            }, 3000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isRolling, isRevealingResult, handleStop]);

    // Spacebar Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                if (isResetModalOpen || isSettingsOpen || isRevealingResult) return;

                if (isRolling) {
                    handleStop();
                } else {
                    // Start rolling if we are not currently rolling
                    startRoll();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isResetModalOpen, isSettingsOpen, isRevealingResult, isRolling, startRoll, handleStop]);

    const handleRevealComplete = () => {
        // Triggered after visual reveal (immediate or delayed 3s + 0.5s pause)
        if (currentNumber) {
            // Commit to history now
            addToHistory(currentNumber);
            // End reveal phase -> triggers Grid update
            setIsRevealingResult(false);

            // Audio Effect
            getBingoAudio().playDecision(gamePhase === 'climax');

            // Confetti Effect
            const scalar = gamePhase === 'climax' ? 1.5 : 1.0;
            // Center if full screen, left-ish if grid is visible
            const originX = isGridVisible ? 0.3 : 0.5;
            confetti({
                particleCount: 100 * scalar,
                spread: 70,
                origin: { x: originX, y: 0.6 },
                colors: gamePhase === 'climax' ? ['#ff0000', '#ffa500', '#ffffff'] : undefined
            });
        }
    };

    const handleResetClick = () => {
        setIsResetModalOpen(true);
    };

    const confirmReset = () => {
        setIsRevealingResult(false);
        resetGame();
        setIsResetModalOpen(false);
    };

    return (
        <main className="flex flex-col md:flex-row h-screen overflow-hidden">
            <ResetModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={confirmReset}
            />
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                climaxTriggerRemaining={climaxTriggerRemaining}
                setClimaxTriggerRemaining={setClimaxTriggerRemaining}
            />

            {/* Left Panel: Roller */}
            <section className={`h-[40vh] md:h-full flex-shrink-0 relative z-10 shadow-2xl transition-all duration-500 ease-in-out ${isGridVisible ? 'md:w-[55%]' : 'w-full'
                }`}>
                {/* Top Right Controls Overlay */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
                    <div className="bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold">
                        残り {remainingCount} 枚
                    </div>

                    {/* Grid Toggle Button */}
                    <button
                        onClick={() => setIsGridVisible(prev => !prev)}
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all shadow-lg"
                        title={isGridVisible ? "一覧を隠す" : "一覧を表示"}
                    >
                        {isGridVisible ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
                    </button>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all shadow-lg"
                        title="設定"
                    >
                        <SettingsIcon size={24} />
                    </button>
                </div>

                <BingoRoller
                    currentNumber={currentNumber}
                    isRolling={isRolling}
                    gamePhase={gamePhase}
                    isManualClimax={isManualClimax}
                    onStart={startRoll}
                    onStop={handleStop}
                    onReset={handleResetClick}
                    onToggleClimax={toggleManualClimax}
                    onRevealComplete={handleRevealComplete}
                />
            </section>

            {/* Right Panel: Grid */}
            <div
                className={`flex-1 h-full overflow-hidden bg-gray-50 transition-all duration-500 ease-in-out ${isGridVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute right-0 w-0'
                    }`}
                style={{ display: isGridVisible ? 'block' : 'none' }} // Ensure it's removed from flow/layout when hidden for proper Roller expansion
            >
                <BingoGrid
                    history={history}
                    // Pass null if revealing, so the grid doesn't light up the new number yet
                    currentNumber={isRevealingResult ? null : currentNumber}
                    gamePhase={gamePhase}
                />
            </div>
        </main>
    );
}

