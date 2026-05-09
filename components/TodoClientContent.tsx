'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction, completeTaskAction, updateTaskOrderAction } from '@/app/actions';

export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleMoveTask = async (index: number, direction: 'up' | 'down', list: any[]) => {
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    const allIds = newList.map(t => t.id);
    await updateTaskOrderAction(allIds);
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

  const renderTaskCard = (task: any, index: number, list: any[]) => {
    const { isDone, target, current } = getTaskStatus(task);

    return (
      <div key={task.id} style={{ ...taskCardStyle, opacity: isDone ? 0.2 : 1 }}>
        <div style={orderButtonsStyle}>
          <button onClick={() => handleMoveTask(index, 'up', list)} style={orderButtonStyle} disabled={index === 0}>▲</button>
          <button onClick={() => handleMoveTask(index, 'down', list)} style={orderButtonStyle} disabled={index === list.length - 1}>▼</button>
        </div>

        <div style={taskContentStyle} onClick={() => { setEditingTask(task); setIsFormVisible(true); }}>
          <div style={taskHeaderStyle}>
            <span style={getPriorityBadgeStyle(task.taskPriority)}>{task.taskPriority}</span>
            {isDone && target > 0 && <span style={doneBadgeStyle}>✅</span>}
          </div>
          <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
          <div style={timeInfoStyle}>
            {task.taskType === 'SINGLE' ? `〆: ${new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` 
            : task.taskType === 'MULTI_DAY' ? `${['日','月','火','水','木','金','土'][task.habitStartDay]} ${task.habitStartTime} 〜 ${['日','月','火','水','木','金','土'][task.habitEndDay]} ${task.habitEndTime}`
            : '毎日'}
          </div>
          {task.taskType !== 'SINGLE' && target > 0 && <div style={progressStyle}>{current} / {target}</div>}
        </div>
        
        <button onClick={() => task.taskType === 'SINGLE' ? (confirm('削除？') && deleteTaskAction(task.id)) : completeTaskAction(task.id, current)} 
          disabled={isDone} style={completeButtonStyle}>{isDone ? '●' : '✓'}</button>
      </div>
    );
  };

  const sortedTasks = [...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const habits = sortedTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = sortedTasks.filter(t => t.taskType === 'SINGLE');

  return (
    <>
      <div style={columnsContainerStyle}>
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣</h2>
          <div style={listStyle}>{habits.map((t, i) => renderTaskCard(t, i, habits))}</div>
        </section>
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>📍 一回きり</h2>
          <div style={listStyle}>{singles.map((t, i) => renderTaskCard(t, i, singles))}</div>
        </section>
      </div>
      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>
      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '20px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '320px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.5, marginBottom: '12px', fontWeight: 'bold' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '100px' };
const taskCardStyle: React.CSSProperties = { padding: '12px', borderRadius: '14px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px' };
const orderButtonsStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px' };
const orderButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.7rem' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' };
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 'bold' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.5 };
const progressStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#4dff4d', marginTop: '4px', fontWeight: 'bold' };
const doneBadgeStyle: React.CSSProperties = { fontSize: '0.8rem' };
const getPriorityBadgeStyle = (p: string) => ({ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: p === 'HIGH' ? '#ff4d4d' : p === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000' });
const completeButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '20px', border: '1px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1.1rem' };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '30px', backgroundColor: '#fff', color: '#000', fontSize: '24px', border: 'none', cursor: 'pointer', zIndex: 100 };
