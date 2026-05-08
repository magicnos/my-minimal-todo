'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction, completeTaskAction } from '@/app/actions';

export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const getTaskStatus = (task: any) => {
    if (task.taskType === 'SINGLE') return { isDone: false, target: 1, current: 0 };

    let target = task.habitTargetCount || 1;
    let effectiveCount = task.completedCount;

    const lastDone = task.lastCompletedAt ? new Date(task.lastCompletedAt) : null;
    
    if (task.taskType === 'DAILY') {
      const currentDay = currentTime.getDay();
      target = task.habitDailySchedule?.[currentDay] || 0;
      if (lastDone && lastDone.toDateString() !== currentTime.toDateString()) {
        effectiveCount = 0;
      }
    } else {
      const createdAt = new Date(task.createdAt);
      const periodMs = (task.habitPeriodDays || 7) * 86400000;
      const currentCycleStartMs = createdAt.getTime() + Math.floor((currentTime.getTime() - createdAt.getTime()) / periodMs) * periodMs;
      if (lastDone && lastDone.getTime() < currentCycleStartMs) {
        effectiveCount = 0;
      }
    }

    if (target === 0) return { isDone: true, target: 0, current: 0 };
    return { isDone: effectiveCount >= target, target, current: effectiveCount };
  };

  const renderTaskCard = (task: any) => {
    const { isDone, target, current } = getTaskStatus(task);

    return (
      <div key={task.id} style={{
        ...taskCardStyle,
        opacity: isDone ? 0.2 : 1,
        filter: isDone ? 'grayscale(0.5)' : 'none',
      }}>
        <div style={taskContentStyle} onClick={() => { setEditingTask(task); setIsFormVisible(true); }}>
          <div style={taskHeaderStyle}>
            <span style={getPriorityBadgeStyle(task.taskPriority)}>{task.taskPriority}</span>
            {isDone && target > 0 && <span style={doneBadgeStyle}>✅ 完了</span>}
            {target === 0 && <span style={upcomingBadgeStyle}>☕ お休み</span>}
          </div>
          
          <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
          {task.taskMemo && <p style={taskMemoStyle}>{task.taskMemo}</p>}
          
          <div style={timeInfoStyle}>
            {task.taskType === 'SINGLE' ? (
              <div style={timeRowStyle}>
                <span style={timeLabelStyle}>〆:</span>
                <span>{new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ) : (
              <div style={timeRowStyle}>
                <span style={timeLabelStyle}>🔄</span>
                <span>{task.taskType === 'DAILY' ? '毎日' : `${task.habitPeriodDays}日ごと`}</span>
              </div>
            )}
          </div>

          {task.taskType !== 'SINGLE' && target > 0 && (
            <div style={progressStyle}>進捗: {current} / {target}</div>
          )}
        </div>
        
        <button 
          onClick={() => task.taskType === 'SINGLE' ? (confirm('完了として削除しますか？') && deleteTaskAction(task.id)) : completeTaskAction(task.id, current)} 
          disabled={isDone}
          style={{...completeButtonStyle, cursor: isDone ? 'not-allowed' : 'pointer', opacity: isDone ? 0.3 : 1}}
        >
          {isDone ? '●' : '✓'}
        </button>
      </div>
    );
  };

  const habits = initialTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = initialTasks.filter(t => t.taskType === 'SINGLE');

  return (
    <>
      <div style={columnsContainerStyle}>
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣</h2>
          <div style={listStyle}>{habits.map(renderTaskCard)}</div>
        </section>

        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>📍 一回きり</h2>
          <div style={listStyle}>{singles.map(renderTaskCard)}</div>
        </section>
      </div>

      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>

      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

// --- スタイル (一部抜粋) ---
const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '320px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.9rem', opacity: 0.5, marginBottom: '16px', fontWeight: 'bold', borderLeft: '3px solid #ededed', paddingLeft: '8px' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' };
const taskCardStyle: React.CSSProperties = { padding: '16px', borderRadius: '16px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' };
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: '600', marginBottom: '6px' };
const taskMemoStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.7, marginBottom: '12px', whiteSpace: 'pre-wrap' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '4px' };
const timeRowStyle: React.CSSProperties = { display: 'flex', gap: '8px' };
const timeLabelStyle: React.CSSProperties = { opacity: 0.6 };
const progressStyle: React.CSSProperties = { marginTop: '8px', fontSize: '0.75rem', color: '#4dff4d', fontWeight: 'bold' };
const doneBadgeStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#4dff4d', backgroundColor: 'rgba(77, 255, 77, 0.1)', padding: '2px 6px', borderRadius: '4px' };
const upcomingBadgeStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#aaa', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px' };
const getPriorityBadgeStyle = (p: string) => ({ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: p === 'HIGH' ? '#ff4d4d' : p === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000', fontWeight: 'bold' });
const completeButtonStyle: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '22px', border: '2px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1.2rem', marginLeft: '12px', flexShrink: 0 };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#ededed', color: '#0a0a0a', border: 'none', fontSize: '32px', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
