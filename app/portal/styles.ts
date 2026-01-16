export const PORTAL_STYLES = {
    // Layout & Container
    PAGE_WRAPPER: "flex flex-col min-h-screen bg-gray-50 pb-20", // pb-20 for bottom nav
    CONTAINER: "w-full max-w-md mx-auto px-4 pt-6",

    // Text Styles
    HEADING_LG: "text-2xl font-bold text-gray-900 mb-6",
    HEADING_MD: "text-lg font-semibold text-gray-800 mb-4",
    TEXT_BODY: "text-sm text-gray-600",

    // Card Styles
    CARD: "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden",
    CARD_PADDING: "p-5",

    // Interactive Elements
    BUTTON_PRIMARY: "w-full py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors active:scale-95",
    BUTTON_SECONDARY: "w-full py-3 px-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors active:scale-95",

    // Navigation
    NAV_BAR: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 safe-area-bottom",
    NAV_ITEM: "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
    NAV_ITEM_ACTIVE: "text-primary",
    NAV_ITEM_INACTIVE: "text-gray-400 hover:text-gray-600",
    NAV_ICON_SIZE: 24,
    NAV_LABEL: "text-[10px] font-medium mt-1",
} as const;
