'use client';

import { createCalendarEventAction, updateCalendarEventAction } from '@/app/actions';
import Modal from '@/components/ui/Modal';

export default function CalendarEventForm({ onComplete, editData }) {
  const isEdit = !!editData?.id;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (isEdit) {
      await updateCalendarEventAction(editData.id, formData);
    } else {
      await createCalendarEventAction(formData);
    }
    
    onComplete();
  };

  // 日付の初期値を YYYY-MM-DD 形式に変換
  const defaultDate = editData?.date 
    ? new Date(editData.date).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];

  return (
    <Modal title={isEdit ? '予定を編集' : '予定を追加'} onClose={onComplete}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>タイトル</label>
          <input 
            name="title" 
            defaultValue={editData?.title || ''} 
            required 
            style={inputStyle}
            placeholder="予定のタイトル"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>メモ</label>
          <textarea 
            name="memo" 
            defaultValue={editData?.memo || ''} 
            style={{...inputStyle, height: '80px'}}
            placeholder="詳細など"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>日付</label>
          <input 
            type="date" 
            name="date" 
            defaultValue={defaultDate} 
            required 
            style={inputStyle}
          />
        </div>

        <div style={{display: 'flex', gap: '12px'}}>
          <div style={{...inputGroupStyle, flex: 1}}>
            <label style={labelStyle}>開始時間</label>
            <input 
              type="time" 
              name="startTime" 
              defaultValue={editData?.startTime || ''} 
              style={inputStyle}
            />
          </div>
          <div style={{...inputGroupStyle, flex: 1}}>
            <label style={labelStyle}>終了時間</label>
            <input 
              type="time" 
              name="endTime" 
              defaultValue={editData?.endTime || ''} 
              style={inputStyle}
            />
          </div>
        </div>

        <button type="submit" style={submitButtonStyle}>
          {isEdit ? '更新する' : '追加する'}
        </button>
      </form>
    </Modal>
  );
}

const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.7 };
const inputStyle = { 
  backgroundColor: '#333', 
  border: '1px solid #444', 
  color: '#fff', 
  padding: '12px', 
  borderRadius: '12px',
  fontSize: '1rem'
};
const submitButtonStyle = { 
  backgroundColor: '#fff', 
  color: '#000', 
  border: 'none', 
  padding: '16px', 
  borderRadius: '12px', 
  fontSize: '1rem', 
  fontWeight: 'bold', 
  cursor: 'pointer',
  marginTop: '10px'
};
