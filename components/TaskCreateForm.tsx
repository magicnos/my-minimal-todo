'use client';

import { createTaskAction, updateTaskAction } from '@/app/actions';
import { useState } from 'react';

// datetime-local input 用のフォーマット
const formatToLocalString = (date?: Date) => {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function TaskCreateForm({ onComplete, editTaskData }: { onComplete: () => void; editTaskData?: any; }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskType, setTaskType] = useState(editTaskData?.taskType || "DAILY");

  const daysOfWeek = [
    { label: '日', value: 0 }, { label: '月', value: 1 }, { label: '火', value: 2 },
    { label: '水', value: 3 }, { label: '木', value: 4 }, { label: '金', value: 5 }, { label: '土', value: 6 }
  ];

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const rawFormData = new FormData(event.currentTarget);
    const deadlineRaw = rawFormData.get('taskDeadline') as string;
    
    // 一回きりの場合のみ締め切りをセット
    if (taskType === 'SINGLE' && deadlineRaw) {
      rawFormData.set('taskDeadline', new Date(deadlineRaw).toISOString());
    } else {
      rawFormData.delete('taskDeadline');
    }
    rawFormData.delete('taskStartTime');

    try {
      if (editTaskData) { await updateTaskAction(editTaskData.id, rawFormData); }
      else { await createTaskAction(rawFormData); }
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

        <div style={inputGroupStyle}>
          <label style={labelStyle}>タスクのタイプ</label>
          <div style={typeTabContainerStyle}>
            {['DAILY', 'WEEKLY', 'MONTHLY', 'SINGLE'].map(type => (
              <button key={type} type="button" 
                onClick={() => setTaskType(type)}
                style={{
                  ...typeTabStyle,
                  backgroundColor: taskType === type ? '#ededed' : '#171717',
                  color: taskType === type ? '#0a0a0a' : '#fff',
                }}
              >
                {type === 'DAILY' ? '毎日' : type === 'WEEKLY' ? '毎週' : type === 'MONTHLY' ? '毎月' : '一回'}
              </button>
            ))}
            <input type="hidden" name="taskType" value={taskType} />
          </div>
        </div>

        <div style={detailSectionStyle}>
          {taskType === 'DAILY' && (
            <div>
              <p style={helpTextStyle}>曜日ごとに回数を設定してください。</p>
              <div style={daysGridStyle}>
                {daysOfWeek.map(day => (
                  <div key={day.value} style={dayInputItemStyle}>
                    <label style={smallLabelStyle}>{day.label}</label>
                    <input name={`dailyCount_${day.value}`} type="number" min="0" 
                      defaultValue={editTaskData?.habitDailySchedule?.[day.value] || 0} style={smallInputStyle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(taskType === 'WEEKLY' || taskType === 'MONTHLY') && (
            <div style={rowStyle}>
              <div style={halfInputStyle}>
                <label style={labelStyle}>期間（日数）</label>
                <input name="habitPeriodDays" type="number" min="1" 
                  defaultValue={editTaskData?.habitPeriodDays || (taskType === 'WEEKLY' ? 7 : 30)} style={inputStyle} />
              </div>
              <div style={halfInputStyle}>
                <label style={labelStyle}>目標回数</label>
                <input name="habitTargetCount" type="number" min="1" defaultValue={editTaskData?.habitTargetCount || 1} style={inputStyle} />
              </div>
            </div>
          )}

          {taskType === 'SINGLE' && (
            <div>
              <label style={labelStyle}>期限（締め切り）</label>
              <input name="taskDeadline" type="datetime-local" required defaultValue={formatToLocalString(editTaskData?.taskDeadline) || formatToLocalString(new Date(Date.now() + 86400000))} style={inputStyle} />
            </div>
          )}
        </div>

        <div style={rowStyle}>
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

        <div style={buttonContainerStyle}>
          <button type="button" onClick={onComplete} style={cancelButtonStyle}>キャンセル</button>
          <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>保存する</button>
        </div>
      </form>
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 1000 };
const formCardStyle: React.CSSProperties = { backgroundColor: '#171717', width: '100%', maxWidth: '550px', padding: '24px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', maxHeight: '95vh', overflowY: 'auto' };
const formTitleStyle: React.CSSProperties = { marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' };
const inputGroupStyle: React.CSSProperties = { marginBottom: '16px' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '0.85rem', opacity: 0.7 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem' };
const textareaStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', minHeight: '60px', resize: 'none' };
const typeTabContainerStyle: React.CSSProperties = { display: 'flex', gap: '4px', backgroundColor: '#0a0a0a', padding: '4px', borderRadius: '10px' };
const typeTabStyle: React.CSSProperties = { flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' };
const detailSectionStyle: React.CSSProperties = { padding: '16px', backgroundColor: '#222', borderRadius: '12px', marginBottom: '16px' };
const daysGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' };
const dayInputItemStyle: React.CSSProperties = { textAlign: 'center' };
const smallLabelStyle: React.CSSProperties = { fontSize: '0.7rem', display: 'block', marginBottom: '4px' };
const smallInputStyle: React.CSSProperties = { width: '100%', padding: '8px 4px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#0a0a0a', color: '#fff', textAlign: 'center', fontSize: '0.9rem' };
const helpTextStyle: React.CSSProperties = { fontSize: '0.75rem', opacity: 0.5, marginBottom: '12px' };
const rowStyle: React.CSSProperties = { display: 'flex', gap: '12px', marginBottom: '16px' };
const halfInputStyle: React.CSSProperties = { flex: 1 };
const buttonContainerStyle: React.CSSProperties = { display: 'flex', gap: '12px' };
const submitButtonStyle: React.CSSProperties = { flex: 2, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#ededed', color: '#0a0a0a', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
const cancelButtonStyle: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #333', backgroundColor: 'transparent', color: '#fff', fontSize: '1rem', cursor: 'pointer' };
