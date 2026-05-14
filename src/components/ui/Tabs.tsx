'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div style={tabsContainerStyle}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            ...tabButtonStyle,
            backgroundColor: activeTab === tab.id ? '#333' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#888',
          }}
        >
          {tab.icon && <span style={tabIconStyle}>{tab.icon}</span>}
          <span style={tabLabelStyle}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#171717',
  padding: '8px',
  borderRadius: '16px',
  marginBottom: '24px',
  border: '1px solid #333',
  position: 'sticky',
  top: '10px',
  zIndex: 10,
  maxWidth: '600px',
  margin: '0 auto 24px auto',
};

const tabButtonStyle: React.CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 4px',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  gap: '6px',
};

const tabIconStyle: React.CSSProperties = {
  fontSize: '1.2rem',
};

const tabLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 'bold',
};
