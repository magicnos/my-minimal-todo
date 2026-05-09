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
  // サーバーから届いた初期のタスクリストを、画面で管理する状態にします
  const [displayTasks, setDisplayTasks] = useState(initialTasks);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // サーバーのデータが更新されたら、画面上のリストも合わせる
  useEffect(() => {
    setDisplayTasks(initialTasks);
  }, [initialTasks]);

  // 現在時刻の更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * 【ラグ改善：楽観的更新】
   * ドラッグが終わったら、まず画面上の表示をパッと入れ替える
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 現在のリストから、移動させたタスクを見つける
    const oldIndex = displayTasks.findIndex((t) => t.id === active.id);
    const newIndex = displayTasks.findIndex((t) => t.id === over.id);

    // 1. まずは画面上のリストをパッと入れ替える（これでラグが消える）
    const newList = arrayMove(displayTasks, oldIndex, newIndex);
    setDisplayTasks(newList);

    // 2. その後で、こっそりサーバーに保存しにいく
    const allIds = newList.map(t => t.id);
    await updateTaskOrderAction(allIds);
  };

  /**
   * タスクが「完了」しているか判定
   */
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

  // 表示用に、ソート順で並び替えてから分ける
  const sortedTasks = [...displayTasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const habits = sortedTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = sortedTasks.filter(t => t.taskType === 'SINGLE');

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div style={columnsContainerStyle}>
          
          {/* 習慣セクション */}
          <section style={columnStyle}>
            <h2 style={sectionTitleStyle}>🔄 習慣</h2>
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
          </section>

          {/* 一回きりセクション */}
          <section style={columnStyle}>
            <h2 style={sectionTitleStyle}>📍 一回きり</h2>
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
          </section>

        </div>
      </DndContext>

      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>
      
      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

// --- デザイン ---
const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '320px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.5, marginBottom: '16px', fontWeight: 'bold' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#fff', color: '#000', fontSize: '28px', border: 'none', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
