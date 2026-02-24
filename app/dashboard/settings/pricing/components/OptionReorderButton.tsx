export default function OptionReorderButton({ direction, disabled, onReorder }: { direction: 'up' | 'down', disabled: boolean, onReorder: () => void }) {
    return (
        <button
            onClick={onReorder}
            disabled={disabled}
            className={`p-0.5 rounded transition-colors ${disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 dark:text-zinc-500 hover:text-blue-600 hover:bg-blue-50'}`}
        >
            {direction === 'up' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            )}
        </button>
    )
}
