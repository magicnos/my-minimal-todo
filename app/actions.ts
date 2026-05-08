'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

function getTaskDataFromForm(formData: FormData) {
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskStartTime = formData.get('taskStartTime') as string;
  const taskDeadline = formData.get('taskDeadline') as string;
  const taskPriority = formData.get('taskPriority') as string;
  const taskType = formData.get('taskType') as string;
  const habitFrequency = formData.get('habitFrequency') as string;

  const notificationTimes = formData.getAll('notificationTimes') as string[];

  return {
    baseData: {
      taskTitle,
      taskMemo: taskMemo || "",
      taskStartTime: new Date(taskStartTime),
      taskDeadline: new Date(taskDeadline),
      taskPriority,
      taskType,
      habitFrequency: taskType === 'HABIT' ? habitFrequency : null,
    },
    notifications: notificationTimes
      .filter(t => t !== "")
      .map(t => ({ notificationTime: new Date(t) })),
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

/**
 * 習慣タスクを「今回の分だけ完了」にする
 */
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
