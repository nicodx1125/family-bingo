// hooks/useBingo.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BingoState {
    history: number[];
    currentNumber: number | null;
    isRolling: boolean;
    gamePhase: 'normal' | 'climax';
}

const STORAGE_KEY = 'family-bingo-state';

export function useBingo() {
    // Initialize state from local storage or defaults
    const [history, setHistory] = useState<number[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [isManualClimax, setIsManualClimax] = useState(false);

    // Initialize on mount to avoid hydration mismatch
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHistory(parsed.history || []);
                setCurrentNumber(parsed.currentNumber || null);
                setIsManualClimax(parsed.isManualClimax || false);
            } catch (e) {
                console.error('Failed to load bingo state', e);
            }
        }
    }, []);

    // Persist transitions
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ history, currentNumber, isManualClimax }));
    }, [history, currentNumber, isManualClimax]);

    const gamePhase = (history.length >= 35 || isManualClimax) ? 'climax' : 'normal';

    const toggleManualClimax = useCallback(() => {
        setIsManualClimax(prev => !prev);
    }, []);

    const startRoll = useCallback(() => {
        if (history.length >= 75) return; // Game over
        setIsRolling(true);
    }, [history.length]);

    const drawNumber = useCallback(() => {
        if (!isRolling) return null;

        // Generate random number not in history
        let nextNum;
        do {
            nextNum = Math.floor(Math.random() * 75) + 1;
        } while (history.includes(nextNum));

        // Note: We don't add to history yet.
        setCurrentNumber(nextNum);
        setIsRolling(false);
        return nextNum;
    }, [isRolling, history]);

    const addToHistory = useCallback((num: number) => {
        setHistory(prev => {
            if (prev.includes(num)) return prev;
            return [...prev, num];
        });
    }, []);

    const resetGame = useCallback(() => {
        setHistory([]);
        setCurrentNumber(null);
        setIsRolling(false);
        setIsManualClimax(false);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        history,
        currentNumber,
        isRolling,
        gamePhase,
        startRoll,
        drawNumber,
        addToHistory,
        resetGame,
        toggleManualClimax,
        isManualClimax
    };
}
