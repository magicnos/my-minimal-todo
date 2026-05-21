'use client';

import { useState, useEffect } from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// 自作コンポーネントとアクション
import TaskCreateForm from './TaskCreateForm';
import RewardCreateForm from './RewardCreateForm';
import SettingsForm from './SettingsForm';
import SortableTaskCard from './SortableTaskCard';
import SortableRewardCard from './SortableRewardCard';
import Tabs from '@/components/ui/Tabs';
import { 
  updateTaskOrderAction, 
  deleteRewardAction, 
  exchangeRewardAction, 
  updateRewardOrderAction 
} from '@/app/actions';

// カスタムフックとスタイル
import { useTaskStatus } from '@/hooks/useTaskStatus';
import { styles } from './todoStyles';

/**
 * Todoアプリのメインクライアントコンポーネント
 * タスク一覧、報酬、レベル表示などの状態管理と描画を担当します。
 */
export default function TodoClientContent({ initialTasks, userProfile, rewards: initialRewards }) {
  // --- 状態管理 (State) ---
  const [activeTab, setActiveTab] = useState('HABIT');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isRewardFormVisible, setIsRewardFormVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [singleSortMode, setSingleSortMode] = useState('SORT_ORDER');

  const [localTasks, setLocalTasks] = useState([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));
  const [localRewards, setLocalRewards] = useState([...initialRewards].sort((a, b) => a.sortOrder - b.sortOrder));

  // --- カスタムフック (Hooks) ---
  const { getTaskStatus } = useTaskStatus(currentTime);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- 効果 (Effects) ---
  useEffect(() => {
    setLocalTasks([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [initialTasks]);

  useEffect(() => {
    setLocalRewards([...initialRewards].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [initialRewards]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // --- レベル・XP計算 ---
  const xpScaling = userProfile.xpScaling || 100;
  const xpToNextLevel = userProfile.level * xpScaling;
  const xpPercentage = Math.min(100, (userProfile.xp / xpToNextLevel) * 100);

  // --- イベントハンドラ (Handlers) ---
  
  // ドラッグ＆ドロップ終了時の処理
  const handleDragEnd = async (event, type) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (type === 'REWARD') {
      const oldIndex = localRewards.findIndex(r => r.id === active.id);
      const newIndex = localRewards.findIndex(r => r.id === over.id);
      const newRewards = arrayMove(localRewards, oldIndex, newIndex);
      setLocalRewards(newRewards);
      await updateRewardOrderAction(newRewards.map(r => r.id));
      return;
    }

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

  const handleDeleteReward = async (id, title) => {
    if (window.confirm(`「${title}」を削除してもよろしいですか？`)) {
      await deleteRewardAction(id);
    }
  };

  // --- データのフィルタリングとソート ---
  const habits = localTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = [...localTasks.filter(t => t.taskType === 'SINGLE')].sort((a, b) => {
    if (singleSortMode === 'DEADLINE') {
      return new Date(a.taskDeadline).getTime() - new Date(b.taskDeadline).getTime();
    }
    return 0;
  });

  const tabs = [
    { id: 'HABIT', label: '習慣', icon: '🔄' },
    { id: 'SINGLE', label: '一回きり', icon: '📍' },
    { id: 'REWARD', label: 'ご褒美', icon: '🎁' },
  ];

  // --- レンダリング (Render) ---
  return (
    <div style={styles.mainWrapper}>
      <header style={styles.header}>
        <h1 style={styles.appTitle}>Minimal Todo</h1>
        <button onClick={() => setIsSettingsVisible(true)} style={styles.settingsButton} title="設定">⚙️</button>
      </header>

      {/* ステータスバー (レベル、XP、ポイント) */}
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>LEVEL</div>
          <div style={styles.statValue}>{userProfile.level}</div>
        </div>
        <div style={styles.xpContainer}>
          <div style={styles.statLabel}>XP: {userProfile.xp} / {xpToNextLevel}</div>
          <div style={styles.xpProgressBarBg}>
            <div style={{ ...styles.xpProgressBarFill, width: `${xpPercentage}%` }}></div>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>POINTS</div>
          <div style={styles.statValue}>🪙 {userProfile.points}</div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div style={styles.contentContainer}>
        
        {/* 習慣タブ */}
        {activeTab === 'HABIT' && (
          <section style={styles.column}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'HABIT')}>
              <SortableContext items={habits.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div style={styles.list}>
                  {habits.map((task) => (
                    <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                  ))}
                  {habits.length === 0 && <div style={styles.emptyState}>習慣タスクはありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingTask({ taskType: 'DAILY' }); setIsFormVisible(true); }} style={styles.floatingAddButton}>+</button>
          </section>
        )}

        {/* 一回きりタブ */}
        {activeTab === 'SINGLE' && (
          <section style={styles.column}>
            <div style={styles.sortButtonContainer}>
              <button 
                onClick={() => setSingleSortMode(m => m === 'SORT_ORDER' ? 'DEADLINE' : 'SORT_ORDER')}
                style={singleSortMode === 'DEADLINE' ? { ...styles.sortButton, ...styles.activeSortButton } : styles.sortButton}
              >
                {singleSortMode === 'DEADLINE' ? '📅 期限の近い順' : '🔢 自由な並び順'}
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'SINGLE')}>
              <SortableContext items={singles.map(t => t.id)} strategy={verticalListSortingStrategy} disabled={singleSortMode === 'DEADLINE'}>
                <div style={styles.list}>
                  {singles.map((task) => (
                    <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                  ))}
                  {singles.length === 0 && <div style={styles.emptyState}>一回切りタスクはありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingTask({ taskType: 'SINGLE' }); setIsFormVisible(true); }} style={styles.floatingAddButton}>+</button>
          </section>
        )}

        {/* ご褒美タブ */}
        {activeTab === 'REWARD' && (
          <section style={styles.column}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'REWARD')}>
              <SortableContext items={localRewards.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div style={styles.list}>
                  {localRewards.map((reward) => (
                    <SortableRewardCard 
                      key={reward.id} 
                      reward={reward} 
                      userPoints={userProfile.points}
                      onEdit={(r) => { setEditingReward(r); setIsRewardFormVisible(true); }}
                      onDelete={handleDeleteReward}
                      onExchange={async (id) => {
                        const res = await exchangeRewardAction(id);
                        if (!res.success) alert(res.error);
                        else alert(`「${res.title}」を交換しました！`);
                      }}
                    />
                  ))}
                  {localRewards.length === 0 && <div style={styles.emptyState}>ご褒美はまだありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingReward(null); setIsRewardFormVisible(true); }} style={styles.floatingAddButton}>+</button>
          </section>
        )}

      </div>

      {/* モーダルフォーム群 */}
      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
      {isRewardFormVisible && <RewardCreateForm onComplete={() => { setIsRewardFormVisible(false); setEditingReward(null); }} editData={editingReward} />}
      {isSettingsVisible && <SettingsForm onComplete={() => setIsSettingsVisible(false)} initialData={userProfile} />}
    </div>
  );
}
