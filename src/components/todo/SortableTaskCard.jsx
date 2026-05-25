'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteTaskAction, completeTaskAction } from '@/app/actions';

/**
 * ドラッグアンドドロップに対応したタスクカード
 */
export default function SortableTaskCard({ task, getTaskStatus, onEdit }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const { isDone, target, current } = getTaskStatus(task);
  const isExpired = task.taskType === 'SINGLE' && new Date(task.taskDeadline) < new Date() && !isDone;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isDone ? 0.4 : 1),
    zIndex: isDragging ? 1000 : 1,
    borderColor: isExpired ? '#ff4d4d' : undefined,
    boxShadow: isExpired ? '0 0 10px rgba(255, 77, 77, 0.3)' : undefined,
  };

  const handleComplete = async (e) => {
    e.stopPropagation();
    if (task.taskType === 'SINGLE') {
      if (!confirm(`「${task.taskTitle}」を達成にしてもよろしいですか？`)) return;
    }
    await completeTaskAction(task.id, current);
  };

  const priorityClass = `priority-${task.taskPriority.toLowerCase()}`;

  return (
    <div ref={setNodeRef} className="task-card" style={style}>
      <div {...attributes} {...listeners} className="drag-handle">⣿</div>

      <div className="task-content" onClick={() => onEdit(task)}>
        <div className="task-header">
          <span className={`priority-badge ${priorityClass}`}>{task.taskPriority}</span>
          {task.taskType !== 'SINGLE' && (
            <span className="progress-info">{current}/{target > 0 ? target : '-'}</span>
          )}
          <span className="reward-badge">{task.rewardXP}XP</span>
          {isDone && target > 0 && <span>✅</span>}
        </div>
        <h3 className="task-title">{task.taskTitle}</h3>
        <div className="task-time">
          {task.taskType === 'SINGLE' ? `〆: ${new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` 
          : task.taskType === 'MULTI_DAY' ? `${['日','月','火','水','木','金','土'][task.habitStartDay]} ${task.habitStartTime} 〜 ${['日','月','火','水','木','金','土'][task.habitEndDay]} ${task.habitEndTime}`
          : '毎日'}
        </div>
      </div>
      
      <div className="task-actions">
        {task.taskType !== 'SINGLE' && current > 0 && (
          <button className="btn-action btn-cancel" onClick={(e) => { e.stopPropagation(); if (confirm('達成をキャンセルしますか？')) completeTaskAction(task.id, current, true); }}>↩️</button>
        )}
        <button className="btn-action btn-delete" onClick={(e) => { e.stopPropagation(); if (confirm('削除しますか？')) deleteTaskAction(task.id); }}>🗑️</button>
        <button className={`btn-complete ${isDone ? 'done' : ''}`} onClick={handleComplete}>✓</button>
      </div>
    </div>
  );
}
