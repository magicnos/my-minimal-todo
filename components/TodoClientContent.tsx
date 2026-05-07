'use client';

import { useState } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction } from '@/app/actions';

/**
 * メイン画面の動的な操作を担当するコンポーネント
 */
export default function TodoClientContent({ initialTasks }: { initialTasks: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // 編集中のタスクデータを保存する状態（nullなら新規作成）
  const [editingTask, setEditingTask] = useState<any | null>(null);

  /**
   * 編集ボタンが押されたとき
   */
  const handleEditButtonClick = (task: any) => {
    setEditingTask(task);
    setIsFormVisible(true);
  };

  /**
   * 完了（削除）ボタンが押されたとき
   */
  const handleCompleteButtonClick = async (taskId: number) => {
    if (confirm('このタスクを完了して削除しますか？')) {
      await deleteTaskAction(taskId);
    }
  };

  /**
   * フォームを閉じるとき
   */
  const handleFormClose = () => {
    setIsFormVisible(false);
    setEditingTask(null); // 編集データをクリア
  };

  return (
    <>
      <section style={taskListSectionStyle}>
        {initialTasks.length === 0 ? (
          <p style={emptyMessageStyle}>タスクがありません。</p>
        ) : (
          initialTasks.map((task) => (
            <div key={task.id} style={taskCardStyle}>
              <div style={taskContentStyle} onClick={() => handleEditButtonClick(task)}>
                <div style={taskHeaderStyle}>
                  <span style={getPriorityBadgeStyle(task.taskPriority)}>
                    {task.taskPriority === 'HIGH' ? '高' : task.taskPriority === 'MEDIUM' ? '中' : '低'}
                  </span>
                  <span style={taskTypeStyle}>{task.taskType === 'HABIT' ? '🔄 習慣' : '📍 一回'}</span>
                </div>
                
                <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
                {task.taskMemo && <p style={taskMemoStyle}>{task.taskMemo}</p>}
                
                <div style={timeInfoStyle}>
                  <span>始: {new Date(task.taskStartTime).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ margin: '0 8px' }}>→</span>
                  <span>終: {new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* 通知設定がある場合に表示 */}
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
          ))
        )}
      </section>

      <button onClick={() => setIsFormVisible(true)} style={floatingAddButtonStyle}>+</button>

      {isFormVisible && (
        <TaskCreateForm 
          onComplete={handleFormClose} 
          editTaskData={editingTask} 
        />
      )}
    </>
  );
}

// --- スタイル ---
const taskListSectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' };
const emptyMessageStyle: React.CSSProperties = { textAlign: 'center', marginTop: '40px', opacity: 0.5 };
const taskCardStyle: React.CSSProperties = { padding: '16px', borderRadius: '16px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' }; // カード全体をクリックして編集へ
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '8px' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' };
const taskMemoStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.7, marginBottom: '8px' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.5, display: 'flex', alignItems: 'center' };
const notificationBadgeListStyle: React.CSSProperties = { marginTop: '8px', display: 'flex', gap: '4px' };
const notificationBadgeStyle: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.8 };
const getPriorityBadgeStyle = (priority: string): React.CSSProperties => ({ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', backgroundColor: priority === 'HIGH' ? '#ff4d4d' : priority === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000' });
const taskTypeStyle: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.6 };
const completeButtonStyle: React.CSSProperties = { width: '44px', height: '44px', borderRadius: '22px', border: '2px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '12px' };
const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#ededed', color: '#0a0a0a', border: 'none', fontSize: '32px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
