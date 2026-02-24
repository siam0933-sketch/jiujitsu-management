export type BeltOption = {
    name: string
    colorClass?: string
    style?: React.CSSProperties
}

// Ordered List: Adults -> Kids
export const BELT_OPTIONS_DATA: BeltOption[] = [
    // Adult Belts
    { name: '화이트 (성인)', colorClass: 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800' },
    { name: '블루', colorClass: 'bg-blue-600 text-white' },
    { name: '퍼플', colorClass: 'bg-purple-600 text-white' },
    { name: '브라운', colorClass: 'bg-yellow-800 text-white' },
    { name: '블랙', colorClass: 'bg-gray-900 text-white' },

    // Kids Belts
    { name: '화이트 (유소년)', colorClass: 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800' },
    { name: '그레이-화이트', colorClass: 'border border-gray-300 dark:border-zinc-700', style: { background: 'linear-gradient(180deg, #9ca3af 35%, #ffffff 35%, #ffffff 65%, #9ca3af 65%)' } },
    { name: '그레이', colorClass: 'bg-gray-400 text-white border border-gray-400' },
    { name: '그레이-블랙', colorClass: 'border border-gray-400', style: { background: 'linear-gradient(180deg, #9ca3af 35%, #1f2937 35%, #1f2937 65%, #9ca3af 65%)' } },
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
    const map: Record<string, string> = {
        'White': '화이트 (성인)',
        'Blue': '블루',
        'Purple': '퍼플',
        'Brown': '브라운',
        'Black': '블랙',
        'Gray-White': '그레이-화이트',
        'Gray': '그레이',
        'Gray-Black': '그레이-블랙',
        'Yellow-White': '옐로우-화이트',
        'Yellow': '옐로우',
        'Yellow-Black': '옐로우-블랙',
        'Orange-White': '오렌지-화이트',
        'Orange': '오렌지',
        'Orange-Black': '오렌지-블랙',
        'Green-White': '그린-화이트',
        'Green': '그린',
        'Green-Black': '그린-블랙'
    }
    return map[name] || name
}
