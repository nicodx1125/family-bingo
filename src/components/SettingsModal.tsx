// components/SettingsModal.tsx
'use client';

import { X, Settings as SettingsIcon } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    climaxTriggerRemaining: number;
    setClimaxTriggerRemaining: (val: number) => void;
}

export function SettingsModal({
    isOpen,
    onClose,
    climaxTriggerRemaining,
    setClimaxTriggerRemaining
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <SettingsIcon className="w-6 h-6" />
                        ゲーム設定
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Climax Trigger Setting */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700">
                            クライマックスモード開始設定
                        </label>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-gray-600">残り枚数が</span>
                            <input
                                type="number"
                                value={climaxTriggerRemaining}
                                onChange={(e) => setClimaxTriggerRemaining(Math.max(1, Math.min(74, parseInt(e.target.value) || 1)))}
                                className="w-20 px-3 py-2 text-xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                            <span className="text-gray-600">枚以下になったら発動</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            ※ 背景が赤くなり、演出が派手になります
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
