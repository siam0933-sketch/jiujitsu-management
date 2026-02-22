export function getPaymentStatus(member: any) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let targetDate: Date | null = null

    if (member.payment_end_date) {
        targetDate = new Date(member.payment_end_date)
    } else if (member.payment_due_day) {
        targetDate = new Date()
        targetDate.setDate(member.payment_due_day)
    }

    if (!targetDate) return { status: 'normal', label: '-', dateStr: '-', diffDays: Infinity }

    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const dateStr = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`

    if (diffDays < 0) return { status: 'unpaid', label: '미납', dateStr, diffDays }
    if (diffDays >= 0 && diffDays <= 5) return { status: 'due', label: '결제예정', dateStr, diffDays }
    return { status: 'normal', label: dateStr, dateStr, diffDays }
}
