'use client';

import { updateSettingsAction } from '@/app/actions';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

/**
 * ユーザープロファイル設定用フォーム
 */
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
        <div className="row">
          <div className="col">
            <label className="label">現在のレベル</label>
            <input name="level" type="number" min="1" defaultValue={initialData.level} className="input" />
          </div>
          <div className="col">
            <label className="label">現在の経験値 (XP)</label>
            <input name="xp" type="number" min="0" defaultValue={initialData.xp} className="input" />
          </div>
        </div>

        <div className="input-group">
          <label className="label">レベルアップに必要なXP倍率</label>
          <input name="xpScaling" type="number" min="10" defaultValue={initialData.xpScaling || 100} className="input" />
          <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '4px' }}>※ 次のLvに必要なXP = 現在のレベル × この倍率</p>
        </div>

        <div className="btn-container" style={{ marginTop: '24px' }}>
          <button type="button" onClick={onComplete} className="btn-cancel-form">キャンセル</button>
          <button type="submit" disabled={isSubmitting} className="btn-submit">保存する</button>
        </div>
      </form>
    </Modal>
  );
}
