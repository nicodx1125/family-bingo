// components/ResetModal.tsx
'use client';

interface ResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function ResetModal({ isOpen, onClose, onConfirm }: ResetModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    本当にリセットしますか？
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    現在のゲーム進行状況と、これまでの抽選履歴はすべて消去されます。この操作は取り消せません。
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        リセットする
                    </button>
                </div>
            </div>
        </div>
    );
}
