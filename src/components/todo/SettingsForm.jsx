'use client';

import { updateSettingsAction } from '@/app/actions';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

export default function SettingsForm({ onComplete, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Modal onClose={onComplete} title="各種設定">
      <form action={async (formData) => {
        setIsSubmitting(true);
        await updateSettingsAction(formData);
        setIsSubmitting(false);
        onComplete();
      }}>
        <div style={rowStyle}>
          <div style={halfInputStyle}>
            <label style={labelStyle}>現在のレベル</label>
            <input name="level" type="number" min="1" defaultValue={initialData.level} style={inputStyle} />
          </div>
          <div style={halfInputStyle}>
            <label style={labelStyle}>現在の経験値 (XP)</label>
            <input name="xp" type="number" min="0" defaultValue={initialData.xp} style={inputStyle} />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>現在のポイント</label>
          <input name="points" type="number" min="0" defaultValue={initialData.points} style={inputStyle} />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>レベルアップ倍率 (1Lvあたり必要なXP)</label>
          <input name="xpScaling" type="number" min="10" defaultValue={initialData.xpScaling || 100} style={inputStyle} />
          <p style={helpTextStyle}>※ 次のLvに必要なXP = 現在のレベル × この倍率</p>
        </div>

        <div style={buttonContainerStyle}>
          <button type="button" onClick={onComplete} style={cancelButtonStyle}>キャンセル</button>
          <button type="submit" disabled={isSubmitting} style={submitButtonStyle}>保存する</button>
        </div>
      </form>
    </Modal>
  );
}

const inputGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' };
const rowStyle = { display: 'flex', gap: '12px', marginBottom: '20px' };
const halfInputStyle = { flex: 1 };
const helpTextStyle = { fontSize: '0.75rem', opacity: 0.5, marginTop: '6px' };
const buttonContainerStyle = { display: 'flex', gap: '12px', marginTop: '30px' };
const submitButtonStyle = { flex: 2, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#ededed', color: '#0a0a0a', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };
const cancelButtonStyle = { flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #333', backgroundColor: 'transparent', color: '#fff', fontSize: '1rem', cursor: 'pointer' };
