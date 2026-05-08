'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction, completeHabitAction } from '@/app/actions';

export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortBy, setSortBy] = useState('deadline'); // deadline, priority, startTime

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  /**
   * タスクの並び替えロジック
   */
  const sortTasks = (tasks: any[]) => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const pMap: any = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return pMap[b.taskPriority] - pMap[a.taskPriority];
      }
      if (sortBy === 'startTime') {
        return new Date(a.taskStartTime).getTime() - new Date(b.taskStartTime).getTime();
      }
      return new Date(a.taskDeadline).getTime() - new Date(b.taskDeadline).getTime();
    });
  };

  /**
   * 習慣タスクが「現在のサイクルで完了済みか」を判定する
   * 指示：開始時間が来たら再度復活する（＝完了日が現在の開始時間より前なら復活）
   */
  const isHabitFinishedForNow = (task: any) => {
    if (task.taskType !== 'HABIT' || !task.lastCompletedAt) return false;
    const lastDone = new Date(task.lastCompletedAt);
    const startTime = new Date(task.taskStartTime);
    // 最後に完了したのが、現在の開始時間よりも後であれば「完了済み」とみなす
    return lastDone >= startTime;
  };

  const handleCompleteClick = async (task: any) => {
    if (task.taskType === 'HABIT') {
      await completeHabitAction(task.id);
    } else {
      if (confirm('完了して削除しますか？')) {
        await deleteTaskAction(task.id);
      }
    }
  };

  const renderTaskCard = (task: any) => {
    const isUpcoming = new Date(task.taskStartTime) > currentTime;
    const isDoneHabit = isHabitFinishedForNow(task);

    return (
      <div key={task.id} style={{
        ...taskCardStyle,
        opacity: isDoneHabit ? 0.2 : (isUpcoming ? 0.5 : 1),
        filter: (isUpcoming || isDoneHabit) ? 'grayscale(0.5)' : 'none',
      }}>
        <div style={taskContentStyle} onClick={() => { setEditingTask(task); setIsFormVisible(true); }}>
          <div style={taskHeaderStyle}>
            <span style={getPriorityBadgeStyle(task.taskPriority)}>{task.taskPriority}</span>
            {isDoneHabit && <span style={doneBadgeStyle}>✅ 完了済み</span>}
            {!isDoneHabit && isUpcoming && <span style={upcomingBadgeStyle}>⏳ 待機中</span>}
          </div>
          <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
          <div style={timeInfoStyle}>
            {new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 〆
          </div>
        </div>
        <button 
          onClick={() => handleCompleteClick(task)} 
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
          <option value="deadline">期限が近い順</option>
          <option value="priority">優先度が高い順</option>
          <option value="startTime">開始が早い順</option>
        </select>
      </div>

      <div style={columnsContainerStyle}>
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣</h2>
          <div style={listStyle}>{sortedHabits.map(renderTaskCard)}</div>
        </section>

        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>📍 一回</h2>
          <div style={listStyle}>{sortedSingles.map(renderTaskCard)}</div>
        </section>
      </div>

      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>

      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

const toolbarStyle: React.CSSProperties = { marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' };
const sortSelectStyle: React.CSSProperties = { padding: '8px', borderRadius: '8px', backgroundColor: '#171717', color: '#fff', border: '1px solid #333' };
const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '20px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '300px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.9rem', opacity: 0.5, marginBottom: '12px', fontWeight: 'bold' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' };
const taskCardStyle: React.CSSProperties = { padding: '12px 16px', borderRadius: '12px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' };
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '6px', marginBottom: '4px' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 'bold' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.5 };
const doneBadgeStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#4dff4d' };
const upcomingBadgeStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#aaa' };
const getPriorityBadgeStyle = (p: string) => ({ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: p === 'HIGH' ? '#ff4d4d' : p === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000' });
const completeButtonStyle: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '18px', border: '1px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1rem', marginLeft: '10px' };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '30px', backgroundColor: '#fff', color: '#000', fontSize: '24px', border: 'none', cursor: 'pointer', zIndex: 100 };
