'use client';

/**
 * シンプルなモーダルコンポーネント
 */
export default function Modal({ children, onClose, title }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="app-title">{title}</h2>
          <button className="mini-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
