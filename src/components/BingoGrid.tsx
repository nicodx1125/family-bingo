// components/BingoGrid.tsx
'use client';

interface BingoGridProps {
    history: number[];
    currentNumber: number | null;
    gamePhase: 'normal' | 'climax';
}

export function BingoGrid({ history, currentNumber, gamePhase }: BingoGridProps) {
    const columns = [
        { label: 'B', min: 1, max: 15 },
        { label: 'I', min: 16, max: 30 },
        { label: 'N', min: 31, max: 45 },
        { label: 'G', min: 46, max: 60 },
        { label: 'O', min: 61, max: 75 },
    ];

    return (
        <div className={`h-full p-4 overflow-y-auto ${gamePhase === 'climax' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
            }`}>
            <div className="flex h-full gap-2">
                {columns.map(col => (
                    <div key={col.label} className="flex-1 flex flex-col min-w-0">
                        {/* Column Header */}
                        <div className={`
               text-center py-2 mb-2 rounded-t-lg font-black text-2xl
               ${gamePhase === 'climax' ? 'bg-red-900 text-red-100' : 'bg-blue-100 text-blue-800'}
             `}>
                            {col.label}
                        </div>

                        {/* Numbers */}
                        <div className="flex-1 flex flex-col gap-2">
                            {Array.from({ length: col.max - col.min + 1 }, (_, i) => col.min + i).map(num => {
                                const isHit = history.includes(num);
                                const isCurrent = num === currentNumber;

                                return (
                                    <div
                                        key={num}
                                        className={`
                        flex-1 flex items-center justify-center rounded text-lg font-bold transition-all duration-300
                        ${isCurrent
                                                ? 'bg-yellow-400 text-black scale-105 shadow-md ring-2 ring-yellow-200 z-10'
                                                : isHit
                                                    ? (gamePhase === 'climax' ? 'bg-red-600 text-white' : 'bg-slate-600 text-white')
                                                    : (gamePhase === 'climax' ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300')}
                      `}
                                    >
                                        {num}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
