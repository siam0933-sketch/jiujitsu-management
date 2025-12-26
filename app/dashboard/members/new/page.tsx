'use client'

import { registerMember } from '../actions'
import { useActionState } from 'react'

export default function NewMemberPage() {
    const [state, formAction] = useActionState(registerMember, null)

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        신규 회원 등록
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        앱에 가입하지 않은 회원도 여기서 직접 등록할 수 있습니다.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <a
                        href="/dashboard/members/upload"
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <svg className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                        </svg>
                        엑셀로 일괄 등록하기
                    </a>
                </div>
            </div>

            <form action={formAction} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    {/* Error Display */}
                    {state?.error && (
                        <div className="mb-6 rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">등록 오류</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{state.error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                        {/* 이름 */}
                        <div className="sm:col-span-3">
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                이름 *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        {/* 연락처 */}
                        <div className="sm:col-span-3">
                            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                                연락처 *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    required
                                    placeholder="010-0000-0000"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        {/* 성별 */}
                        <div className="sm:col-span-3">
                            <label htmlFor="gender" className="block text-sm font-medium leading-6 text-gray-900">
                                성별
                            </label>
                            <div className="mt-2">
                                <select
                                    id="gender"
                                    name="gender"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:max-w-xs sm:text-sm sm:leading-6 px-3"
                                >
                                    <option value="male">남성</option>
                                    <option value="female">여성</option>
                                </select>
                            </div>
                        </div>

                        {/* 생년월일 & 나이 */}
                        <div className="sm:col-span-3">
                            <label htmlFor="birth_date" className="block text-sm font-medium leading-6 text-gray-900">
                                생년월일 (나이는 자동 계산됨)
                            </label>
                            <div className="mt-2 flex gap-4">
                                <input
                                    type="date"
                                    name="birth_date"
                                    id="birth_date"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                    onChange={(e) => {
                                        const birthDate = new Date(e.target.value);
                                        const today = new Date();
                                        if (!isNaN(birthDate.getTime())) {
                                            const age = today.getFullYear() - birthDate.getFullYear() + 1; // Korean Age
                                            const ageSpan = document.getElementById('calc-age');
                                            if (ageSpan) ageSpan.innerText = `${age}세 (한국나이)`;
                                        }
                                    }}
                                />
                                <span id="calc-age" className="flex items-center text-sm font-medium text-blue-600 w-32">
                                    -세
                                </span>
                            </div>
                        </div>

                        {/* 주소 */}
                        <div className="col-span-full">
                            <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                                주소
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="address"
                                    id="address"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        {/* 학교/학년 */}
                        <div className="sm:col-span-3">
                            <label htmlFor="school" className="block text-sm font-medium leading-6 text-gray-900">
                                학교
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="school"
                                    id="school"
                                    placeholder="예: 서울초등학교"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="grade" className="block text-sm font-medium leading-6 text-gray-900">
                                학년
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="grade"
                                    id="grade"
                                    placeholder="예: 3학년"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        {/* 보호자 연락처 (선택) */}
                        <div className="sm:col-span-3">
                            <label htmlFor="guardian_phone" className="block text-sm font-medium leading-6 text-gray-900">
                                보호자 연락처 (선택)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="tel"
                                    name="guardian_phone"
                                    id="guardian_phone"
                                    placeholder="010-0000-0000"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        {/* 등록일 */}
                        <div className="sm:col-span-3">
                            <label htmlFor="joined_at" className="block text-sm font-medium leading-6 text-gray-900">
                                입관일 (등록 날짜)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="joined_at"
                                    id="joined_at"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="col-span-full pt-4 border-t border-gray-200">
                            <h3 className="text-base font-semibold leading-7 text-gray-900">회원 접속용 정보</h3>
                            <p className="mt-1 text-sm leading-6 text-gray-600">회원이 나중에 '내 정보'에 접속할 때 사용할 비밀번호입니다.</p>
                        </div>

                        {/* 고유번호 (PIN) */}
                        <div className="sm:col-span-3">
                            <label htmlFor="access_code" className="block text-sm font-medium leading-6 text-gray-900">
                                고유번호 (4자리) *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="access_code"
                                    id="access_code"
                                    required
                                    maxLength={4}
                                    placeholder="예: 1234"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3 tracking-widest"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                    <a href="/dashboard/members" className="text-sm font-semibold leading-6 text-gray-900">
                        취소
                    </a>
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        등록하기
                    </button>
                </div>
            </form>
        </div>
    )
}
