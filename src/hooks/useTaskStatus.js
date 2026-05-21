import { useState, useEffect } from 'react';

/**
 * タスクの状態（完了・未完了・ターゲット数）を計算するフック
 */
export function useTaskStatus(currentTime) {
  const getTaskStatus = (task) => {
    // 一回きりタスクの場合
    if (task.taskType === 'SINGLE') {
      return { 
        isDone: task.completedCount >= 1, 
        target: 1, 
        current: task.completedCount 
      };
    }

    let target = task.habitTargetCount || 1;
    let effectiveCount = task.completedCount;
    const lastDone = task.lastCompletedAt ? new Date(task.lastCompletedAt) : null;

    // 毎日リセットされるタスクの場合
    if (task.taskType === 'DAILY') {
      const currentDay = currentTime.getDay();
      target = task.habitDailySchedule?.[currentDay] || 0;
      // 最後に行った日が今日でなければ、カウントを0として扱う（表示上のみ）
      if (lastDone && lastDone.toDateString() !== currentTime.toDateString()) {
        effectiveCount = 0;
      }
    } 
    // 数日おきや特定の周期でリセットされるタスクの場合
    else if (task.taskType === 'MULTI_DAY') {
      const periodMs = 7 * 86400000;
      const createdAt = new Date(task.createdAt);
      const cycleStart = createdAt.getTime() + Math.floor((currentTime.getTime() - createdAt.getTime()) / periodMs) * periodMs;
      // 最後の完了が現在のサイクルより前なら、カウントを0として扱う
      if (lastDone && lastDone.getTime() < cycleStart) {
        effectiveCount = 0;
      }
    }

    if (target === 0) return { isDone: true, target: 0, current: 0 };
    return { isDone: effectiveCount >= target, target, current: effectiveCount };
  };

  return { getTaskStatus };
}
