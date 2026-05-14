'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import SortableTaskCard from './SortableTaskCard';
import { updateTaskOrderAction, createRewardAction, deleteRewardAction, exchangeRewardAction } from '@/app/actions';

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export default function TodoClientContent({ initialTasks, userProfile, rewards }: { initialTasks: any[], userProfile: any, rewards: any[] }) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // ローカルでの表示用リスト（ソート順に基づいた全件）
  const [localTasks, setLocalTasks] = useState([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));

  // サーバーの初期データが変わった時に反映（ただしドラッグ中などは無視されるようにします）
  useEffect(() => {
    setLocalTasks([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [initialTasks]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const xpToNextLevel = userProfile.level * 100;
  const xpPercentage = Math.min(100, (userProfile.xp / xpToNextLevel) * 100);

  /**
   * ドラッグ終了時の処理
   */
  const handleDragEnd = async (event: DragEndEvent, type: 'HABIT' | 'SINGLE') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 現在表示されている対象のリスト（習慣または一回きり）
    const relevantTasks = type === 'HABIT' 
      ? localTasks.filter(t => t.taskType !== 'SINGLE')
      : localTasks.filter(t => t.taskType === 'SINGLE');

    const oldIndex = relevantTasks.findIndex(t => t.id === active.id);
    const newIndex = relevantTasks.findIndex(t => t.id === over.id);

    // 見た目のリストを入れ替え
    const newRelevantTasks = arrayMove(relevantTasks, oldIndex, newIndex);
    
    // 全体のリストを再構築（動かしていない方のリストと合体させる）
    const otherTasks = type === 'HABIT'
      ? localTasks.filter(t => t.taskType === 'SINGLE')
      : localTasks.filter(t => t.taskType !== 'SINGLE');

    const newAllTasks = [...newRelevantTasks, ...otherTasks];
    setLocalTasks(newAllTasks);

    // データベースには「表示されている順番全体」のIDリストを送る
    await updateTaskOrderAction(newAllTasks.map(t => t.id));
  };

  const getTaskStatus = (task: any) => {
    if (task.taskType === 'SINGLE') return { isDone: false, target: 1, current: 0 };
    let target = task.habitTargetCount || 1;
    let effectiveCount = task.completedCount;
    const lastDone = task.lastCompletedAt ? new Date(task.lastCompletedAt) : null;
    if (task.taskType === 'DAILY') {
      const currentDay = currentTime.getDay();
      target = task.habitDailySchedule?.[currentDay] || 0;
      if (lastDone && lastDone.toDateString() !== currentTime.toDateString()) effectiveCount = 0;
    } else if (task.taskType === 'MULTI_DAY') {
      const periodMs = 7 * 86400000;
      const createdAt = new Date(task.createdAt);
      const cycleStart = createdAt.getTime() + Math.floor((currentTime.getTime() - createdAt.getTime()) / periodMs) * periodMs;
      if (lastDone && lastDone.getTime() < cycleStart) effectiveCount = 0;
    }
    if (target === 0) return { isDone: true, target: 0, current: 0 };
    return { isDone: effectiveCount >= target, target, current: effectiveCount };
  };

  const habits = localTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = localTasks.filter(t => t.taskType === 'SINGLE');

  return (
    <>
      <div style={statsContainerStyle}>
        <div style={statItemStyle}>
          <div style={statLabelStyle}>LEVEL</div>
          <div style={statValueStyle}>{userProfile.level}</div>
        </div>
        <div style={xpContainerStyle}>
          <div style={statLabelStyle}>XP: {userProfile.xp} / {xpToNextLevel}</div>
          <div style={xpProgressBarBgStyle}>
            <div style={{ ...xpProgressBarFillStyle, width: `${xpPercentage}%` }}></div>
          </div>
        </div>
        <div style={statItemStyle}>
          <div style={statLabelStyle}>POINTS</div>
          <div style={statValueStyle}>🪙 {userProfile.points}</div>
        </div>
      </div>

      <div style={columnsContainerStyle}>
        
        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🔄 習慣</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'HABIT')}>
            <SortableContext items={habits.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div style={listStyle}>
                {habits.map((task) => (
                  <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>📍 一回きり</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'SINGLE')}>
            <SortableContext items={singles.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div style={listStyle}>
                {singles.map((task) => (
                  <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        <section style={columnStyle}>
          <h2 style={sectionTitleStyle}>🎁 ご褒美</h2>
          <div style={rewardSectionStyle}>
            <form action={createRewardAction} style={rewardFormStyle}>
              <input name="title" placeholder="ご褒美の名称" required style={rewardInputStyle} />
              <input name="pointsCost" type="number" placeholder="必要P" required style={rewardPointsInputStyle} />
              <button type="submit" style={rewardAddButtonStyle}>+</button>
            </form>
            <div style={rewardListStyle}>
              {rewards.map((reward: any) => (
                <div key={reward.id} style={rewardCardStyle}>
                  <div style={rewardInfoStyle}>
                    <div style={rewardTitleStyle}>{reward.title}</div>
                    <div style={rewardCostStyle}>🪙 {reward.pointsCost} P</div>
                  </div>
                  <div style={rewardActionsStyle}>
                    <button onClick={() => deleteRewardAction(reward.id)} style={rewardDeleteButtonStyle}>🗑️</button>
                    <button 
                      onClick={async () => {
                        const res = await exchangeRewardAction(reward.id);
                        if (!res.success) alert(res.error);
                        else alert('交換しました！');
                      }} 
                      style={rewardExchangeButtonStyle}
                      disabled={userProfile.points < reward.pointsCost}
                    >
                      交換
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <button onClick={() => { setEditingTask(null); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>
      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
    </>
  );
}

const statsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', backgroundColor: '#171717', padding: '20px', borderRadius: '16px', marginBottom: '32px', alignItems: 'center', border: '1px solid #333' };
const statItemStyle: React.CSSProperties = { textAlign: 'center' };
const statLabelStyle: React.CSSProperties = { fontSize: '0.65rem', opacity: 0.5, fontWeight: 'bold', marginBottom: '4px' };
const statValueStyle: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 'bold' };
const xpContainerStyle: React.CSSProperties = { flex: 1 };
const xpProgressBarBgStyle: React.CSSProperties = { height: '8px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' };
const xpProgressBarFillStyle: React.CSSProperties = { height: '100%', backgroundColor: '#4dff4d', transition: 'width 0.3s ease' };

const columnsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', flexWrap: 'wrap' };
const columnStyle: React.CSSProperties = { flex: '1', minWidth: '320px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '0.85rem', opacity: 0.5, marginBottom: '16px', fontWeight: 'bold' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' };

const rewardSectionStyle: React.CSSProperties = { backgroundColor: '#171717', padding: '16px', borderRadius: '16px', border: '1px solid #333' };
const rewardFormStyle: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '16px' };
const rewardInputStyle: React.CSSProperties = { flex: 2, padding: '8px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '0.85rem' };
const rewardPointsInputStyle: React.CSSProperties = { flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#0a0a0a', color: '#fff', fontSize: '0.85rem', width: '60px' };
const rewardAddButtonStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#ededed', color: '#0a0a0a', fontWeight: 'bold', cursor: 'pointer' };
const rewardListStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const rewardCardStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#222', borderRadius: '10px' };
const rewardInfoStyle: React.CSSProperties = { flex: 1 };
const rewardTitleStyle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 'bold' };
const rewardCostStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#ffd700' };
const rewardActionsStyle: React.CSSProperties = { display: 'flex', gap: '8px' };
const rewardExchangeButtonStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#4dff4d', color: '#000', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' };
const rewardDeleteButtonStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 };

const floatingAddButtonStyle: React.CSSProperties = { position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#fff', color: '#000', fontSize: '28px', border: 'none', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
