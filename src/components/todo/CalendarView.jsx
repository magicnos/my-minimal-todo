'use client';

import { useState } from 'react';
import { styles } from './todoStyles';
import Modal from '@/components/ui/Modal';
import CalendarEventForm from './CalendarEventForm';
import { deleteCalendarEventAction } from '@/app/actions';

export default function CalendarView({ tasks, events }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEventFormVisible, setIsEventFormVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // カレンダー描画用の計算
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(1 - firstDayOfMonth.getDay()); // 日曜日始まり

  const days = [];
  const tempDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(tempDate));
    tempDate.setDate(tempDate.getDate() + 1);
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 特定の日のタスクとイベントを取得
  const getDayData = (date) => {
    const dStr = date.toDateString();
    
    // TODOタスクの判定
    const dayTasks = tasks.filter(task => {
      if (task.taskType === 'DAILY') {
        const count = task.habitDailySchedule?.[date.getDay()] || 0;
        return count > 0;
      }
      if (task.taskType === 'SINGLE' && task.taskDeadline) {
        return new Date(task.taskDeadline).toDateString() === dStr;
      }
      // MULTI_DAY は現在の実装だと単純に週次なので、とりあえず常に表示か判定が必要
      // ここでは簡略化のため DAILY と SINGLE のみをドット表示対象にする
      return false;
    });

    // カレンダーイベントの判定
    const dayEvents = events.filter(event => 
      new Date(event.date).toDateString() === dStr
    );

    return { tasks: dayTasks, events: dayEvents };
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`予定「${title}」を削除しますか？`)) {
      await deleteCalendarEventAction(id);
    }
  };

  return (
    <div style={styles.calendarContainer}>
      <div style={styles.calendarHeader}>
        <button onClick={prevMonth} style={styles.navButton}>&lt;</button>
        <div style={styles.monthTitle}>{year}年 {month + 1}月</div>
        <button onClick={nextMonth} style={styles.navButton}>&gt;</button>
      </div>

      <div style={styles.calendarGrid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(label => (
          <div key={label} style={styles.weekdayLabel}>{label}</div>
        ))}
        {days.map((date, idx) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === new Date().toDateString();
          const { tasks: dayTasks, events: dayEvents } = getDayData(date);
          
          return (
            <div 
              key={idx} 
              style={{
                ...styles.dayCell,
                ...(isToday ? styles.todayCell : {}),
                ...(!isCurrentMonth ? styles.otherMonthCell : {}),
              }}
              onClick={() => setSelectedDate(date)}
            >
              {date.getDate()}
              <div style={styles.dotContainer}>
                {dayTasks.length > 0 && <div style={{...styles.dot, ...styles.taskDot}} />}
                {dayEvents.length > 0 && <div style={{...styles.dot, ...styles.eventDot}} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* 日付詳細モーダル */}
      {selectedDate && (
        <Modal 
          title={`${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日の予定`}
          onClose={() => setSelectedDate(null)}
        >
          <div style={styles.dayDetailList}>
            <div style={styles.dayDetailSection}>
              <h3 style={styles.sectionTitle}>TODOタスク</h3>
              {getDayData(selectedDate).tasks.length > 0 ? (
                getDayData(selectedDate).tasks.map(task => (
                  <div key={task.id} style={styles.miniCard}>
                    <div style={styles.miniCardInfo}>
                      <div style={styles.miniCardTitle}>{task.taskTitle}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{...styles.emptyState, padding: '10px'}}>タスクはありません</div>
              )}
            </div>

            <div style={styles.dayDetailSection}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={styles.sectionTitle}>予定</h3>
                <button 
                  onClick={() => {
                    setEditingEvent({ date: selectedDate });
                    setIsEventFormVisible(true);
                  }}
                  style={{...styles.sortButton, marginBottom: '8px'}}
                >
                  + 追加
                </button>
              </div>
              {getDayData(selectedDate).events.length > 0 ? (
                getDayData(selectedDate).events.map(event => (
                  <div key={event.id} style={styles.miniCard}>
                    <div 
                      style={styles.miniCardInfo} 
                      onClick={() => {
                        setEditingEvent(event);
                        setIsEventFormVisible(true);
                      }}
                    >
                      <div style={styles.miniCardTitle}>{event.title}</div>
                      {(event.startTime || event.endTime) && (
                        <div style={styles.miniCardTime}>
                          {event.startTime || '--:--'} 〜 {event.endTime || '--:--'}
                        </div>
                      )}
                    </div>
                    <div 
                      style={styles.deleteIcon} 
                      onClick={() => handleDeleteEvent(event.id, event.title)}
                    >
                      🗑️
                    </div>
                  </div>
                ))
              ) : (
                <div style={{...styles.emptyState, padding: '10px'}}>予定はありません</div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 予定作成・編集フォーム */}
      {isEventFormVisible && (
        <CalendarEventForm 
          onComplete={() => {
            setIsEventFormVisible(false);
            setEditingEvent(null);
          }} 
          editData={editingEvent} 
        />
      )}
    </div>
  );
}
