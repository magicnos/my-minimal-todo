'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction } from '@/app/actions';

/**
 * メイン画面の動的な表示・操作を担当するコンポーネント
 */
export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 現在時刻を1分ごとに更新して、開始時間の判定をリアルタイムに近づけます
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleEditButtonClick = (task: any) => {
    setEditingTask(task);
    setIsFormVisible(true);
  };

  const handleCompleteButtonClick = async (taskId: number) => {
    if (confirm('このタスクを完了して削除しますか？')) {
      await deleteTaskAction(taskId);
    }
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    setEditingTask(null);
  };

  // タスクを「一回きり」と「習慣」に分けます
  const singleTasks = initialTasks.filter(t => t.taskType === 'SINGLE');
  const habitTasks = initialTasks.filter(t => t.taskType === 'HABIT');

  /**
   * 個別のタスクカードを描画する関数
   */
  const renderTaskCard = (task: any) => {
    // まだ開始時間に達していないか判定
    const isUpcoming = new Date(task.taskStartTime) > currentTime;

    return (
      <div key={task.id} style={{
        ...taskCardStyle,
        opacity: isUpcoming ? 0.4 : 1, // 未開始なら薄くする
        filter: isUpcoming ? 'grayscale(0.5)' : 'none', // 少し色を落とす
      }}>
        <div style={taskContentStyle} onClick={() => handleEditButtonClick(task)}>
          <div style={taskHeaderStyle}>
            <span style={getPriorityBadgeStyle(task.taskPriority)}>
              {task.taskPriority === 'HIGH' ? '高' : task.taskPriority === 'MEDIUM' ? '中' : '低'}
            </span>
            {isUpcoming && <span style={upcomingLabelStyle}>⏳ 開始前</span>}
          </div>
          
          <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
          {task.taskMemo && <p style={taskMemoStyle}>{task.taskMemo}</p>}
          
          <div style={timeInfoStyle}>
            <span>始: {new Date(task.taskStartTime).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span style={{ margin: '0 8px' }}>→</span>
            <span>終: {new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {task.notifications?.length > 0 && (
            <div style={notificationBadgeListStyle}>
              {task.notifications.map((n: any, i: number) => (
                <span key={i} style={notificationBadgeStyle}>🔔</span>
              ))}
            </div>
          )}
        </div>
        
        <button onClick={() => handleCompleteButtonClick(task.id)} style={completeButtonStyle}>✓</button>
      </div>
    );
  };

  return (
    <>
      {/* 習慣タスクのセクション */}
      {habitTasks.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣タスク</h2>
          <div style={taskListContainerStyle}>
            {habitTasks.map(renderTaskCard)}
          </div>
        </section>
      )}

      {/* 一回きりタスクのセクション */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>📍 一回きりのタスク</h2>
        <div style={taskListContainerStyle}>
          {singleTasks.length === 0 ? (
            <p style={emptyMessageStyle}>タスクがありません。</p>
          ) : (
            singleTasks.map(renderTaskCard)
          )}
        </div>
      </section>

      <button onClick={() => setIsFormVisible(true)} style={floatingAddButtonStyle}>+</button>

      {isFormVisible && (
        <TaskCreateForm onComplete={handleFormClose} editTaskData={editingTask} />
      )}
    </>
  );
}

// --- スタイル ---
const sectionStyle: React.CSSProperties = { marginBottom: '32px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1rem', opacity: 0.6, marginBottom: '16px', marginLeft: '4px', fontWeight: 'bold', letterSpacing: '0.05em' };
const taskListContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const emptyMessageStyle: React.CSSProperties = { textAlign: 'center', marginTop: '20px', opacity: 0.4, fontSize: '0.9rem' };

const taskCardStyle: React.CSSProperties = { padding: '16px', borderRadius: '16px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s ease' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' };
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' };
const upcomingLabelStyle: React.CSSProperties = { fontSize: '0.65rem', color: '#aaa', backgroundColor: '#333', padding: '2px 6px', borderRadius: '4px' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' };
const taskMemoStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.5, display: 'flex', alignItems: 'center' };
const notificationBadgeListStyle: React.CSSProperties = { marginTop: '8px', display: 'flex', gap: '4px' };
const notificationBadgeStyle: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.8 };
const getPriorityBadgeStyle = (priority: string): React.CSSProperties => ({ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: priority === 'HIGH' ? '#ff4d4d' : priority === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000' });
const completeButtonStyle: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '22px', border: '2px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '12px', flexShrink: 0 };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#ededed', color: '#0a0a0a', border: 'none', fontSize: '32px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 };
