'use client';

import { useState } from 'react';

/**
 * TODOリストのメイン画面コンポーネントです。
 * 高校生にもわかりやすいよう、シンプルな構造にしています。
 */
export default function TodoMainPage() {
  // まだデータベースを作っていないので、一時的に画面上だけで動くタスクリストを用意します
  const [todoTaskList, setTodoTaskList] = useState([
    { id: 1, title: 'パスワード画面の確認', isCompleted: true },
    { id: 2, title: 'データベースの作成', isCompleted: false },
  ]);

  return (
    <main style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>My Tasks</h1>
      </header>

      <section style={taskListSectionStyle}>
        {todoTaskList.map((task) => (
          <div key={task.id} style={taskCardStyle}>
            <span style={{
              textDecoration: task.isCompleted ? 'line-through' : 'none',
              opacity: task.isCompleted ? 0.5 : 1
            }}>
              {task.title}
            </span>
          </div>
        ))}
      </section>

      {/* 右下のプラスボタン（スマホを意識したデザイン） */}
      <button style={floatingAddButtonStyle}>+</button>
    </main>
  );
}

// --- 見た目の設定（CSS） ---

const mainContainerStyle: React.CSSProperties = {
  padding: '20px',
  maxWidth: '600px',
  margin: '0 auto',
  minHeight: '100vh',
};

const headerStyle: React.CSSProperties = {
  padding: '40px 0 20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
};

const taskListSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const taskCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '12px',
  backgroundColor: '#171717', // ダークモード用のカード色
  border: '1px solid #333',
  display: 'flex',
  alignItems: 'center',
};

const floatingAddButtonStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  width: '60px',
  height: '60px',
  borderRadius: '30px',
  backgroundColor: '#ededed',
  color: '#0a0a0a',
  border: 'none',
  fontSize: '24px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
};
