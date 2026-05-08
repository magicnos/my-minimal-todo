'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction, completeHabitAction } from '@/app/actions';

export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortBy, setSortBy] = useState('startTime');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const sortTasks = (tasks: any[]) => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return pMap[b.taskPriority] - pMap[a.taskPriority];
      }
      if (sortBy === 'deadline') {
        return new Date(a.taskDeadline).getTime() - new Date(b.taskDeadline).getTime();
      }
      return new Date(a.taskStartTime).getTime() - new Date(b.taskStartTime).getTime();
    });
  };

  const isHabitFinishedForNow = (task: any) => {
    if (task.taskType !== 'HABIT' || !task.lastCompletedAt) return false;
    const lastDone = new Date(task.lastCompletedAt);
    const startTime = new Date(task.taskStartTime);
    return lastDone >= startTime;
  };

  const renderTaskCard = (task: any) => {
    const isUpcoming = new Date(task.taskStartTime) > currentTime;
    const isDoneHabit = isHabitFinishedForNow(task);

    return (
      <div key={task.id} style={{
        ...taskCardStyle,
        opacity: isDoneHabit ? 0.2 : (isUpcoming ? 0.4 : 1),
        filter: (isUpcoming || isDoneHabit) ? 'grayscale(0.5)' : 'none',
      }}>
        <div style={taskContentStyle} onClick={() => { setEditingTask(task); setIsFormVisible(true); }}>
          <div style={taskHeaderStyle}>
            <span style={getPriorityBadgeStyle(task.taskPriority)}>{task.taskPriority}</span>
            {isDoneHabit && <span style={doneBadgeStyle}>✅ 完了済み</span>}
            {!isDoneHabit && isUpcoming && <span style={upcomingBadgeStyle}>⏳ 待機中</span>}
          </div>
          
          <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
          
          {/* メモの表示 */}
          {task.taskMemo && <p style={taskMemoStyle}>{task.taskMemo}</p>}
          
          {/* 開始時間と期限の表示 */}
          <div style={timeInfoStyle}>
            <div style={timeRowStyle}>
              <span style={timeLabelStyle}>開始:</span>
              <span>{new Date(task.taskStartTime).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={timeRowStyle}>
              <span style={timeLabelStyle}>期限:</span>
              <span>{new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {task.notifications?.length > 0 && (
            <div style={notificationBadgeListStyle}>
              {task.notifications.map((n: any, i: number) => (
                <span key={i} title={new Date(n.notificationTime).toLocaleString()} style={notificationBadgeStyle}>🔔</span>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => task.taskType === 'HABIT' ? completeHabitAction(task.id) : confirm('完了して削除しますか？') && deleteTaskAction(task.id)} 
          disabled={isDoneHabit}
          style={{...completeButtonStyle, cursor: isDoneHabit ? 'not-allowed' : 'pointer', opacity: isDoneHabit ? 0.3 : 1}}
        >
          {isDoneHabit ? '●' : '✓'}
        </button>
      </div>
    );
  };

  const sortedHabits = sortTasks(initialTasks.filter(t => t.taskType === 'HABIT'));
  const sortedSingles = sortTasks(initialTasks.filter(t => t.taskType === 'SINGLE'));

  return (
    <>
      <div style={toolbarStyle}>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={sortSelectStyle}>
          <option value="startTime">開始が早い順</option>
          <option value="deadline">期限が近い順</option>
          <option value="priority">優先度が高い順</option>
        </select>
      </div>

      <div style={columnsContainerStyle}>
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣タスク</h2>
          <div style={listStyle}>{sortedHabits.map(renderTaskCard)}</div>
        </section>

        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>📍 一回きり</h2>
          <div style={listStyle}>{sortedSingles.map(renderTaskCard)}</div>
        </section>
      </div>

      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>

      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

const toolbarStyle: React.CSSProperties = { marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' };
const sortSelectStyle: React.CSSProperties = { padding: '8px', borderRadius: '8px', backgroundColor: '#171717', color: '#fff', border: '1px solid #333', fontSize: '0.85rem' };
const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '320px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.9rem', opacity: 0.5, marginBottom: '16px', fontWeight: 'bold', borderLeft: '3px solid #ededed', paddingLeft: '8px' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const taskCardStyle: React.CSSProperties = { padding: '16px', borderRadius: '16px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' };
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: '600', marginBottom: '6px' };
const taskMemoStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.7, marginBottom: '12px', whiteSpace: 'pre-wrap', lineBreak: 'anywhere' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '4px' };
const timeRowStyle: React.CSSProperties = { display: 'flex', gap: '8px' };
const timeLabelStyle: React.CSSProperties = { opacity: 0.6, width: '32px' };
const doneBadgeStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#4dff4d', backgroundColor: 'rgba(77, 255, 77, 0.1)', padding: '2px 6px', borderRadius: '4px' };
const upcomingBadgeStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#aaa', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px' };
const notificationBadgeListStyle: React.CSSProperties = { marginTop: '10px', display: 'flex', gap: '4px' };
const notificationBadgeStyle: React.CSSProperties = { fontSize: '0.8rem' };
const getPriorityBadgeStyle = (p: string) => ({ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: p === 'HIGH' ? '#ff4d4d' : p === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000', fontWeight: 'bold' });
const completeButtonStyle: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '22px', border: '2px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1.2rem', marginLeft: '12px', flexShrink: 0 };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#ededed', color: '#0a0a0a', border: 'none', fontSize: '32px', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
