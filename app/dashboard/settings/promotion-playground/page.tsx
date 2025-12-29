'use client'

import { useState } from 'react'

// --- Constants & Types ---
const ADULT_BELTS = [
    { name: 'White', color: 'bg-white border-gray-200' },
    { name: 'Blue', color: 'bg-blue-600 text-white' },
    { name: 'Purple', color: 'bg-purple-600 text-white' },
    { name: 'Brown', color: 'bg-yellow-800 text-white' },
    { name: 'Black', color: 'bg-gray-900 text-white' }
];

const KIDS_BELTS = [
    { name: 'White', color: 'bg-white border border-gray-200' },
    { name: 'Gray-White', color: 'border border-gray-300', style: { background: 'linear-gradient(180deg, #9ca3af 35%, #ffffff 35%, #ffffff 65%, #9ca3af 65%)' } },
    { name: 'Gray', color: 'bg-gray-400 text-white border border-gray-400' },
    { name: 'Gray-Black', color: 'border border-gray-400', style: { background: 'linear-gradient(180deg, #9ca3af 35%, #1f2937 35%, #1f2937 65%, #9ca3af 65%)' } },
    { name: 'Yellow-White', color: 'border border-yellow-400', style: { background: 'linear-gradient(180deg, #facc15 35%, #ffffff 35%, #ffffff 65%, #facc15 65%)' } },
    { name: 'Yellow', color: 'bg-yellow-400 text-yellow-900 border border-yellow-400' },
    { name: 'Yellow-Black', color: 'border border-yellow-400', style: { background: 'linear-gradient(180deg, #facc15 35%, #1f2937 35%, #1f2937 65%, #facc15 65%)' } },
    { name: 'Orange-White', color: 'border border-orange-500', style: { background: 'linear-gradient(180deg, #f97316 35%, #ffffff 35%, #ffffff 65%, #f97316 65%)' } },
    { name: 'Orange', color: 'bg-orange-500 text-white border border-orange-500' },
    { name: 'Orange-Black', color: 'border border-orange-500', style: { background: 'linear-gradient(180deg, #f97316 35%, #1f2937 35%, #1f2937 65%, #f97316 65%)' } },
    { name: 'Green-White', color: 'border border-green-600', style: { background: 'linear-gradient(180deg, #16a34a 35%, #ffffff 35%, #ffffff 65%, #16a34a 65%)' } },
    { name: 'Green', color: 'bg-green-600 text-white border border-green-600' },
    { name: 'Green-Black', color: 'border border-green-600', style: { background: 'linear-gradient(180deg, #16a34a 35%, #1f2937 35%, #1f2937 65%, #16a34a 65%)' } },
];

type StripeReq = {
    months: number;
    attendance: number;
}

type AdultBeltConfig = {
    name: string;
    stripes: StripeReq[]; // Always 4 for adult
}

type KidsBeltConfig = {
    name: string;
    totalStripes: number; // 4 ~ 11
    reqPerStripe: StripeReq; // Applied to all stripes in this belt for data simplicity in UI
}

