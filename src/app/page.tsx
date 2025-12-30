// app/page.tsx
'use client';

import { useBingo } from '@/hooks/useBingo';
import { BingoRoller } from '@/components/BingoRoller';
import { BingoGrid } from '@/components/BingoGrid';
import { ResetModal } from '@/components/ResetModal';
import { getBingoAudio } from '@/utils/audio';
import confetti from 'canvas-confetti';
import { useState, useEffect } from 'react';

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
        toggleManualClimax
    } = useBingo();

    // Local state to track if we are in the "reveal animation" phase (pachinko or normal)
    // When true, we do NOT show the current number in the grid yet (delayed commit).
    const [isRevealingResult, setIsRevealingResult] = useState(false);

    // Reset Modal State
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const handleStop = () => {
        // Only draw the number internally (stops rolling logic) but don't add to history
        drawNumber();
        // Start visual reveal phase
        setIsRevealingResult(true);
        // Visual effects (animation) are handled by BingoRoller, which will call onRevealComplete
    };

    // Spacebar Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                if (isResetModalOpen || isRevealingResult) return;

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
    }, [isResetModalOpen, isRevealingResult, isRolling, startRoll]); // handleStop is defined inside, so pass deps carefully or move it out. 
    // handleStop depends on drawNumber, setIsRevealingResult. drawNumber is stable (ref from hook? useBingo uses useCallback).
    // Actually handleStop changes on every render because it's defined inside component without useCallback.
    // Better to just call logic directly or wrap handleStop in useCallback.
    // Let's wrap handleStop in useCallback or just use it as dependency (might trigger effect re-binds but fine).

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
            confetti({
                particleCount: 100 * scalar,
                spread: 70,
                origin: { x: 0.3, y: 0.6 }, // Left side origin
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

            {/* Left Panel: Roller (55%) */}
            <section className="h-[40vh] md:h-full md:w-[55%] flex-shrink-0 relative z-10 shadow-2xl">
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

            {/* Right Panel: Grid (45%) */}
            <section className="flex-1 h-full overflow-hidden bg-gray-50">
                <BingoGrid
                    history={history}
                    // Pass null if revealing, so the grid doesn't light up the new number yet
                    currentNumber={isRevealingResult ? null : currentNumber}
                    gamePhase={gamePhase}
                />
            </section>
        </main>
    );
}
