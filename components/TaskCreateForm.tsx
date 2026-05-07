'use client';

import { createTaskAction } from '@/app/actions';
import { useState } from 'react';

/**
 * 新しいタスクを作成するためのフォーム画面です。
 */
export default function TaskCreateForm({ onComplete }: { onComplete: () => void }) {
  // 送信中かどうかを管理する状態（連打防止）
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * フォームが送信された時の処理
   */
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // ページがリロードされるのを防ぐ
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      await createTaskAction(formData);
      onComplete(); // 成功したらフォームを閉じる
    } catch (error) {
      alert('保存に失敗しました。');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <form onSubmit={handleFormSubmit} style={formCardStyle}>
        <h2 style={formTitleStyle}>新しいタスク</h2>

        {/* タイトル入力 */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>タイトル</label>
          <input name="taskTitle" type="text" required placeholder="何をする？" style={inputStyle} />
        </div>

        {/* メモ入力 */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>メモ</label>
          <textarea name="taskMemo" placeholder="詳しい説明（任意）" style={textareaStyle} />
        </div>

        {/* 期限入力 */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>期限</label>
          <input name="taskDeadline" type="datetime-local" required style={inputStyle} />
        </div>

        {/* 優先度とタイプ（横並び） */}
        <div style={rowStyle}>
          <div style={halfInputStyle}>
            <label style={labelStyle}>優先度</label>
            <select name="taskPriority" style={inputStyle}>
              <option value="LOW">低</option>
              <option value="MEDIUM" selected>中</option>
              <option value="HIGH">高</option>
            </select>
          </div>
          <div style={halfInputStyle}>
            <label style={labelStyle}>タイプ</label>
            <select name="taskType" style={inputStyle}>
              <option value="SINGLE">一回きり</option>
              <option value="HABIT">習慣</option>
            </select>
          </div>
        </div>

        {/* 通知設定 */}
        <div style={notificationSectionStyle}>
          <label style={checkboxLabelStyle}>
            <input name="isNotificationEnabled" type="checkbox" />
            <span style={{ marginLeft: '8px' }}>通知を有効にする</span>
          </label>
          <div style={{ marginTop: '8px' }}>
            <label style={smallLabelStyle}>何分前に通知する？</label>
            <input name="notificationLeadTimeMinutes" type="number" defaultValue="0" min="0" style={smallInputStyle} />
          </div>
        </div>

        {/* ボタン類 */}
        <div style={buttonContainerStyle}>
          <button type="button" onClick={onComplete} style={cancelButtonStyle}>キャンセル</button>
          <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>
            {isSubmitting ? '保存中...' : 'タスクを追加'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- スタイル（スマホ優先のミニマリストデザイン） ---

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end', // スマホで下から出てくる感じ
  zIndex: 1000,
};

const formCardStyle: React.CSSProperties = {
  backgroundColor: '#171717',
  width: '100%',
  maxWidth: '500px',
  padding: '24px',
  borderTopLeftRadius: '24px',
  borderTopRightRadius: '24px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const formTitleStyle: React.CSSProperties = {
  marginBottom: '20px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
};

const inputGroupStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.85rem',
  opacity: 0.7,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #333',
  backgroundColor: '#0a0a0a',
  color: '#fff',
  fontSize: '1rem',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #333',
  backgroundColor: '#0a0a0a',
  color: '#fff',
  fontSize: '1rem',
  minHeight: '80px',
  resize: 'none',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '16px',
};

const halfInputStyle: React.CSSProperties = {
  flex: 1,
};

const notificationSectionStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#222',
  borderRadius: '12px',
  marginBottom: '20px',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  opacity: 0.6,
  display: 'block',
};

const smallInputStyle: React.CSSProperties = {
  width: '80px',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #444',
  backgroundColor: '#0a0a0a',
  color: '#fff',
  marginTop: '4px',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const submitButtonStyle: React.CSSProperties = {
  flex: 2,
  padding: '16px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#ededed',
  color: '#0a0a0a',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #333',
  backgroundColor: 'transparent',
  color: '#fff',
  fontSize: '1rem',
  cursor: 'pointer',
};
