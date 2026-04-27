'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    PointerSensor,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'

import { ClassTemplate, CalendarClass, ColorSetting, addClassToCalendar, removeClassFromCalendar, deleteClassTemplate, updateCalendarClassPositions } from '../actions'
import CreateTemplateModal from './CreateTemplateModal'
import ClassSelectorModal from './ClassSelectorModal'
import ClassColorSettingsModal from './ClassColorSettingsModal'

function SortableClassItem({ item, template, onUnassign }: { item: CalendarClass, template: ClassTemplate | undefined, onUnassign: (e: React.MouseEvent, id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, data: { type: 'Class', item } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    const title = template?.title || 'Unknown'
    const color = template?.color_tag || 'bg-blue-500'

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            className={`text-[10px] sm:text-xs px-1.5 py-1 rounded text-white flex justify-between items-center group relative overflow-hidden ${color} shadow-sm touch-none mb-1`}
            title={title}
        >
            <span className="truncate font-medium z-10">{title}</span>
            <button 
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                onClick={(e) => onUnassign(e, item.id)}
                className="opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded p-[1px] transition-opacity z-10 ml-1 shrink-0"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    )
}

function DayColumn({ dateStr, day, isToday, items, templates, onAddClick, onUnassign }: any) {
    const { setNodeRef, isOver } = useDroppable({
        id: dateStr,
        data: { type: 'Day', dateStr }
    })

    return (
        <div 
            ref={setNodeRef}
            onClick={() => onAddClick(day)}
            className={`
                min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all hover:shadow-md
                ${isOver ? 'bg-gray-100 dark:bg-zinc-800 border-dashed border-2 border-blue-400' : ''}
                ${!isOver && isToday ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50' : ''}
                ${!isOver && !isToday ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600' : ''}
            `}
        >
            <div className="text-right pointer-events-none">
                <span className={`text-xs sm:text-sm font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-zinc-300'}`}>
                    {day}
                </span>
            </div>
            
            <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="flex-1 overflow-y-auto no-scrollbar pb-1">
                    {items.map((c: any) => (
                        <SortableClassItem key={c.id} item={c} template={c.template || templates.find((t: any) => t.id === c.template_id)} onUnassign={onUnassign} />
                    ))}
                </div>
            </SortableContext>
        </div>
    )
}


type Props = {
    initialTemplates: ClassTemplate[]
    initialCalendarClasses: CalendarClass[]
    initialColorSettings: ColorSetting[]
}

export default function ClassPlanClient({ initialTemplates, initialCalendarClasses, initialColorSettings }: Props) {
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })
    
    // Sort array initially and keep it sorted
    const sortedInitial = [...initialCalendarClasses].sort((a, b) => a.sort_order - b.sort_order)
    const [calendarClasses, setCalendarClasses] = useState<CalendarClass[]>(sortedInitial)
    const [templates, setTemplates] = useState<ClassTemplate[]>(initialTemplates)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<ClassTemplate | null>(null)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
    const [selectedDateForPopup, setSelectedDateForPopup] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    )

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        setSelectedDateForPopup(dateStr)
    }

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? (달력에 배정된 것도 함께 삭제될 수 있습니다)')) return
        const res = await deleteClassTemplate(id)
        if (res.success) {
            setTemplates(t => t.filter(x => x.id !== id))
            setCalendarClasses(c => c.filter(x => x.template_id !== id))
        }
    }

    const unassignClass = async (e: React.MouseEvent, classId: string) => {
        e.stopPropagation()
        if (!confirm('달력에서 제거하시겠습니까?')) return
        setCalendarClasses(prev => prev.filter(c => c.id !== classId))
        const res = await removeClassFromCalendar(classId)
        if (res?.error) {
            alert(res.error)
            window.location.reload()
        }
    }

    const handleSelectTemplateForDate = async (templateId: string) => {
        if (!selectedDateForPopup) return
        const res = await addClassToCalendar(templateId, selectedDateForPopup)
        if (res.error) {
            alert(res.error)
            return
        }
        window.location.reload()
    }

    const filteredTemplates = useMemo(() => {
        if (!searchTerm.trim()) return templates
        const lower = searchTerm.toLowerCase()
        return templates.filter(t => 
            t.title.toLowerCase().includes(lower) || 
            (t.subtitle && t.subtitle.toLowerCase().includes(lower))
        )
    }, [templates, searchTerm])

    // --- DND Logic ---
    const activeItem = activeId ? calendarClasses.find(c => c.id === activeId) : null
    const activeTemplate = activeItem ? (activeItem.template || templates.find(t => t.id === activeItem.template_id)) : null

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const overId = over.id as string
        const activeItemData = calendarClasses.find(c => c.id === active.id)
        if (!activeItemData) return

        const isOverDay = over.data.current?.type === 'Day'
        const isOverClass = over.data.current?.type === 'Class'

        let targetDate = ''
        if (isOverDay) {
            targetDate = over.data.current?.dateStr
        } else if (isOverClass) {
            targetDate = over.data.current?.item.class_date
        }

        if (targetDate && activeItemData.class_date !== targetDate) {
            // Move item to new date optimally
            setCalendarClasses(prev => {
                const next = [...prev]
                const activeIndex = next.findIndex(c => c.id === active.id)
                next[activeIndex] = { ...next[activeIndex], class_date: targetDate }
                return next
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        if (!over) return

        const activeItemData = calendarClasses.find(c => c.id === active.id)
        console.log('active:', activeItemData?.class_date)
        if (!activeItemData) return

        let updatedClasses = [...calendarClasses]
        const targetDate = activeItemData.class_date

        if (active.id !== over.id) {
            const overItemData = over.data.current?.item
            
            // Reorder inside the same date container
            if (overItemData && overItemData.class_date === targetDate) {
                const dayClasses = updatedClasses.filter(c => c.class_date === targetDate)
                const activeIndex = dayClasses.findIndex(c => c.id === active.id)
                const overIndex = dayClasses.findIndex(c => c.id === over.id)

                if (activeIndex !== overIndex) {
                    const newDayClasses = arrayMove(dayClasses, activeIndex, overIndex)
                    // Apply back to main array
                    updatedClasses = updatedClasses.map(c => {
                        if (c.class_date === targetDate) {
                            return newDayClasses.shift() || c
                        }
                        return c
                    })
                }
            }
        }

        // Apply new sort_order based on array indices
        const finalClasses = updatedClasses.map((cl, idx) => ({ ...cl, sort_order: idx }))
        setCalendarClasses(finalClasses)

        // Find which items actually changed date or order
        // To be safe and simple, we'll just send the subset of classes that belong to the active sorting operations
        // Or if it's small enough, just send all class IDs from the affected dates.
        const affectedDates = new Set<string>()
        affectedDates.add(targetDate)
        
        const payloadToUpdate = finalClasses.filter(c => affectedDates.has(c.class_date)).map(c => ({
            id: c.id,
            class_date: c.class_date,
            sort_order: c.sort_order
        }))

        if (payloadToUpdate.length > 0) {
            const res = await updateCalendarClassPositions(payloadToUpdate)
            if (res.error) console.error(res.error)
        }
    }

    return (
        <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    수업 계획 
                    <span className="text-sm font-medium px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg">Calendar</span>
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-2 text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                        title="설정"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button
                        onClick={() => {
                            setEditingTemplate(null)
                            setIsCreateModalOpen(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm border border-blue-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        수업 생성
                    </button>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-4 sm:p-6 pb-2">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300 bg-gray-50 dark:bg-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                        {year}년 {month + 1}월
                    </h3>
                    <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-300 bg-gray-50 dark:bg-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                            <div key={d} className="text-center font-bold text-xs sm:text-sm text-gray-500 py-2">
                                {d}
                            </div>
                        ))}
                        
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] p-2 rounded-xl bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/50 opacity-50" />
                        ))}
                        
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const dayClasses = calendarClasses.filter(c => c.class_date === dateStr)
                            
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
                            
                            return (
                                <DayColumn 
                                    key={day}
                                    dateStr={dateStr}
                                    day={day}
                                    isToday={isToday}
                                    items={dayClasses}
                                    templates={templates}
                                    onAddClick={handleDateClick}
                                    onUnassign={unassignClass}
                                />
                            )
                        })}
                    </div>

                    <DragOverlay dropAnimation={defaultDropAnimationSideEffects({ sideEffects: ['styles'] })}>
                        {activeId && activeItem ? (
                            <div className={`text-[10px] sm:text-xs px-1.5 py-1 rounded text-white flex justify-between items-center opacity-90 shadow-xl ${activeTemplate?.color_tag || 'bg-blue-500'}`}>
                                <span className="truncate font-medium">{activeTemplate?.title || 'Unknown'}</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Template Cards Section */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                        수업 목록
                        <span className="text-sm font-medium text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{filteredTemplates.length}</span>
                    </h3>
                    
                    <div className="relative w-full sm:w-64">
                        <input
                            type="search"
                            placeholder="수업 검색..."
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                
                {filteredTemplates.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="font-medium text-gray-800 dark:text-zinc-200">등록/검색된 수업이 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-shadow relative group">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={() => {
                                            setEditingTemplate(template)
                                            setIsCreateModalOpen(true)
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        title="수정"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="삭제"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                
                                <div className="flex items-start gap-3 mb-3 pr-16">
                                    <div className={`shrink-0 w-5 h-5 mt-0.5 rounded-full ${template.color_tag} shadow-sm ring-2 ring-white dark:ring-zinc-900`} />
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-zinc-100 leading-tight pr-6">{template.title}</h4>
                                        {template.color_name && (
                                            <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                                {template.color_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {template.subtitle && (
                                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">{template.subtitle}</p>
                                )}
                                
                                {template.details && (
                                    <div className="mt-3 text-xs text-gray-500 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg leading-relaxed line-clamp-3">
                                        {template.details}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateTemplateModal 
                    colorSettings={initialColorSettings}
                    editingTemplate={editingTemplate}
                    onClose={() => {
                        setIsCreateModalOpen(false)
                        setEditingTemplate(null)
                        window.location.reload()
                    }} 
                />
            )}
            
            {isSettingsModalOpen && (
                <ClassColorSettingsModal
                    initialSettings={initialColorSettings}
                    onClose={() => {
                        setIsSettingsModalOpen(false)
                        window.location.reload()
                    }}
                />
            )}

            {selectedDateForPopup && (
                <ClassSelectorModal 
                    selectedDate={selectedDateForPopup}
                    templates={templates}
                    onClose={() => setSelectedDateForPopup(null)}
                    onSelect={handleSelectTemplateForDate}
                />
            )}
        </div>
    )
}
