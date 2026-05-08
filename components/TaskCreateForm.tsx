'use client';

import { createTaskAction, updateTaskAction } from '@/app/actions';
import { useState } from 'react';

// 日時を <input type="datetime-local"> が読み取れる形式にする関数
const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function TaskCreateForm({ onComplete, editTaskData }: { onComplete: () => void; editTaskData?: any; }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskType, setTaskType] = useState(editTaskData?.taskType || "SINGLE");

  const initialNotifications = editTaskData?.notifications?.map((n: any) => formatDateTime(new Date(n.notificationTime))) || [];
  const [notificationTimeList, setNotificationTimeList] = useState<string[]>(initialNotifications);

  const defaultStart = formatDateTime(new Date());
  const defaultEnd = formatDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      if (editTaskData) { await updateTaskAction(editTaskData.id, formData); }
      else { await createTaskAction(formData); }
      onComplete();
    } catch (error) {
      alert('保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <form onSubmit={handleFormSubmit} style={formCardStyle}>
        <h2 style={formTitleStyle}>{editTaskData ? 'タスクを編集' : '新しいタスク'}</h2>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>タイトル</label>
          <input name="taskTitle" type="text" required defaultValue={editTaskData?.taskTitle} style={inputStyle} />
        </div>

        <div style={rowStyle}>
          <div style={halfInputStyle}>
            <label style={labelStyle}>開始時間</label>
            <input name="taskStartTime" type="datetime-local" required 
              defaultValue={editTaskData ? formatDateTime(new Date(editTaskData.taskStartTime)) : defaultStart} style={inputStyle} />
          </div>
          <div style={halfInputStyle}>
            <label style={labelStyle}>期限</label>
            <input name="taskDeadline" type="datetime-local" required 
              defaultValue={editTaskData ? formatDateTime(new Date(editTaskData.taskDeadline)) : defaultEnd} style={inputStyle} />
          </div>
        </div>

        <div style={rowStyle}>
          <div style={halfInputStyle}>
            <label style={labelStyle}>タイプ</label>
            <select name="taskType" value={taskType} onChange={(e) => setTaskType(e.target.value)} style={inputStyle}>
              <option value="SINGLE">一回きり</option>
              <option value="HABIT">習慣</option>
            </select>
          </div>
          {taskType === 'HABIT' && (
            <div style={halfInputStyle}>
              <label style={labelStyle}>頻度</label>
              <select name="habitFrequency" defaultValue={editTaskData?.habitFrequency || "DAILY"} style={inputStyle}>
                <option value="DAILY">毎日</option>
                <option value="WEEKLY">毎週</option>
                <option value="MONTHLY">毎月</option>
              </select>
            </div>
          )}
          <div style={halfInputStyle}>
            <label style={labelStyle}>優先度</label>
            <select name="taskPriority" defaultValue={editTaskData?.taskPriority || "MEDIUM"} style={inputStyle}>
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
            </select>
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>メモ</label>
          <textarea name="taskMemo" defaultValue={editTaskData?.taskMemo} style={textareaStyle} />
        </div>

        <div style={notificationSectionStyle}>
          <label style={labelStyle}>🔔 通知設定</label>
          {notificationTimeList.map((time, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input name="notificationTimes" type="datetime-local" value={time} 
                onChange={(e) => {
                  const newList = [...notificationTimeList];
                  newList[index] = e.target.value;
                  setNotificationTimeList(newList);
                }} style={{ ...inputStyle, flex: 1 }} />
              <button type="button" onClick={() => setNotificationTimeList(notificationTimeList.filter((_, i) => i !== index))} style={deleteSmallButtonStyle}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => setNotificationTimeList([...notificationTimeList, ""])} style={addSmallButtonStyle}>＋ 通知を追加</button>
        </div>

        <div style={buttonContainerStyle}>
          <button type="button" onClick={onComplete} style={cancelButtonStyle}>キャンセル</button>
          <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>{isSubmitting ? '保存中...' : '保存する'}</button>
        </div>
      </form>
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000 };
const formCardStyle: React.CSSProperties = { backgroundColor: '#171717', width: '100%', maxWidth: '550px', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', maxHeight: '90vh', overflowY: 'auto' };
const formTitleStyle: React.CSSProperties = { marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' };
const inputGroupStyle: React.CSSProperties = { marginBottom: '16px' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '0.85rem', opacity: 0.7 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem' };
const textareaStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', minHeight: '60px', resize: 'none' };
const rowStyle: React.CSSProperties = { display: 'flex', gap: '12px', marginBottom: '16px' };
const halfInputStyle: React.CSSProperties = { flex: 1 };
const notificationSectionStyle: React.CSSProperties = { padding: '16px', backgroundColor: '#222', borderRadius: '12px', marginBottom: '20px' };
const addSmallButtonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '6px', border: '1px dashed #555', backgroundColor: 'transparent', color: '#aaa', fontSize: '0.8rem', cursor: 'pointer', width: '100%' };
const deleteSmallButtonStyle: React.CSSProperties = { width: '40px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const buttonContainerStyle: React.CSSProperties = { display: 'flex', gap: '12px' };
const submitButtonStyle: React.CSSProperties = { flex: 2, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#ededed', color: '#0a0a0a', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
const cancelButtonStyle: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #333', backgroundColor: 'transparent', color: '#fff', fontSize: '1rem', cursor: 'pointer' };
