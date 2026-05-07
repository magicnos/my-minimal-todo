'use client';

import { useState } from 'react';
import TaskCreateForm from './TaskCreateForm';
import { deleteTaskAction } from '@/app/actions';

interface Task {
  id: number;
  taskTitle: string;
  taskMemo?: string;
  taskDeadline: string;
  taskPriority: string;
  taskType: string;
}

/**
 * メイン画面の動的な操作（ボタンクリックなど）を担当するコンポーネントです。
 */
export default function TodoClientContent({ initialTasks }: { initialTasks: Task[] }) {
  // 入力フォームを表示するかどうかの状態
  const [isFormVisible, setIsFormVisible] = useState(false);

  /**
   * タスクの完了（削除）ボタンが押された時の処理
   */
  const handleCompleteButtonClick = async (taskId: number) => {
    if (confirm('このタスクを完了して削除しますか？')) {
      await deleteTaskAction(taskId);
    }
  };

  return (
    <>
      <section style={taskListSectionStyle}>
        {initialTasks.length === 0 ? (
          <p style={emptyMessageStyle}>タスクがありません。右下の「＋」から追加してください。</p>
        ) : (
          initialTasks.map((task) => (
            <div key={task.id} style={taskCardStyle}>
              <div style={taskContentStyle}>
                <div style={taskHeaderStyle}>
                  <span style={getPriorityBadgeStyle(task.taskPriority)}>
                    {task.taskPriority === 'HIGH' ? '高' : task.taskPriority === 'MEDIUM' ? '中' : '低'}
                  </span>
                  <span style={taskTypeStyle}>{task.taskType === 'HABIT' ? '🔄 習慣' : '📍 一回'}</span>
                </div>
                <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
                {task.taskMemo && <p style={taskMemoStyle}>{task.taskMemo}</p>}
                <p style={deadlineStyle}>
                  📅 {new Date(task.taskDeadline).toLocaleString('ja-JP', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              
              {/* 完了ボタン（円形） */}
              <button 
                onClick={() => handleCompleteButtonClick(task.id)}
                style={completeButtonStyle}
                aria-label="完了"
              >
                ✓
              </button>
            </div>
          ))
        )}
      </section>

      {/* 右下のプラスボタン */}
      <button 
        onClick={() => setIsFormVisible(true)}
        style={floatingAddButtonStyle}
      >
        +
      </button>

      {/* フォームの表示 */}
      {isFormVisible && (
        <TaskCreateForm onComplete={() => setIsFormVisible(false)} />
      )}
    </>
  );
}

// --- スタイル設定 ---

const taskListSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  paddingBottom: '100px', // ボタンに被らないように
};

const emptyMessageStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '40px',
  opacity: 0.5,
  fontSize: '0.9rem',
};

const taskCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  backgroundColor: '#171717',
  border: '1px solid #333',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const taskContentStyle: React.CSSProperties = {
  flex: 1,
};

const taskHeaderStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '8px',
  alignItems: 'center',
};

const getPriorityBadgeStyle = (priority: string): React.CSSProperties => ({
  fontSize: '0.7rem',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 'bold',
  backgroundColor: priority === 'HIGH' ? '#ff4d4d' : priority === 'MEDIUM' ? '#ffa500' : '#4dff4d',
  color: '#000',
});

const taskTypeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  opacity: 0.6,
};

const taskTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: '600',
  marginBottom: '4px',
};

const taskMemoStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  opacity: 0.7,
  marginBottom: '8px',
};

const deadlineStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  opacity: 0.5,
};

const completeButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '20px',
  border: '2px solid #333',
  backgroundColor: 'transparent',
  color: '#4dff4d',
  fontSize: '1.2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  marginLeft: '12px',
};

const floatingAddButtonStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  width: '64px',
  height: '64px',
  borderRadius: '32px',
  backgroundColor: '#ededed',
  color: '#0a0a0a',
  border: 'none',
  fontSize: '32px',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};
