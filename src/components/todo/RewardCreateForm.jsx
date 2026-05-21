'use client';

import { createRewardAction, updateRewardAction } from '@/app/actions';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

export default function RewardCreateForm({ onComplete, editData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Modal onClose={onComplete} title={editData ? "ご褒美の編集" : "ご褒美の追加"}>
      <form action={async (formData) => {
        setIsSubmitting(true);
        if (editData) {
          await updateRewardAction(editData.id, formData);
        } else {
          await createRewardAction(formData);
        }
        setIsSubmitting(false);
        onComplete();
      }}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>ご褒美の名称</label>
          <input name="title" type="text" required defaultValue={editData?.title} style={inputStyle} />
        </div>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>必要ポイント</label>
          <input name="pointsCost" type="number" required min="0" defaultValue={editData?.pointsCost ?? 0} style={inputStyle} />
        </div>
        <div style={buttonContainerStyle}>
          <button type="button" onClick={onComplete} style={cancelButtonStyle}>キャンセル</button>
          <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>{editData ? "更新する" : "追加する"}</button>
        </div>
      </form>
    </Modal>
  );
}

const inputGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' };
const buttonContainerStyle = { display: 'flex', gap: '12px', marginTop: '30px' };
const submitButtonStyle = { flex: 2, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#ededed', color: '#0a0a0a', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
const cancelButtonStyle = { flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #333', backgroundColor: 'transparent', color: '#fff', fontSize: '1rem', cursor: 'pointer' };
