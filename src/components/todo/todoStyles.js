/**
 * アプリ全体のスタイル定義
 * 構造を理解しやすくするため、一つのファイルにまとめています。
 */

export const styles = {
  mainWrapper: { 
    width: '100%',
    maxWidth: '600px', 
    margin: '0 auto', 
    padding: '12px', 
    backgroundColor: '#0a0a0a', 
    border: '1px solid #333', 
    borderRadius: '0px', 
    minHeight: '100vh', 
    position: 'relative',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '0 8px'
  },
  appTitle: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#fff',
    margin: 0,
    letterSpacing: '-0.02em'
  },
  settingsButton: {
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
  },
  statsContainer: { 
    display: 'flex', 
    gap: '12px', 
    backgroundColor: '#171717', 
    padding: '12px', 
    borderRadius: '20px', 
    marginBottom: '20px', 
    alignItems: 'center', 
    border: '1px solid #333',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statItem: { textAlign: 'center', flex: '0 1 auto' },
  statLabel: { fontSize: '0.6rem', opacity: 0.5, fontWeight: 'bold', marginBottom: '2px' },
  statValue: { fontSize: '0.9rem', fontWeight: 'bold' },
  xpContainer: { flex: '1 1 100%', order: 3, marginTop: '4px' },
  xpProgressBarBg: { height: '8px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' },
  xpProgressBarFill: { height: '100%', backgroundColor: '#4dff4d', transition: 'width 0.3s ease' },
  contentContainer: { minHeight: '50vh' },
  column: { width: '100%' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' },
  emptyState: { textAlign: 'center', padding: '40px 20px', opacity: 0.3, fontSize: '0.9rem' },
  sortButtonContainer: { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' },
  sortButton: { padding: '6px 12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: 'transparent', color: '#888', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' },
  activeSortButton: { backgroundColor: '#333', color: '#fff', borderColor: '#444' },
  floatingAddButton: { position: 'absolute', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '32px', backgroundColor: '#fff', color: '#000', fontSize: '28px', border: 'none', cursor: 'pointer', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }
};
