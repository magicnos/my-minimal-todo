'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * 文字列（YYYY-MM-DDTHH:mm）を現地の Date オブジェクトに正しく変換する
 */
function parseLocalDateTime(dateTimeStr: string): Date {
  return new Date(dateTimeStr);
}

function getTaskDataFromForm(formData: FormData) {
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskStartTimeStr = formData.get('taskStartTime') as string;
  const taskDeadlineStr = formData.get('taskDeadline') as string;
  const taskPriority = formData.get('taskPriority') as string;
  const taskType = formData.get('taskType') as string;
  
  // 習慣の詳細設定
  const habitFrequency = formData.get('habitFrequency') as string;
  const habitDays = formData.getAll('habitDays').join(','); // 曜日の配列を文字列へ
  const habitTargetCount = parseInt(formData.get('habitTargetCount') as string || '1');

  const notificationTimes = formData.getAll('notificationTimes') as string[];

  return {
    baseData: {
      taskTitle,
      taskMemo: taskMemo || "",
      taskStartTime: parseLocalDateTime(taskStartTimeStr),
      taskDeadline: parseLocalDateTime(taskDeadlineStr),
      taskPriority,
      taskType,
      habitFrequency: taskType === 'HABIT' ? habitFrequency : null,
      habitDays: taskType === 'HABIT' ? habitDays : null,
      habitTargetCount: taskType === 'HABIT' ? habitTargetCount : 1,
    },
    notifications: notificationTimes
      .filter(t => t !== "")
      .map(t => ({ notificationTime: parseLocalDateTime(t) })),
  };
}

export async function createTaskAction(formData: FormData) {
  const { baseData, notifications } = getTaskDataFromForm(formData);
  await prisma.todoTask.create({
    data: { ...baseData, notifications: { create: notifications } },
  });
  revalidatePath('/');
}

export async function updateTaskAction(taskId: number, formData: FormData) {
  const { baseData, notifications } = getTaskDataFromForm(formData);
  await prisma.todoTask.update({
    where: { id: taskId },
    data: {
      ...baseData,
      notifications: { deleteMany: {}, create: notifications },
    },
  });
  revalidatePath('/');
}

export async function completeHabitAction(taskId: number) {
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { lastCompletedAt: new Date() },
  });
  revalidatePath('/');
}

export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}
