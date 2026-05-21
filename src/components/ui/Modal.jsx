'use client';

import React from 'react';

export default function Modal({ children, onClose, title }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={formCardStyle} onClick={(e) => e.stopPropagation()}>
        {title && <h2 style={formTitleStyle}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

const overlayStyle = { 
  position: 'fixed', 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0, 
  backgroundColor: 'rgba(0,0,0,0.8)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', // 画面真ん中に変更
  zIndex: 1000,
  padding: '20px',
  boxSizing: 'border-box'
};

const formCardStyle = { 
  backgroundColor: '#171717', 
  width: '100%', 
  maxWidth: '500px', 
  padding: '24px', 
  borderRadius: '24px', // 下部固定ではないので四隅を丸く
  maxHeight: '90vh', 
  overflowY: 'auto',
  position: 'relative',
  border: '1px solid #333'
};

const formTitleStyle = { 
  marginBottom: '20px', 
  fontSize: '1.2rem', 
  fontWeight: 'bold' 
};
