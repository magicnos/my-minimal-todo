'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * フォームデータから共通のタスク情報を取り出す
 */
function getTaskDataFromForm(formData: FormData) {
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskType = formData.get('taskType') as string;
  const taskPriority = formData.get('taskPriority') as string;
  
  // 日付の文字列を Date オブジェクトに変換（クライアントから ISO 形式で来る想定）
  const startTimeStr = formData.get('taskStartTime') as string;
  const deadlineStr = formData.get('taskDeadline') as string;
  
  const taskStartTime = startTimeStr ? new Date(startTimeStr) : null;
  const taskDeadline = new Date(deadlineStr);

  // 習慣設定
  let habitPeriodDays = null;
  let habitTargetCount = 1;
  let habitDailySchedule = null;

  if (taskType === 'DAILY') {
    // 毎日：曜日ごとの回数を取得
    const schedule: any = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = parseInt(formData.get(`dailyCount_${i}`) as string || '0');
    }
    habitDailySchedule = schedule;
  } else if (taskType === 'WEEKLY' || taskType === 'MONTHLY') {
    // 毎週/毎月：期間日数と合計回数
    habitPeriodDays = parseInt(formData.get('habitPeriodDays') as string || '7');
    habitTargetCount = parseInt(formData.get('habitTargetCount') as string || '1');
  }

  const notificationTimes = formData.getAll('notificationTimes') as string[];

  return {
    data: {
      taskTitle,
      taskMemo: taskMemo || "",
      taskStartTime,
      taskDeadline,
      taskPriority,
      taskType,
      habitPeriodDays,
      habitTargetCount,
      habitDailySchedule,
    },
    notifications: notificationTimes
      .filter(t => t !== "")
      .map(t => ({ notificationTime: new Date(t) })),
  };
}

export async function createTaskAction(formData: FormData) {
  const { data, notifications } = getTaskDataFromForm(formData);
  await prisma.todoTask.create({
    data: { ...data, notifications: { create: notifications } },
  });
  revalidatePath('/');
}

export async function updateTaskAction(taskId: number, formData: FormData) {
  const { data, notifications } = getTaskDataFromForm(formData);
  await prisma.todoTask.update({
    where: { id: taskId },
    data: {
      ...data,
      notifications: { deleteMany: {}, create: notifications },
    },
  });
  revalidatePath('/');
}

/**
 * タスクの完了（習慣の場合はカウントアップ）
 */
export async function completeTaskAction(taskId: number, currentCount: number) {
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { 
      completedCount: currentCount + 1,
      lastCompletedAt: new Date() 
    },
  });
  revalidatePath('/');
}

export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}
