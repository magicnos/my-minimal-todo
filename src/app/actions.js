'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/* ==========================================
   共有ユーティリティ / 内部関数
   ========================================== */

/**
 * フォームデータからタスク情報を抽出
 */
function parseTaskFormData(formData) {
  const taskType = formData.get('taskType');
  const deadline = formData.get('taskDeadline');

  // 毎日タスクの場合、曜日ごとの目標回数を抽出
  let habitDailySchedule = null;
  if (taskType === 'DAILY') {
    habitDailySchedule = {};
    for (let i = 0; i < 7; i++) {
      habitDailySchedule[i] = parseInt(formData.get(`dailyCount_${i}`) || '0');
    }
  }

  return {
    taskTitle: formData.get('taskTitle'),
    taskMemo: formData.get('taskMemo') || "",
    taskType,
    taskPriority: formData.get('taskPriority'),
    taskDeadline: deadline ? new Date(deadline) : null,
    habitDailySchedule,
    habitStartDay: taskType === 'MULTI_DAY' ? parseInt(formData.get('habitStartDay') || '0') : null,
    habitStartTime: taskType === 'MULTI_DAY' ? formData.get('habitStartTime') : null,
    habitEndDay: taskType === 'MULTI_DAY' ? parseInt(formData.get('habitEndDay') || '0') : null,
    habitEndTime: taskType === 'MULTI_DAY' ? formData.get('habitEndTime') : null,
    habitTargetCount: parseInt(formData.get('habitTargetCount') || '1'),
  };
}

/* ==========================================
   タスク関連のアクション
   ========================================== */

/**
 * タスク作成
 */
export async function createTaskAction(formData) {
  const data = parseTaskFormData(formData);
  const last = await prisma.todoTask.findFirst({ orderBy: { sortOrder: 'desc' } });
  
  await prisma.todoTask.create({
    data: { ...data, sortOrder: last ? last.sortOrder + 1 : 0 }
  });
  revalidatePath('/');
}

/**
 * タスク更新
 */
export async function updateTaskAction(taskId, formData) {
  const data = parseTaskFormData(formData);
  await prisma.todoTask.update({ where: { id: taskId }, data });
  revalidatePath('/');
}

/**
 * 並び順の更新
 */
export async function updateTaskOrderAction(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.todoTask.update({
      where: { id: orderedIds[i] },
      data: { sortOrder: i }
    });
  }
  revalidatePath('/');
}

/**
 * タスクの完了処理
 */
export async function completeTaskAction(taskId, currentCount, isCancel = false) {
  const task = await prisma.todoTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  const nextCount = isCancel ? Math.max(0, currentCount - 1) : currentCount + 1;
  
  // 進捗更新
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { completedCount: nextCount, lastCompletedAt: new Date() }
  });

  // 一回きりタスクの削除
  if (!isCancel && task.taskType === 'SINGLE' && nextCount >= 1) {
    await prisma.todoTask.delete({ where: { id: taskId } });
  }

  revalidatePath('/');
}

/**
 * タスク削除
 */
export async function deleteTaskAction(taskId) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}
