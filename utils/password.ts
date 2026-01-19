export function generateInitialPassword(): string {
    const digits = '0123456789';
    const alphas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let password = '';

    // 4 Random Digits
    for (let i = 0; i < 4; i++) {
        password += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    // 2 Random Alphabets
    for (let i = 0; i < 2; i++) {
        password += alphas.charAt(Math.floor(Math.random() * alphas.length));
    }

    // Shuffle the password to mix digits and alphabets? 
    // The requirement says "4자리 숫자와 2자리 알파벳". 
    // Usually implies a mix or specific order. random mix is better for security.
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 6 || password.length > 20) {
        return { isValid: false, message: '비밀번호는 6자리에서 20자리 사이여야 합니다.' };
    }
    return { isValid: true };
}
