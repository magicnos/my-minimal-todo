'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteTaskAction, completeTaskAction } from '@/app/actions';

/**
 * ドラッグアンドドロップに対応したタスクカードです。
 */
export default function SortableTaskCard({ 
  task, 
  getTaskStatus, 
  onEdit 
}: { 
  task: any, 
  getTaskStatus: (t: any) => any, 
  onEdit: (t: any) => void 
}) {
  // dnd-kit のフックを使って、この要素を「並び替え可能」にします
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  // ドラッグ中の位置ズレを計算します
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (getTaskStatus(task).isDone ? 0.2 : 1),
    zIndex: isDragging ? 1000 : 1,
  };

  const { isDone, target, current } = getTaskStatus(task);

  return (
    <div ref={setNodeRef} style={{ ...taskCardStyle, ...style }}>
      {/* ドラッグ用のハンドル（つまみ） */}
      <div {...attributes} {...listeners} style={dragHandleStyle}>
        ⣿
      </div>

      <div style={taskContentStyle} onClick={() => onEdit(task)}>
        <div style={taskHeaderStyle}>
          <span style={getPriorityBadgeStyle(task.taskPriority)}>{task.taskPriority}</span>
          {isDone && target > 0 && <span style={doneBadgeStyle}>✅</span>}
        </div>
        <h3 style={taskTitleStyle}>{task.taskTitle}</h3>
        <div style={timeInfoStyle}>
          {task.taskType === 'SINGLE' ? `〆: ${new Date(task.taskDeadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` 
          : task.taskType === 'MULTI_DAY' ? `${['日','月','火','水','木','金','土'][task.habitStartDay]} ${task.habitStartTime} 〜 ${['日','月','火','水','木','金','土'][task.habitEndDay]} ${task.habitEndTime}`
          : '毎日'}
        </div>
        {task.taskType !== 'SINGLE' && target > 0 && <div style={progressStyle}>{current} / {target}</div>}
      </div>
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          task.taskType === 'SINGLE' ? (confirm('削除？') && deleteTaskAction(task.id)) : completeTaskAction(task.id, current);
        }} 
        disabled={isDone} 
        style={completeButtonStyle}
      >
        {isDone ? '●' : '✓'}
      </button>
    </div>
  );
}

// --- デザイン ---
const taskCardStyle: React.CSSProperties = { padding: '12px', borderRadius: '14px', backgroundColor: '#171717', border: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px', touchAction: 'none' };
const dragHandleStyle: React.CSSProperties = { cursor: 'grab', color: '#444', fontSize: '1.2rem', padding: '0 4px', userSelect: 'none' };
const taskContentStyle: React.CSSProperties = { flex: 1, cursor: 'pointer' };
const taskHeaderStyle: React.CSSProperties = { display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' };
const taskTitleStyle: React.CSSProperties = { fontSize: '1rem', fontWeight: 'bold' };
const timeInfoStyle: React.CSSProperties = { fontSize: '0.7rem', opacity: 0.5 };
const progressStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#4dff4d', marginTop: '4px', fontWeight: 'bold' };
const doneBadgeStyle: React.CSSProperties = { fontSize: '0.8rem' };
const getPriorityBadgeStyle = (p: string) => ({ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '3px', backgroundColor: p === 'HIGH' ? '#ff4d4d' : p === 'MEDIUM' ? '#ffa500' : '#4dff4d', color: '#000' });
const completeButtonStyle: React.CSSProperties = { width: '40px', height: '40px', borderRadius: '20px', border: '1px solid #333', backgroundColor: 'transparent', color: '#4dff4d', fontSize: '1.1rem' };
