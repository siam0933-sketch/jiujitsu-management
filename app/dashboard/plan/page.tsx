import { getClassTemplates, getCalendarClasses, getColorSettings } from './actions'
import ClassPlanClient from './components/ClassPlanClient'

export const metadata = {
    title: '수업 계획 | My jiu-jitsu',
}

export default async function ClassPlanPage() {
    // For a production app with huge data, you'd use searchParams to pass year/month 
    // and only fetch that month's data. For this dashboard, we'll fetch a broad range 
    // for seamless fast client-side navigation.
    const today = new Date()
    const startDate = `${today.getFullYear() - 1}-01-01`
    const endDate = `${today.getFullYear() + 2}-12-31`
    
    const [templates, calendarClasses, colorSettings] = await Promise.all([
        getClassTemplates(),
        getCalendarClasses(startDate, endDate),
        getColorSettings()
    ])

    return (
        <ClassPlanClient 
            initialTemplates={templates} 
            initialCalendarClasses={calendarClasses} 
            initialColorSettings={colorSettings}
        />
    )
}
