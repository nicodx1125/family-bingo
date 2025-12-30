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

// 回胴式リールコンポーネント - スロットマシン風縦スクロール
function Reel({
    digit,
    targetDigit,
    isSpinning,
    isStopped,
    maxDigit,
}: {
    digit: number;
    targetDigit: number;
    isSpinning: boolean;
    isStopped: boolean;
    maxDigit: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Create an array of all digits for the reel
    const digits = Array.from({ length: maxDigit + 1 }, (_, i) => i);

    return (
        <div
            ref={containerRef}
            className="overflow-hidden rounded-lg bg-gradient-to-b from-black/20 via-transparent to-black/20"
            style={{
                height: '200px',
                width: '120px',
            }}
        >
            <div
                className="transition-transform"
                style={{
                    transform: `translateY(${-digit * 200 + 0}px)`,
                    transitionDuration: isSpinning ? '50ms' : '300ms',
                    transitionTimingFunction: isStopped ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'linear',
                }}
            >
                {digits.map((d) => (
                    <div
                        key={d}
                        className="flex items-center justify-center font-black tabular-nums"
                        style={{
                            height: '200px',
                            fontSize: '160px',
                            lineHeight: 1,
                        }}
                    >
                        {d}
                    </div>
                ))}
            </div>
        </div>
    );
}

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

    // リール用State
    const [tensDigit, setTensDigit] = useState(0);
    const [onesDigit, setOnesDigit] = useState(0);
    const [tensStopped, setTensStopped] = useState(false);
    const [onesStopped, setOnesStopped] = useState(false);

    const frameRef = useRef<number>(0);
    const tensRef = useRef<number>(0);
    const onesRef = useRef<number>(0);
    const audio = getBingoAudio();

    // Animation Loop
    useEffect(() => {
        if (isRolling) {
            setIsRevealing(false);
            setTensStopped(false);
            setOnesStopped(false);
            audio.playRoll();

            const animate = () => {
                setDisplayNum(Math.floor(Math.random() * 75) + 1);
                // Rotate through digits sequentially for smooth drum effect
                setTensDigit(prev => (prev + 1) % 8);
                setOnesDigit(prev => (prev + 1) % 10);
                frameRef.current = requestAnimationFrame(animate);
            };
            frameRef.current = requestAnimationFrame(animate);
        } else {
            audio.stopRoll();
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (tensRef.current) clearTimeout(tensRef.current);
            if (onesRef.current) clearTimeout(onesRef.current);

            // STOPPED with a number
            if (currentNumber !== null) {
                // 両モードで回胴式アニメーション
                if (!isRevealing) {
                    setIsRevealing(true);
                    setTensStopped(false);
                    setOnesStopped(false);

                    const isActive = { current: true };
                    if (gamePhase === 'climax') {
                        audio.playHeartbeat();
                    }

                    // Calculate target digits
                    const padded = currentNumber.toString().padStart(2, '0');
                    const targetTens = parseInt(padded[0], 10);
                    const targetOnes = parseInt(padded[1], 10);

                    // Random order
                    const tensFirst = Math.random() < 0.5;
                    const isClimax = gamePhase === 'climax';

                    // ステップ数定義 (1ステップ = 数字1つ分)
                    // Normal: 短く (12ステップ)
                    // Climax 1st: 長め (30ステップ)
                    // Climax 2nd: 超長く (65ステップ = 焦らし強化)
                    const STEPS_NORMAL = 12;
                    const STEPS_CLIMAX_1 = 30;
                    const STEPS_CLIMAX_2 = 65;

                    const tensTotalSteps = isClimax
                        ? (tensFirst ? STEPS_CLIMAX_1 : STEPS_CLIMAX_2)
                        : STEPS_NORMAL;

                    const onesTotalSteps = isClimax
                        ? (tensFirst ? STEPS_CLIMAX_2 : STEPS_CLIMAX_1)
                        : STEPS_NORMAL;

                    // Start value logic (Random start)
                    let currentTens = Math.floor(Math.random() * 8); // 0-7
                    let currentOnes = Math.floor(Math.random() * 10); // 0-9

                    // 初期状態セット
                    setTensDigit(currentTens);
                    setOnesDigit(currentOnes);

                    // 状態管理
                    let tensStepsTaken = 0;
                    let onesStepsTaken = 0;
                    let tensSpeed = 60;
                    let onesSpeed = 60;
                    let tensDone = false;
                    let onesDone = false;

                    const checkCompletion = () => {
                        if (tensDone && onesDone) {
                            setTimeout(() => {
                                if (!isActive.current) return;
                                setDisplayNum(currentNumber);
                                audio.stopHeartbeat();
                                setIsRevealing(false);
                                onRevealComplete();
                            }, 500);
                        }
                    };

                    const spinTens = () => {
                        if (!isActive.current) return;

                        // 進める
                        tensStepsTaken++;

                        // 最後のステップならターゲットを表示
                        if (tensStepsTaken >= tensTotalSteps) {
                            currentTens = targetTens;
                        } else {
                            // それ以外はランダム（前回と違う数字にする）
                            let next = Math.floor(Math.random() * 8);
                            while (next === currentTens) {
                                next = Math.floor(Math.random() * 8);
                            }
                            currentTens = next;
                        }
                        setTensDigit(currentTens);

                        // 終了判定
                        if (tensStepsTaken >= tensTotalSteps) {
                            tensDone = true;
                            setTensStopped(true);
                            checkCompletion();
                            return;
                        }

                        // 速度計算 (残りステップに基づく)
                        const remaining = tensTotalSteps - tensStepsTaken;

                        if (remaining <= 8) {
                            // 減速フェーズ
                            const isSecondReel = isClimax && !tensFirst;
                            const slowdownRate = isSecondReel ? 1.5 : 1.15;
                            tensSpeed = Math.min(tensSpeed * slowdownRate, 800);
                        } else {
                            // 通常回転
                            tensSpeed = 60;
                        }

                        tensRef.current = window.setTimeout(spinTens, tensSpeed);
                    };

                    const spinOnes = () => {
                        if (!isActive.current) return;

                        onesStepsTaken++;

                        // 最後のステップならターゲットを表示
                        if (onesStepsTaken >= onesTotalSteps) {
                            currentOnes = targetOnes;
                        } else {
                            // それ以外はランダム（前回と違う数字にする）
                            let next = Math.floor(Math.random() * 10);
                            while (next === currentOnes) {
                                next = Math.floor(Math.random() * 10);
                            }
                            currentOnes = next;
                        }
                        setOnesDigit(currentOnes);

                        if (onesStepsTaken >= onesTotalSteps) {
                            onesDone = true;
                            setOnesStopped(true);
                            checkCompletion();
                            return;
                        }

                        const remaining = onesTotalSteps - onesStepsTaken;

                        if (remaining <= 8) {
                            const isSecondReel = isClimax && tensFirst;
                            const slowdownRate = isSecondReel ? 1.5 : 1.15;
                            onesSpeed = Math.min(onesSpeed * slowdownRate, 800);
                        } else {
                            onesSpeed = 60;
                        }

                        onesRef.current = window.setTimeout(spinOnes, onesSpeed);
                    };

                    // 開始
                    // 少しずらしてスタート感を出す
                    spinTens();
                    setTimeout(spinOnes, 30);

                    return () => {
                        isActive.current = false;
                        clearTimeout(tensRef.current);
                        clearTimeout(onesRef.current);
                    };
                }
            } else {
                // RESET STATE
                setDisplayNum('Start');
                setIsRevealing(false);
                setTensStopped(false);
                setOnesStopped(false);
                audio.stopHeartbeat();
            }
        }
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                clearTimeout(frameRef.current);
            }
            clearTimeout(tensRef.current);
            clearTimeout(onesRef.current);
            audio.stopHeartbeat();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRolling, currentNumber]);

    // 両モードでリール表示を使用
    const showReelDigits = isRolling || isRevealing || (currentNumber !== null && tensStopped && onesStopped);

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
                flex items-center justify-center w-[30rem] h-[30rem] mb-12 rounded-full border-[12px] shadow-2xl bg-white
                ${gamePhase === 'climax' ? 'border-red-500 text-red-600' : 'border-blue-500 text-blue-600'}
            `}>
                {showReelDigits ? (
                    <div className="flex items-center justify-center text-[12rem] font-black tabular-nums leading-none gap-4">
                        {/* 10の位 */}
                        <div style={{ width: '120px', textAlign: 'center' }}>
                            {tensDigit}
                        </div>

                        {/* 1の位 */}
                        <div style={{ width: '120px', textAlign: 'center' }}>
                            {onesDigit}
                        </div>
                    </div>
                ) : (
                    <span className="text-[12rem] font-black tabular-nums">{displayNum}</span>
                )}
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
                        onClick={isRevealing ? undefined : onStop}
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
