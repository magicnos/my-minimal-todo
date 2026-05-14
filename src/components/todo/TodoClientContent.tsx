'use client';

import { useState, useEffect } from 'react';
import TaskCreateForm from './TaskCreateForm';
import RewardCreateForm from './RewardCreateForm';
import SettingsForm from './SettingsForm';
import SortableTaskCard from './SortableTaskCard';
import { updateTaskOrderAction, deleteRewardAction, exchangeRewardAction } from '@/app/actions';
import Tabs from '@/components/ui/Tabs';

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
  const [activeTab, setActiveTab] = useState('HABIT');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRewardFormVisible, setIsRewardFormVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [singleSortMode, setSingleSortMode] = useState<'SORT_ORDER' | 'DEADLINE'>('SORT_ORDER');

  const [localTasks, setLocalTasks] = useState([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));

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

  const xpScaling = userProfile.xpScaling || 100;
  const xpToNextLevel = userProfile.level * xpScaling;
  const xpPercentage = Math.min(100, (userProfile.xp / xpToNextLevel) * 100);

  const handleDragEnd = async (event: DragEndEvent, type: 'HABIT' | 'SINGLE') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const relevantTasks = type === 'HABIT' 
      ? localTasks.filter(t => t.taskType !== 'SINGLE')
      : localTasks.filter(t => t.taskType === 'SINGLE');

    const oldIndex = relevantTasks.findIndex(t => t.id === active.id);
    const newIndex = relevantTasks.findIndex(t => t.id === over.id);

    const newRelevantTasks = arrayMove(relevantTasks, oldIndex, newIndex);
    
    const otherTasks = type === 'HABIT'
      ? localTasks.filter(t => t.taskType === 'SINGLE')
      : localTasks.filter(t => t.taskType !== 'SINGLE');

    const newAllTasks = [...newRelevantTasks, ...otherTasks];
    setLocalTasks(newAllTasks);

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
  const singles = [...localTasks.filter(t => t.taskType === 'SINGLE')].sort((a, b) => {
    if (singleSortMode === 'DEADLINE') {
      return new Date(a.taskDeadline).getTime() - new Date(b.taskDeadline).getTime();
    }
    return 0; // Already sorted by sortOrder in localTasks
  });

  const tabs = [
    { id: 'HABIT', label: '習慣', icon: '🔄' },
    { id: 'SINGLE', label: '一回きり', icon: '📍' },
    { id: 'REWARD', label: 'ご褒美', icon: '🎁' },
  ];

  const handleDeleteReward = async (id: number, title: string) => {
    if (window.confirm(`「${title}」を削除してもよろしいですか？`)) {
      await deleteRewardAction(id);
    }
  };

  return (
    <div style={mainWrapperStyle}>
      <header style={headerStyle}>
        <h1 style={appTitleStyle}>Minimal Todo</h1>
        <button 
          onClick={() => setIsSettingsVisible(true)} 
          style={settingsButtonStyle}
          title="設定"
        >
          ⚙️
        </button>
      </header>

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

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div style={contentContainerStyle}>
        
        {activeTab === 'HABIT' && (
          <section style={columnStyle}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'HABIT')}>
              <SortableContext items={habits.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div style={listStyle}>
                  {habits.map((task) => (
                    <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                  ))}
                  {habits.length === 0 && <div style={emptyStateStyle}>習慣タスクはありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingTask({ taskType: 'DAILY' }); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>
          </section>
        )}

        {activeTab === 'SINGLE' && (
          <section style={columnStyle}>
            <div style={sortButtonContainerStyle}>
              <button 
                onClick={() => setSingleSortMode(m => m === 'SORT_ORDER' ? 'DEADLINE' : 'SORT_ORDER')}
                style={singleSortMode === 'DEADLINE' ? activeSortButtonStyle : sortButtonStyle}
              >
                {singleSortMode === 'DEADLINE' ? '📅 期限の近い順' : '🔢 自由な並び順'}
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'SINGLE')}>
              <SortableContext items={singles.map(t => t.id)} strategy={verticalListSortingStrategy} disabled={singleSortMode === 'DEADLINE'}>
                <div style={listStyle}>
                  {singles.map((task) => (
                    <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                  ))}
                  {singles.length === 0 && <div style={emptyStateStyle}>一回切りタスクはありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingTask({ taskType: 'SINGLE' }); setIsFormVisible(true); }} style={floatingAddButtonStyle}>+</button>
          </section>
        )}

        {activeTab === 'REWARD' && (
          <section style={columnStyle}>
            <div style={listStyle}>
              {rewards.map((reward: any) => (
                <div key={reward.id} style={rewardCardStyle}>
                  <div style={rewardInfoStyle}>
                    <div style={rewardTitleStyle}>{reward.title}</div>
                    <div style={rewardCostStyle}>🪙 {reward.pointsCost} P</div>
                  </div>
                  <div style={rewardActionsStyle}>
                    <button onClick={() => handleDeleteReward(reward.id, reward.title)} style={rewardDeleteButtonStyle}>🗑️</button>
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
              {rewards.length === 0 && <div style={emptyStateStyle}>ご褒美はまだありません</div>}
            </div>
            <button onClick={() => setIsRewardFormVisible(true)} style={floatingAddButtonStyle}>+</button>
          </section>
        )}

      </div>

      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
      {isRewardFormVisible && <RewardCreateForm onComplete={() => setIsRewardFormVisible(false)} />}
      {isSettingsVisible && <SettingsForm onComplete={() => setIsSettingsVisible(false)} initialData={userProfile} />}
    </div>
  );
}

const mainWrapperStyle: React.CSSProperties = { 
  width: '95%',
  maxWidth: '600px', 
  minWidth: '320px',
  margin: '20px auto', 
  padding: '20px', 
  backgroundColor: '#0a0a0a', 
  border: '1px solid #333', 
  borderRadius: '32px', 
  minHeight: '90vh', 
  position: 'relative',
  boxSizing: 'border-box'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  padding: '0 8px'
};

const appTitleStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 'bold',
  color: '#fff',
  margin: 0,
  letterSpacing: '-0.02em'
};

