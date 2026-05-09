'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import SortableTaskCard from './SortableTaskCard';
import { updateTaskOrderAction } from '@/app/actions';

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // センサーの設定（マウス、タッチ、キーボード）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px動かしたらドラッグ開始（誤操作防止）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  /**
   * ドラッグが終了した時の処理
   */
  const handleDragEnd = async (event: DragEndEvent, list: any[]) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = list.findIndex((t) => t.id === active.id);
      const newIndex = list.findIndex((t) => t.id === over.id);

      const newList = arrayMove(list, oldIndex, newIndex);
      const allIds = newList.map(t => t.id);
      
      // データベースの並び順を更新
      await updateTaskOrderAction(allIds);
    }
  };

  const getTaskStatus = (task: any) => {
    if (task.taskType === 'SINGLE') return { isDone: false, target: 1, current: 0 };
    
    let target = task.habitTargetCount || 1;
    let effectiveCount = task.completedCount;
    const lastDone = task.lastCompletedAt ? new Date(task.lastCompletedAt) : null;

    if (task.taskType === 'DAILY') {
      const currentDay = currentTime.getDay();
      target = task.habitDailySchedule?.[currentDay] || 0;
      if (lastDone && lastDone.toDateString() !== currentTime.toDateString()) effectiveCount = 0;
    } else if (task.taskType === 'MULTI_DAY') {
      const periodMs = 7 * 86400000;
      const createdAt = new Date(task.createdAt);
      const cycleStart = createdAt.getTime() + Math.floor((currentTime.getTime() - createdAt.getTime()) / periodMs) * periodMs;
      if (lastDone && lastDone.getTime() < cycleStart) effectiveCount = 0;
    }

    if (target === 0) return { isDone: true, target: 0, current: 0 };
    return { isDone: effectiveCount >= target, target, current: effectiveCount };
  };

  const sortedTasks = [...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const habits = sortedTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = sortedTasks.filter(t => t.taskType === 'SINGLE');

  return (
    <>
      <div style={columnsContainerStyle}>
        {/* 習慣セクション */}
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣</h2>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, habits)}
          >
            <SortableContext items={habits.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div style={listStyle}>
                {habits.map((task) => (
                  <SortableTaskCard 
                    key={task.id} 
                    task={task} 
                    getTaskStatus={getTaskStatus} 
                    onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* 一回きりセクション */}
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>📍 一回きり</h2>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, singles)}
          >
            <SortableContext items={singles.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div style={listStyle}>
                {singles.map((task) => (
                  <SortableTaskCard 
                    key={task.id} 
                    task={task} 
                    getTaskStatus={getTaskStatus} 
                    onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </div>

      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>
      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '320px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.5, marginBottom: '16px', fontWeight: 'bold' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#fff', color: '#000', fontSize: '28px', border: 'none', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
