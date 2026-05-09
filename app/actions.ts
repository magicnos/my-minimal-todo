'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * フォームデータを整理する関数
 */
function extractTaskData(formData: FormData) {
  const taskType = formData.get('taskType') as string;
  const deadlineStr = formData.get('taskDeadline') as string;

  let habitDailySchedule = null;
  if (taskType === 'DAILY') {
    const schedule: any = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = parseInt(formData.get(`dailyCount_${i}`) as string || '0');
    }
    habitDailySchedule = schedule;
  }

  return {
    taskTitle: formData.get('taskTitle') as string,
    taskMemo: (formData.get('taskMemo') as string) || "",
    taskType,
    taskPriority: formData.get('taskPriority') as string,
    taskDeadline: deadlineStr ? new Date(deadlineStr) : null,
    habitDailySchedule,
    habitStartDay: taskType === 'MULTI_DAY' ? parseInt(formData.get('habitStartDay') as string || '0') : null,
    habitStartTime: taskType === 'MULTI_DAY' ? (formData.get('habitStartTime') as string) : null,
    habitEndDay: taskType === 'MULTI_DAY' ? parseInt(formData.get('habitEndDay') as string || '0') : null,
    habitEndTime: taskType === 'MULTI_DAY' ? (formData.get('habitEndTime') as string) : null,
    habitTargetCount: parseInt(formData.get('habitTargetCount') as string || '1'),
  };
}

export async function createTaskAction(formData: FormData) {
  const taskData = extractTaskData(formData);
  const lastTask = await prisma.todoTask.findFirst({ orderBy: { sortOrder: 'desc' } });
  const newSortOrder = lastTask ? lastTask.sortOrder + 1 : 0;
  
  await prisma.todoTask.create({
    data: { ...taskData, sortOrder: newSortOrder }
  });
  revalidatePath('/');
}

export async function updateTaskAction(taskId: number, formData: FormData) {
  const taskData = extractTaskData(formData);
  await prisma.todoTask.update({ where: { id: taskId }, data: taskData });
  revalidatePath('/');
}

/**
 * 【バグ修正】指定された順番通りに sortOrder を振り直します
 */
export async function updateTaskOrderAction(orderedIds: number[]) {
  // 1件ずつ順番に更新します（確実に順番を反映させるため）
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.todoTask.update({
      where: { id: orderedIds[i] },
      data: { sortOrder: i }
    });
  }
  revalidatePath('/');
}

export async function completeTaskAction(taskId: number, currentCount: number) {
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { completedCount: currentCount + 1, lastCompletedAt: new Date() }
  });
  revalidatePath('/');
}

export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}
