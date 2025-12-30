// components/BingoRoller.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Play, Square, RotateCcw, Flame } from 'lucide-react';
import { getBingoAudio } from '@/utils/audio';

interface BingoRollerProps {
    currentNumber: number | null;
    isRolling: boolean;
    gamePhase: 'normal' | 'climax';
    isManualClimax: boolean;
    onStart: () => void;
    onStop: () => void;
    onReset: () => void;
    onToggleClimax: () => void;
    onRevealComplete: () => void;
}

type AnimationType = 'pachinko' | 'flash' | 'drum' | 'countdown' | 'slide';

export function BingoRoller({
    currentNumber,
    isRolling,
    gamePhase,
    isManualClimax,
    onStart,
    onStop,
    onReset,
    onToggleClimax,
    onRevealComplete
}: BingoRollerProps) {
    const [displayNum, setDisplayNum] = useState<number | string>('Start');
    const [isRevealing, setIsRevealing] = useState(false);
    // Explicit state for 'countdown' animation text (e.g. 3... 2... 1...)
    const [overrideText, setOverrideText] = useState<string | null>(null);

    const frameRef = useRef<number>(0);
    const audio = getBingoAudio();

    // Reset override text when rolling starts
    useEffect(() => {
        if (isRolling) setOverrideText(null);
    }, [isRolling]);

    // Animation Loop
    useEffect(() => {
        if (isRolling) {
            setIsRevealing(false);
            audio.playRoll();
            const animate = () => {
                setDisplayNum(Math.floor(Math.random() * 75) + 1);
                frameRef.current = requestAnimationFrame(animate);
            };
            frameRef.current = requestAnimationFrame(animate);
        } else {
            audio.stopRoll();
            if (frameRef.current) cancelAnimationFrame(frameRef.current);

            // STOPPED with a number
            if (currentNumber !== null) {
                if (gamePhase === 'climax') {
                    // Start Random Climax Animation
                    if (!isRevealing) {
                        setIsRevealing(true);

                        // Select Random Animation
                        const animations: AnimationType[] = ['pachinko', 'flash', 'drum', 'countdown', 'slide'];
                        const selectedAnim = animations[Math.floor(Math.random() * animations.length)];

                        // Use a ref to track if component unmounted or reset during async
                        const isActive = { current: true };

                        if (selectedAnim === 'pachinko') {
                            // --- PACHINKO (Decelerate) ---
                            audio.playHeartbeat();
                            let speed = 50;
                            let totalTime = 0;
                            const maxTime = 3000;

                            const slowRoll = () => {
                                if (!isActive.current) return;
                                setDisplayNum(Math.floor(Math.random() * 75) + 1);
                                speed *= 1.1;
                                totalTime += speed;
                                if (totalTime < maxTime) {
                                    frameRef.current = window.setTimeout(slowRoll, speed);
                                } else {
                                    finalizeReveal();
                                }
                            };
                            slowRoll();

                        } else if (selectedAnim === 'flash') {
                            // --- FLASH (Blink) ---
                            // 2 seconds of high speed random + blinking? 
                            // Or just silence then FLASH.
                            // Let's do: Rapid random numbers (standard roll sound stopped), then 
                            // 1 second of "Darkness" (Heartbeat), then Reveal.

                            // Immediately stop showing numbers for a moment (Blackout)
                            setDisplayNum('');
                            audio.playHeartbeat();

                            // Wait 1.5s
                            frameRef.current = window.setTimeout(() => {
                                if (!isActive.current) return;
                                finalizeReveal();
                            }, 1500);

                        } else if (selectedAnim === 'drum') {
                            // --- DRUM ROLL (Classic Tension) ---
                            // Continue "rolling" manually for fixed time, then sudden stop.
                            const drum = () => {
                                if (!isActive.current) return;
                                setDisplayNum(Math.floor(Math.random() * 75) + 1);
                                frameRef.current = requestAnimationFrame(drum);
                            };
                            drum();

                            // Stop after 2 seconds
                            setTimeout(() => {
                                if (!isActive.current) return;
                                if (frameRef.current) cancelAnimationFrame(frameRef.current);
                                finalizeReveal();
                            }, 2000);

                        } else if (selectedAnim === 'countdown') {
                            // --- COUNTDOWN (3..2..1) ---
                            let count = 3;
                            setOverrideText(String(count));
                            // Use heartbeat for ticks
                            audio.playHeartbeat();

                            const tick = () => {
                                if (!isActive.current) return;
                                if (count > 0) {
                                    setOverrideText(String(count));
                                    count--;
                                    frameRef.current = window.setTimeout(tick, 800);
                                } else {
                                    setOverrideText(null); // Show real number
                                    finalizeReveal();
                                }
                            };
                            // Start tick
                            frameRef.current = window.setTimeout(tick, 800);

                        } else if (selectedAnim === 'slide') {
                            // --- SLIDE (Simulated Slot Machine / Slide in) ---
                            // Logic: Show random numbers slower and slower (linear)
                            let speed = 20;
                            let count = 0;
                            const maxCount = 40; // 40 steps

                            const slidin = () => {
                                if (!isActive.current) return;
                                setDisplayNum(Math.floor(Math.random() * 75) + 1);
                                count++;
                                speed += 2; // Linear slow down
                                if (count < maxCount) {
                                    frameRef.current = window.setTimeout(slidin, speed);
                                } else {
                                    finalizeReveal();
                                }
                            };
                            slidin();
                        }

                        // Helper to finish up
                        const finalizeReveal = () => {
                            if (!isActive.current) return;
                            audio.stopHeartbeat();
                            setDisplayNum(currentNumber);
                            setOverrideText(null);

                            // Dramatic pause (0.5s)
                            frameRef.current = window.setTimeout(() => {
                                if (!isActive.current) return;
                                setIsRevealing(false);
                                onRevealComplete();
                            }, 500);
                        };

                        // Cleanup for this specific run
                        return () => {
                            isActive.current = false;
                            if (frameRef.current) {
                                cancelAnimationFrame(frameRef.current);
                                clearTimeout(frameRef.current);
                            }
                        };
                    }
                } else {
                    // Normal instant reveal
                    setDisplayNum(currentNumber);
                    onRevealComplete();
                }
            } else {
                // RESET STATE
                setDisplayNum('Start');
                setOverrideText(null);
                setIsRevealing(false);
                audio.stopHeartbeat();
            }
        }
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                clearTimeout(frameRef.current);
            }
            audio.stopHeartbeat();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRolling, currentNumber]);

    return (
        <div className={`flex flex-col items-center justify-center p-8 h-full transition-colors duration-1000 ${gamePhase === 'climax' ? 'bg-red-50 text-red-900' : 'bg-blue-50 text-blue-900'
            }`}>
            <div className="mb-4 text-2xl font-bold tracking-wider flex items-center gap-2">
                BINGO CHANCE
                <button
                    onClick={onToggleClimax}
                    className={`p-1 rounded-full hover:bg-black/5 transition-colors ${isManualClimax ? 'text-red-600' : 'text-gray-300'}`}
                    title="Toggle Climax Mode"
                >
                    <Flame size={20} fill={isManualClimax ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Main Display */}
            <div className={`
        flex items-center justify-center w-[30rem] h-[30rem] mb-12 rounded-full border-[12px] shadow-2xl text-[12rem] font-black tabular-nums bg-white
        ${gamePhase === 'climax' ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600'}
        ${isRevealing ? 'animate-pulse' : ''}
      `}>
                {overrideText || displayNum}
            </div>

            {/* Controls */}
            <div className="flex gap-6">
                {!isRolling && !isRevealing ? (
                    <button
                        onClick={onStart}
                        disabled={currentNumber !== null && isRolling}
                        className={`
              flex items-center gap-3 px-12 py-6 text-3xl font-bold text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all
              ${gamePhase === 'climax'
                                ? 'bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 shadow-red-500/50'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 shadow-blue-500/50'}
            `}
                    >
                        <Play size={32} fill="currentColor" /> MAWASU
                    </button>
                ) : (
                    <button
                        onClick={isRevealing ? undefined : onStop} // Disable stop during reveal
                        disabled={isRevealing}
                        className={`flex items-center gap-3 px-12 py-6 text-3xl font-bold text-white bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all ${isRevealing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Square size={32} fill="currentColor" /> STOP
                    </button>
                )}
            </div>

            <div className="mt-12">
                <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                    <RotateCcw size={16} /> リセットする
                </button>
            </div>
        </div>
    );
}
