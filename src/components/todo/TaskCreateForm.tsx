'use client';

import { createTaskAction, updateTaskAction } from '@/app/actions';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

const formatToLocalString = (date?: Date) => {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function TaskCreateForm({ onComplete, editTaskData }: { onComplete: () => void; editTaskData?: any; }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskType, setTaskType] = useState(editTaskData?.taskType || "DAILY");
  const [dailyCounts, setDailyCounts] = useState<{ [key: number]: number }>(
    editTaskData?.habitDailySchedule || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  );

  const daysOfWeek = [
    { label: '日', value: 0 }, { label: '月', value: 1 }, { label: '火', value: 2 },
    { label: '水', value: 3 }, { label: '木', value: 4 }, { label: '金', value: 5 }, { label: '土', value: 6 }
  ];

  const incrementAllDays = () => {
    setDailyCounts(prev => {
      const next = { ...prev };
      for (let i = 0; i < 7; i++) {
        next[i] = (next[i] || 0) + 1;
      }
      return next;
    });
  };

  const decrementAllDays = () => {
    setDailyCounts(prev => {
      const next = { ...prev };
      for (let i = 0; i < 7; i++) {
        next[i] = Math.max(0, (next[i] || 0) - 1);
      }
      return next;
    });
  };

  const updateDailyCount = (day: number, val: number) => {
    setDailyCounts(prev => ({ ...prev, [day]: val }));
  };

  const isHabitMode = taskType === 'DAILY' || taskType === 'MULTI_DAY';

  return (
    <Modal onClose={onComplete} title={editTaskData?.id ? '編集' : '新規追加'}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        if (taskType === 'SINGLE' && formData.get('taskDeadline')) {
          formData.set('taskDeadline', new Date(formData.get('taskDeadline') as string).toISOString());
        }
        try {
          if (editTaskData?.id) { await updateTaskAction(editTaskData.id, formData); }
          else { await createTaskAction(formData); }
          onComplete();
        } finally { setIsSubmitting(false); }
      }}>
        
        <div style={inputGroupStyle}>
          <label style={labelStyle}>タイトル</label>
          <input name="taskTitle" type="text" required defaultValue={editTaskData?.taskTitle} style={inputStyle} />
        </div>

        {isHabitMode && (
          <div style={inputGroupStyle}>
            <label style={labelStyle}>習慣のタイプ</label>
            <div style={typeTabContainerStyle}>
              {['DAILY', 'MULTI_DAY'].map(type => (
                <button key={type} type="button" onClick={() => setTaskType(type)}
                  style={{ ...typeTabStyle, backgroundColor: taskType === type ? '#ededed' : '#171717', color: taskType === type ? '#0a0a0a' : '#fff' }}>
                  {type === 'DAILY' ? '1日' : '複数日'}
                </button>
              ))}
              <input type="hidden" name="taskType" value={taskType} />
            </div>
          </div>
        )}
        {!isHabitMode && <input type="hidden" name="taskType" value="SINGLE" />}

        <div style={detailSectionStyle}>
          {taskType === 'DAILY' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>曜日ごとの目標回数</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={decrementAllDays} style={miniButtonStyle}>毎日-1</button>
                  <button type="button" onClick={incrementAllDays} style={miniButtonStyle}>毎日+1</button>
                </div>
              </div>
              <div style={daysGridStyle}>
                {daysOfWeek.map(day => (
                  <div key={day.value} style={dayInputItemStyle}>
                    <label style={smallLabelStyle}>{day.label}</label>
                    <input 
                      name={`dailyCount_${day.value}`} 
                      type="number" 
                      min="0" 
                      value={dailyCounts[day.value] || 0} 
                      onChange={(e) => updateDailyCount(day.value, parseInt(e.target.value) || 0)}
                      style={smallInputStyle} 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {taskType === 'MULTI_DAY' && (
            <div>
              <div style={rowStyle}>
                <div style={halfInputStyle}>
                  <label style={labelStyle}>開始曜日</label>
                  <select name="habitStartDay" defaultValue={editTaskData?.habitStartDay || 0} style={inputStyle}>
                    {daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div style={halfInputStyle}>
                  <label style={labelStyle}>開始時間</label>
                  <input name="habitStartTime" type="time" defaultValue={editTaskData?.habitStartTime || "00:00"} style={inputStyle} />
                </div>
              </div>
              <div style={rowStyle}>
                <div style={halfInputStyle}>
                  <label style={labelStyle}>終了曜日</label>
                  <select name="habitEndDay" defaultValue={editTaskData?.habitEndDay || 0} style={inputStyle}>
                    {daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div style={halfInputStyle}>
                  <label style={labelStyle}>終了時間</label>
                  <input name="habitEndTime" type="time" defaultValue={editTaskData?.habitEndTime || "23:59"} style={inputStyle} />
                </div>
              </div>
              <div style={rowStyle}>
                <div style={halfInputStyle}>
                  <label style={labelStyle}>期間内の目標回数</label>
                  <input name="habitTargetCount" type="number" min="1" defaultValue={editTaskData?.habitTargetCount || 1} style={inputStyle} />
                </div>
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
          {isHabitMode ? (
            <div style={halfInputStyle}>
              <label style={labelStyle}>報酬タイミング</label>
              <select name="rewardTiming" defaultValue={editTaskData?.rewardTiming || "EACH"} style={inputStyle}>
                <option value="EACH">1回ごと</option>
                <option value="TOTAL">全達成時</option>
              </select>
            </div>
          ) : (
            <input type="hidden" name="rewardTiming" value="EACH" />
          )}
        </div>

        <div style={rowStyle}>
          <div style={halfInputStyle}>
            <label style={labelStyle}>獲得XP</label>
            <input name="rewardXP" type="number" min="0" defaultValue={editTaskData?.rewardXP || 10} style={inputStyle} />
          </div>
          <div style={halfInputStyle}>
            <label style={labelStyle}>獲得ポイント</label>
            <input name="rewardPoints" type="number" min="0" defaultValue={editTaskData?.rewardPoints || 10} style={inputStyle} />
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
    </Modal>
  );
}

const inputGroupStyle: React.CSSProperties = { marginBottom: '16px' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', fontSize: '0.85rem', opacity: 0.7 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem' };
const textareaStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', minHeight: '60px', resize: 'none' };
const typeTabContainerStyle: React.CSSProperties = { display: 'flex', gap: '4px', backgroundColor: '#0a0a0a', padding: '4px', borderRadius: '10px' };
const typeTabStyle: React.CSSProperties = { flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' };
const detailSectionStyle: React.CSSProperties = { padding: '16px', backgroundColor: '#222', borderRadius: '12px', marginBottom: '16px' };
const daysGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' };
const dayInputItemStyle: React.CSSProperties = { textAlign: 'center' };
const smallLabelStyle: React.CSSProperties = { fontSize: '0.6rem', display: 'block', marginBottom: '4px' };
const smallInputStyle: React.CSSProperties = { width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#0a0a0a', color: '#fff', textAlign: 'center' };
const rowStyle: React.CSSProperties = { display: 'flex', gap: '10px', marginBottom: '12px' };
const halfInputStyle: React.CSSProperties = { flex: 1 };
const buttonContainerStyle: React.CSSProperties = { display: 'flex', gap: '12px' };
const submitButtonStyle: React.CSSProperties = { flex: 2, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#ededed', color: '#0a0a0a', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
const cancelButtonStyle: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #333', backgroundColor: 'transparent', color: '#fff', fontSize: '1rem', cursor: 'pointer' };
const miniButtonStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: '#444', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' };