const settingsButtonStyle: React.CSSProperties = {
  backgroundColor: '#171717',
  border: '1px solid #333',
  borderRadius: '12px',
  fontSize: '1.2rem',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease'
};

const statsContainerStyle: React.CSSProperties = { display: 'flex', gap: '24px', backgroundColor: '#171717', padding: '20px', borderRadius: '24px', marginBottom: '24px', alignItems: 'center', border: '1px solid #333' };
const statItemStyle: React.CSSProperties = { textAlign: 'center' };
const statLabelStyle: React.CSSProperties = { fontSize: '0.65rem', opacity: 0.5, fontWeight: 'bold', marginBottom: '4px' };
const statValueStyle: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 'bold' };
const xpContainerStyle: React.CSSProperties = { flex: 1 };
const xpProgressBarBgStyle: React.CSSProperties = { height: '8px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' };
const xpProgressBarFillStyle: React.CSSProperties = { height: '100%', backgroundColor: '#4dff4d', transition: 'width 0.3s ease' };

const contentContainerStyle: React.CSSProperties = { minHeight: '50vh' };
const columnStyle: React.CSSProperties = { width: '100%' };
const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' };
const emptyStateStyle: React.CSSProperties = { textAlign: 'center', padding: '40px 20px', opacity: 0.3, fontSize: '0.9rem' };

const sortButtonContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' };
const sortButtonStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'transparent', color: '#888', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' };
const activeSortButtonStyle: React.CSSProperties = { ...sortButtonStyle, backgroundColor: '#333', color: '#fff', borderColor: '#444' };

const rewardCardStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#171717', borderRadius: '14px', border: '1px solid #333' };
const rewardInfoStyle: React.CSSProperties = { flex: 1, minWidth: 0, marginRight: '8px' };
const rewardTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const rewardCostStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#ffd700', marginTop: '2px' };
const rewardActionsStyle: React.CSSProperties = { display: 'flex', gap: '8px' };
const rewardExchangeButtonStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#4dff4d', color: '#000', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' };
const rewardDeleteButtonStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 };

const floatingAddButtonStyle: React.CSSProperties = { position: 'absolute', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#fff', color: '#000', fontSize: '28px', border: 'none', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' };
