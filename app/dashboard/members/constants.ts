export type BeltOption = {
    name: string
    colorClass?: string
    style?: React.CSSProperties
}

// Ordered List: Adults -> Kids
export const BELT_OPTIONS_DATA: BeltOption[] = [
    // Adult Belts
    { name: '화이트 (성인)', colorClass: 'bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-zinc-100' },
    { name: '블루', colorClass: 'bg-blue-600 text-white' },
    { name: '퍼플', colorClass: 'bg-purple-600 text-white' },
    { name: '브라운', colorClass: 'bg-yellow-800 text-white' },
    { name: '블랙', colorClass: 'bg-gray-900 text-white dark:border dark:border-gray-500' },

    // Kids Belts
    { name: '화이트 (유소년)', colorClass: 'bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-zinc-100' },
    { name: '그레이-화이트', colorClass: 'border border-gray-300 text-gray-900 font-medium', style: { background: 'linear-gradient(180deg, #d1d5db 35%, #ffffff 35%, #ffffff 65%, #d1d5db 65%)' } },
    { name: '그레이', colorClass: 'bg-gray-300 text-gray-900 font-medium border border-gray-300' },
    { name: '그레이-블랙', colorClass: 'border border-gray-400 text-white font-medium', style: { background: 'linear-gradient(180deg, #d1d5db 35%, #1f2937 35%, #1f2937 65%, #d1d5db 65%)' } },
    { name: '옐로우-화이트', colorClass: 'border border-yellow-400', style: { background: 'linear-gradient(180deg, #facc15 35%, #ffffff 35%, #ffffff 65%, #facc15 65%)' } },
    { name: '옐로우', colorClass: 'bg-yellow-400 text-yellow-900 border border-yellow-400' },
    { name: '옐로우-블랙', colorClass: 'border border-yellow-400', style: { background: 'linear-gradient(180deg, #facc15 35%, #1f2937 35%, #1f2937 65%, #facc15 65%)' } },
    { name: '오렌지-화이트', colorClass: 'border border-orange-500', style: { background: 'linear-gradient(180deg, #f97316 35%, #ffffff 35%, #ffffff 65%, #f97316 65%)' } },
    { name: '오렌지', colorClass: 'bg-orange-500 text-white border border-orange-500' },
    { name: '오렌지-블랙', colorClass: 'border border-orange-500', style: { background: 'linear-gradient(180deg, #f97316 35%, #1f2937 35%, #1f2937 65%, #f97316 65%)' } },
    { name: '그린-화이트', colorClass: 'border border-green-600', style: { background: 'linear-gradient(180deg, #16a34a 35%, #ffffff 35%, #ffffff 65%, #16a34a 65%)' } },
    { name: '그린', colorClass: 'bg-green-600 text-white border border-green-600' },
    { name: '그린-블랙', colorClass: 'border border-green-600', style: { background: 'linear-gradient(180deg, #16a34a 35%, #1f2937 35%, #1f2937 65%, #16a34a 65%)' } },
]

export const displayBeltName = (name: string) => {
    if (!name) return '-'
    const lowerName = name.toLowerCase().trim()
    const map: Record<string, string> = {
        'white': '화이트 (성인)',
        'white (adult)': '화이트 (성인)',
        'white (kids)': '화이트 (유소년)',
        'blue': '블루',
        'purple': '퍼플',
        'brown': '브라운',
        'black': '블랙',
        'gray-white': '그레이-화이트',
        'gray': '그레이',
        'gray-black': '그레이-블랙',
        'yellow-white': '옐로우-화이트',
        'yellow': '옐로우',
        'yellow-black': '옐로우-블랙',
        'orange-white': '오렌지-화이트',
        'orange': '오렌지',
        'orange-black': '오렌지-블랙',
        'green-white': '그린-화이트',
        'green': '그린',
        'green-black': '그린-블랙'
    }
    return map[lowerName] || name
}
