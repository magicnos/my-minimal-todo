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

import TaskCreateForm from './TaskCreateForm';
import SettingsForm from './SettingsForm';
import SortableTaskCard from './SortableTaskCard';
import Tabs from '@/components/ui/Tabs';
import LevelUpOverlay from '@/components/ui/LevelUpOverlay';
import { updateTaskOrderAction } from '@/app/actions';
import { useTaskStatus } from '@/hooks/useTaskStatus';

/**
 * メインのクライアントコンポーネント
 */
export default function TodoClientContent({ initialTasks, userProfile }) {
  const [activeTab, setActiveTab] = useState('HABIT');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [lastLevel, setLastLevel] = useState(userProfile.level);
  const [editingTask, setEditingTask] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [singleSortMode, setSingleSortMode] = useState('SORT_ORDER');
  const [localTasks, setLocalTasks] = useState([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));

  const { getTaskStatus } = useTaskStatus(currentTime);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    setLocalTasks([...initialTasks].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [initialTasks]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // レベルアップの検知
  useEffect(() => {
    if (userProfile.level > lastLevel) {
      setIsLevelUp(true);
    }
    setLastLevel(userProfile.level);
  }, [userProfile.level, lastLevel]);

  const xpScaling = userProfile.xpScaling || 100;
  const xpToNextLevel = userProfile.level * xpScaling;
  const xpPercentage = Math.min(100, (userProfile.xp / xpToNextLevel) * 100);

  const handleDragEnd = async (event, type) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const filterFn = type === 'HABIT' ? (t => t.taskType !== 'SINGLE') : (t => t.taskType === 'SINGLE');
    const relevantTasks = localTasks.filter(filterFn);
    const otherTasks = localTasks.filter(t => !filterFn(t));

    const oldIndex = relevantTasks.findIndex(t => t.id === active.id);
    const newIndex = relevantTasks.findIndex(t => t.id === over.id);
    const newRelevantTasks = arrayMove(relevantTasks, oldIndex, newIndex);
    const newAllTasks = [...newRelevantTasks, ...otherTasks];

    setLocalTasks(newAllTasks);
    await updateTaskOrderAction(newAllTasks.map(t => t.id));
  };

  const habits = localTasks.filter(t => t.taskType !== 'SINGLE');
  const singles = [...localTasks.filter(t => t.taskType === 'SINGLE')].sort((a, b) => {
    return singleSortMode === 'DEADLINE' ? new Date(a.taskDeadline).getTime() - new Date(b.taskDeadline).getTime() : 0;
  });

  const tabs = [
    { id: 'HABIT', label: '習慣', icon: '🔄' },
    { id: 'SINGLE', label: '一回きり', icon: '📍' },
  ];

  return (
    <div className="main-wrapper">
      <header className="header">
        <h1 className="app-title">Minimal Todo</h1>
        <button onClick={() => setIsSettingsVisible(true)} className="settings-button" title="設定">⚙️</button>
      </header>

      <div className="stats-container">
        <div className="stat-item">
          <div className="stat-label">LEVEL</div>
          <div className="stat-value">{userProfile.level}</div>
        </div>
        <div className="xp-container">
          <div className="stat-label">XP: {userProfile.xp} / {xpToNextLevel}</div>
          <div className="xp-bar-bg">
            <div className="xp-bar-fill" style={{ width: `${xpPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="content-container">
        {activeTab === 'HABIT' && (
          <section className="column">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'HABIT')}>
              <SortableContext items={habits.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="task-list">
                  {habits.map((task) => (
                    <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                  ))}
                  {habits.length === 0 && <div className="empty-state">習慣タスクはありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingTask({ taskType: 'DAILY' }); setIsFormVisible(true); }} className="floating-add-button">+</button>
          </section>
        )}

        {activeTab === 'SINGLE' && (
          <section className="column">
            <div className="sort-container">
              <button onClick={() => setSingleSortMode(m => m === 'SORT_ORDER' ? 'DEADLINE' : 'SORT_ORDER')} className={`sort-button ${singleSortMode === 'DEADLINE' ? 'active' : ''}`}>
                {singleSortMode === 'DEADLINE' ? '📅 期限順' : '🔢 自由順'}
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'SINGLE')}>
              <SortableContext items={singles.map(t => t.id)} strategy={verticalListSortingStrategy} disabled={singleSortMode === 'DEADLINE'}>
                <div className="task-list">
                  {singles.map((task) => (
                    <SortableTaskCard key={task.id} task={task} getTaskStatus={getTaskStatus} onEdit={(t) => { setEditingTask(t); setIsFormVisible(true); }} />
                  ))}
                  {singles.length === 0 && <div className="empty-state">タスクはありません</div>}
                </div>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setEditingTask({ taskType: 'SINGLE' }); setIsFormVisible(true); }} className="floating-add-button">+</button>
          </section>
        )}
      </div>

      {isFormVisible && <TaskCreateForm onComplete={() => { setIsFormVisible(false); setEditingTask(null); }} editTaskData={editingTask} />}
      {isSettingsVisible && <SettingsForm onComplete={() => setIsSettingsVisible(false)} initialData={userProfile} />}
      {isLevelUp && <LevelUpOverlay level={userProfile.level} onComplete={() => setIsLevelUp(false)} />}
    </div>
  );
}
