'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * ドラッグアンドドロップに対応したご褒美カードです。
 */
export default function SortableRewardCard({ 
  reward, 
  userPoints,
  onEdit,
  onDelete,
  onExchange
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: reward.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const cardStyle = {
    ...rewardCardStyle,
    ...style,
  };

  return (
    <div ref={setNodeRef} style={cardStyle}>
      {/* ドラッグ用のハンドル */}
      <div {...attributes} {...listeners} style={dragHandleStyle}>
        ⣿
      </div>

      <div style={rewardInfoStyle} onClick={() => onEdit(reward)}>
        <div style={rewardTitleStyle}>{reward.title}</div>
        <div style={rewardCostStyle}>🪙 {reward.pointsCost} P</div>
      </div>
      
      <div style={rewardActionsStyle}>
        <button onClick={() => onDelete(reward.id, reward.title)} style={rewardDeleteButtonStyle}>🗑️</button>
        <button 
          onClick={() => onExchange(reward.id)} 
          style={rewardExchangeButtonStyle}
          disabled={userPoints < reward.pointsCost}
        >
          交換
        </button>
      </div>
    </div>
  );
}

const rewardCardStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '12px', 
  backgroundColor: '#171717', 
  borderRadius: '14px', 
  border: '1px solid #333',
  gap: '10px'
};

const dragHandleStyle = { 
  cursor: 'grab', 
  color: '#444', 
  fontSize: '1.2rem', 
  padding: '0 4px', 
  userSelect: 'none', 
  touchAction: 'none' 
};

const rewardInfoStyle = { 
  flex: 1, 
  minWidth: 0, 
  cursor: 'pointer' 
};

const rewardTitleStyle = { 
  fontSize: '1rem', 
  fontWeight: 'bold', 
  whiteSpace: 'nowrap', 
  overflow: 'hidden', 
  textOverflow: 'ellipsis' 
};

const rewardCostStyle = { 
  fontSize: '0.75rem', 
  color: '#ffd700', 
  marginTop: '2px' 
};

const rewardActionsStyle = { 
  display: 'flex', 
  gap: '8px' 
};

const rewardExchangeButtonStyle = { 
  padding: '6px 12px', 
  borderRadius: '6px', 
  border: 'none', 
  backgroundColor: '#4dff4d', 
  color: '#000', 
  fontSize: '0.75rem', 
  fontWeight: 'bold', 
  cursor: 'pointer' 
};

const rewardDeleteButtonStyle = { 
  backgroundColor: 'transparent', 
  border: 'none', 
  cursor: 'pointer', 
  fontSize: '0.8rem', 
  opacity: 0.5 
};