export default function PromotionPlaygroundPage() {
    const [activeTab, setActiveTab] = useState<'adult' | 'kids'>('adult');
    const [openAccordions, setOpenAccordions] = useState<string[]>(['White']);

    // --- State: Adult (Mock) ---
    const [adultConfig, setAdultConfig] = useState<AdultBeltConfig[]>(
        ADULT_BELTS.map(b => ({
            name: b.name,
            stripes: Array(4).fill({ months: 3, attendance: 40 })
        }))
    );

    // --- State: Kids (Mock) ---
    const [kidsConfig, setKidsConfig] = useState<KidsBeltConfig[]>(
        KIDS_BELTS.map(b => ({
            name: b.name,
            totalStripes: 4, // Default
            reqPerStripe: { months: 1, attendance: 10 }
        }))
    );

    // --- Batch Update State for Kids ---
    const [batchStripes, setBatchStripes] = useState(4);
    const [batchMonths, setBatchMonths] = useState(1);
    const [batchAttendance, setBatchAttendance] = useState(10);

    // --- Handlers ---
    const toggleAccordion = (beltName: string) => {
        setOpenAccordions(prev =>
            prev.includes(beltName) ? prev.filter(n => n !== beltName) : [...prev, beltName]
        );
    };

    const handleAdultChange = (beltIdx: number, stripeIdx: number, field: keyof StripeReq, value: string) => {
        const numVal = Number(value);
        if (isNaN(numVal)) return;

        const newConfig = [...adultConfig];
        newConfig[beltIdx].stripes[stripeIdx] = {
            ...newConfig[beltIdx].stripes[stripeIdx],
            [field]: numVal
        };
        setAdultConfig(newConfig);
    };

    const handleKidsChange = (beltIdx: number, field: 'totalStripes' | 'months' | 'attendance', value: string) => {
        const numVal = Number(value);
        if (isNaN(numVal)) return;

        const newConfig = [...kidsConfig];
        if (field === 'totalStripes') {
            // Limit 4~11
            const clamped = Math.max(4, Math.min(11, numVal));
            newConfig[beltIdx].totalStripes = clamped;
        } else {
            newConfig[beltIdx].reqPerStripe = {
                ...newConfig[beltIdx].reqPerStripe,
                [field === 'months' ? 'months' : 'attendance']: numVal
            };
        }
        setKidsConfig(newConfig);
    };

    const applyBatchUpdate = () => {
        if (!confirm(`모든 유소년 벨트의 설정을 일괄 변경하시겠습니까?\n(단계: ${batchStripes}, 개월: ${batchMonths}, 출석: ${batchAttendance})`)) return;

        const newConfig = kidsConfig.map(b => ({
            ...b,
            totalStripes: batchStripes,
            reqPerStripe: {
                months: batchMonths,
                attendance: batchAttendance
            }
        }));
        setKidsConfig(newConfig);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">승급 기준 설정 (Playground)</h1>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">TEST MODE</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('adult')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'adult' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    16세 이상 (성인)
                </button>
                <button
                    onClick={() => setActiveTab('kids')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'kids' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    16세 미만 (유소년)
                </button>
            </div>

            {/* --- ADULT TAB --- */}
            {activeTab === 'adult' && (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mb-4 text-sm text-blue-800">
                        💡 성인 벨트는 <strong>IBJJF 기준</strong>에 따라 4그랄 체계를 따릅니다. 각 그랄 도달에 필요한 최소 기간과 출석 횟수를 입력하세요.
                    </div>

                    {adultConfig.map((belt, bIdx) => {
                        const isOpen = openAccordions.includes(belt.name);
                        const beltColorClass = ADULT_BELTS.find(b => b.name === belt.name)?.color || 'bg-gray-200';

                        return (
                            <div key={belt.name} className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleAccordion(belt.name)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded shadow-sm flex items-center justify-center font-bold text-xs ${beltColorClass}`}>
                                            {/* Belt Icon Placeholder */}
                                        </div>
                                        <span className="font-bold text-gray-900">{belt.name} Belt</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span>4단계 설정됨</span>
                                        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="p-4 border-t border-gray-200 bg-white">
                                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-2 text-xs font-medium text-gray-500 text-center bg-gray-50 py-2 rounded">
                                            <div>현재 단계 → 다음 단계</div>
                                            <div>최소 수련 기간 (개월)</div>
                                            <div>최소 출석 (회)</div>
                                        </div>
                                        <div className="space-y-2">
                                            {belt.stripes.map((req, sIdx) => (
                                                <div key={sIdx} className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center">
                                                    <div className="text-sm text-gray-700 text-center font-medium flex items-center justify-center gap-2">
                                                        <span>{sIdx} 그랄</span>
                                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                        <span>{sIdx + 1} 그랄</span>
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={req.months}
                                                            onChange={(e) => handleAdultChange(bIdx, sIdx, 'months', e.target.value)}
                                                            className="w-full text-center border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            value={req.attendance}
                                                            onChange={(e) => handleAdultChange(bIdx, sIdx, 'attendance', e.target.value)}
                                                            className="w-full text-center border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Belt Promotion Row (4 stripe -> Next Belt) */}
                                            <div className="mt-4 pt-3 border-t border-dashed border-gray-200 grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-blue-50/50 p-2 rounded">
                                                <div className="text-sm text-blue-800 text-center font-bold">
                                                    승급 심사 (Next Belt)
                                                </div>
                                                <div className="col-span-2 text-xs text-blue-600 text-center">
                                                    4그랄 달성 후 관장님 심사를 통해 승급합니다.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* --- KIDS TAB --- */}
            {activeTab === 'kids' && (
                <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-100 rounded-md text-sm text-green-800">
                        💡 유소년은 <strong>화이트 ~ 그린블랙</strong>까지 세분화된 벨트 체계를 가집니다. 각 벨트에서 다음 벨트로 가기 위해 거쳐야 하는 단계(그랄) 수를 자유롭게(4~11) 설정할 수 있습니다.
                    </div>

                    {/* Batch Update Header (Magic Header) */}
                    <div className="bg-gray-800 text-white rounded-lg p-4 shadow-lg">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            일괄 설정 (Bulk Update)
                        </h3>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-300 mb-1">기본 단계(그랄) 수</label>
                                <input
                                    type="number"
                                    value={batchStripes}
                                    onChange={e => setBatchStripes(Number(e.target.value))}
                                    className="w-full bg-gray-700 border-gray-600 text-white rounded text-sm text-center"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-300 mb-1">한 단계당 필요 개월</label>
                                <input
                                    type="number"
                                    value={batchMonths}
                                    onChange={e => setBatchMonths(Number(e.target.value))}
                                    className="w-full bg-gray-700 border-gray-600 text-white rounded text-sm text-center"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm text-gray-300 mb-1">한 단계당 필요 출석</label>
                                <input
                                    type="number"
                                    value={batchAttendance}
                                    onChange={e => setBatchAttendance(Number(e.target.value))}
                                    className="w-full bg-gray-700 border-gray-600 text-white rounded text-sm text-center"
                                />
                            </div>
                            <button
                                onClick={applyBatchUpdate}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold shadow-md transition-colors"
                            >
                                일괄적용
                            </button>
                        </div>
                    </div>

                    {/* Kids Belt Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left font-bold text-gray-700">벨트 (Belt)</th>
                                    <th className="py-3 px-4 text-center font-bold text-gray-700 w-32">총 단계(Stripes)</th>
                                    <th className="py-3 px-4 text-center font-bold text-gray-700">단계별 기준 (기간/출석)</th>
                                    <th className="py-3 px-4 text-right font-bold text-gray-700">총 소요 예상</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {kidsConfig.map((belt, idx) => {
                                    const beltInfo = KIDS_BELTS.find(b => b.name === belt.name);
                                    const beltColorClass = beltInfo?.color || 'bg-gray-200';
                                    const totalMonths = belt.totalStripes * belt.reqPerStripe.months;
                                    const totalAttendance = belt.totalStripes * belt.reqPerStripe.attendance;

                                    return (
                                        <tr key={belt.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-6 h-6 rounded shadow-sm ${beltInfo?.color || 'bg-gray-200'}`}
                                                        style={(beltInfo as any)?.style}
                                                    ></div>
                                                    <span className="font-medium text-gray-900">{belt.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <input
                                                    type="number"
                                                    min="4" max="11"
                                                    value={belt.totalStripes}
                                                    onChange={(e) => handleKidsChange(idx, 'totalStripes', e.target.value)}
                                                    className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={belt.reqPerStripe.months}
                                                            onChange={(e) => handleKidsChange(idx, 'months', e.target.value)}
                                                            className="w-16 pl-2 pr-6 text-right border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">월</span>
                                                    </div>
                                                    <span className="text-gray-300">/</span>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={belt.reqPerStripe.attendance}
                                                            onChange={(e) => handleKidsChange(idx, 'attendance', e.target.value)}
                                                            className="w-16 pl-2 pr-6 text-right border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-xs text-gray-400">회</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-400 text-center mt-1">* 모든 단계 동일 적용</p>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-500 text-xs">
                                                <div>약 {totalMonths}개월</div>
                                                <div>(총 {totalAttendance}회)</div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
