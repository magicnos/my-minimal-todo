'use client';

import { createTaskAction, updateTaskAction } from '@/app/actions';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

/**
 * タスク作成・編集用フォーム
 */
export default function TaskCreateForm({ onComplete, editTaskData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskType, setTaskType] = useState(editTaskData?.taskType || "DAILY");
  const [dailyCounts, setDailyCounts] = useState(editTaskData?.habitDailySchedule || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });

  const daysOfWeek = [
    { label: '日', value: 0 }, { label: '月', value: 1 }, { label: '火', value: 2 },
    { label: '水', value: 3 }, { label: '木', value: 4 }, { label: '金', value: 5 }, { label: '土', value: 6 }
  ];

  const updateAllDays = (delta) => {
    setDailyCounts(prev => {
      const next = { ...prev };
      for (let i = 0; i < 7; i++) next[i] = Math.max(0, (next[i] || 0) + delta);
      return next;
    });
  };

  const isHabitMode = taskType === 'DAILY' || taskType === 'MULTI_DAY';

  return (
    <Modal onClose={onComplete} title={editTaskData?.id ? '編集' : '新規タスク'}>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        if (taskType === 'SINGLE' && formData.get('taskDeadline')) {
          formData.set('taskDeadline', new Date(formData.get('taskDeadline')).toISOString());
        }
        try {
          editTaskData?.id ? await updateTaskAction(editTaskData.id, formData) : await createTaskAction(formData);
          onComplete();
        } finally { setIsSubmitting(false); }
      }}>
        
        <div className="input-group">
          <label className="label">タイトル</label>
          <input name="taskTitle" type="text" required defaultValue={editTaskData?.taskTitle} className="input" placeholder="何をやりますか？" />
        </div>

        <div className="input-group">
          <label className="label">種類</label>
          <div className="type-tabs">
            {['DAILY', 'MULTI_DAY', 'SINGLE'].map(type => (
              <button key={type} type="button" onClick={() => setTaskType(type)} className={`type-tab ${taskType === type ? 'active' : ''}`}>
                {type === 'DAILY' ? '毎日' : type === 'MULTI_DAY' ? '期間' : '一回'}
              </button>
            ))}
            <input type="hidden" name="taskType" value={taskType} />
          </div>
        </div>

        <div className="detail-section">
          {taskType === 'DAILY' && (
            <div>
              <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="label">目標回数</label>
                <div className="row">
                  <button type="button" onClick={() => updateAllDays(-1)} className="mini-btn">-1</button>
                  <button type="button" onClick={() => updateAllDays(1)} className="mini-btn">+1</button>
                </div>
              </div>
              <div className="days-grid">
                {daysOfWeek.map(day => (
                  <div key={day.value} style={{ textAlign: 'center' }}>
                    <label style={{ fontSize: '0.6rem', display: 'block' }}>{day.label}</label>
                    <input name={`dailyCount_${day.value}`} type="number" min="0" value={dailyCounts[day.value] || 0} onChange={(e) => setDailyCounts(p => ({ ...p, [day.value]: parseInt(e.target.value) || 0 }))} className="small-input" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {taskType === 'MULTI_DAY' && (
            <div>
              <div className="row">
                <div className="col"><label className="label">開始</label><select name="habitStartDay" defaultValue={editTaskData?.habitStartDay || 0} className="select">{daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
                <div className="col"><label className="label">時間</label><input name="habitStartTime" type="time" defaultValue={editTaskData?.habitStartTime || "00:00"} className="input" /></div>
              </div>
              <div className="row">
                <div className="col"><label className="label">終了</label><select name="habitEndDay" defaultValue={editTaskData?.habitEndDay || 0} className="select">{daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
                <div className="col"><label className="label">時間</label><input name="habitEndTime" type="time" defaultValue={editTaskData?.habitEndTime || "23:59"} className="input" /></div>
              </div>
              <div className="col"><label className="label">期間内目標</label><input name="habitTargetCount" type="number" min="1" defaultValue={editTaskData?.habitTargetCount || 1} className="input" /></div>
            </div>
          )}

          {taskType === 'SINGLE' && (
            <div>
              <label className="label">期限</label>
              <input name="taskDeadline" type="datetime-local" required defaultValue={editTaskData?.taskDeadline ? new Date(new Date(editTaskData.taskDeadline).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} className="input" />
            </div>
          )}
        </div>

        <div className="row">
          <div className="col">
            <label className="label">優先度</label>
            <select name="taskPriority" defaultValue={editTaskData?.taskPriority || "MEDIUM"} className="select">
              <option value="LOW">低</option><option value="MEDIUM">中</option><option value="HIGH">高</option>
            </select>
          </div>
          {isHabitMode && (
            <div className="col">
              <label className="label">報酬タイミング</label>
              <select name="rewardTiming" defaultValue={editTaskData?.rewardTiming || "EACH"} className="select">
                <option value="EACH">1回ごと</option><option value="TOTAL">全達成時</option>
              </select>
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="label">獲得XP</label>
          <input name="rewardXP" type="number" min="0" defaultValue={editTaskData?.rewardXP ?? 10} className="input" />
        </div>

        <div className="input-group">
          <label className="label">メモ</label>
          <textarea name="taskMemo" defaultValue={editTaskData?.taskMemo} className="textarea" placeholder="自由入力" />
        </div>

        <div className="btn-container">
          <button type="button" onClick={onComplete} className="btn-cancel-form">戻る</button>
          <button type="submit" disabled={isSubmitting} className="btn-submit">{isSubmitting ? '...' : '保存'}</button>
        </div>
      </form>
    </Modal>
  );
}
