
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function SignupPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (password !== confirmPassword) {
            e.preventDefault()
            setError('비밀번호가 일치하지 않습니다.')
            return
        }
        if (password.length < 6) {
            e.preventDefault()
            setError('비밀번호는 6자 이상이어야 합니다.')
            return
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        도장 등록 및 회원가입
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        관장님 전용 가입 페이지입니다. (* 표시는 필수입력)
                    </p>
                </div>

                <form className="mt-8 space-y-6" action="/auth/sign-up" method="POST" onSubmit={handleSubmit}>
                    <input type="hidden" name="role" value="gym_master" />

                    <div className="rounded-md shadow-sm space-y-4 bg-white p-6">
                        {/* 개인 정보 섹션 */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">관리자 정보</h3>
                            <div className="grid grid-cols-1 gap-y-4">
                                <div>
                                    <label htmlFor="email" className="sr-only">Email address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="이메일 주소 *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">Password</label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="비밀번호 (6자 이상) *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="비밀번호 확인 *"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div>
                                    <label htmlFor="full_name" className="sr-only">Name</label>
                                    <input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="관장님 성함 *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="sr-only">Phone</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="휴대폰 번호 (010-0000-0000) *"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4"></div>

                        {/* 도장 정보 섹션 */}
                        <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">도장 정보</h3>
                            <div className="grid grid-cols-1 gap-y-4">
                                <div>
                                    <label htmlFor="gym_name" className="sr-only">Gym Name</label>
                                    <input
                                        id="gym_name"
                                        name="gym_name"
                                        type="text"
                                        required
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="도장 이름 (예: 강남 주짓수) *"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="business_registration_number" className="sr-only">Business Number</label>
                                    <input
                                        id="business_registration_number"
                                        name="business_registration_number"
                                        type="text"
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="사업자 등록번호 (선택)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gym_phone" className="sr-only">Gym Phone</label>
                                    <input
                                        id="gym_phone"
                                        name="gym_phone"
                                        type="tel"
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="도장 전화번호 (선택)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="gym_address" className="sr-only">Gym Address</label>
                                    <input
                                        id="gym_address"
                                        name="gym_address"
                                        type="text"
                                        className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                                        placeholder="도장 주소 (선택)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            가입하고 도장 등록하기
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            이미 계정이 있으신가요? 로그인하기
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
