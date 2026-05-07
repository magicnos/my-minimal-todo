'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * タスクを保存（新規作成または更新）するための共通のデータ整理関数
 */
function getTaskDataFromForm(formData: FormData) {
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskStartTime = formData.get('taskStartTime') as string;
  const taskDeadline = formData.get('taskDeadline') as string;
  const taskPriority = formData.get('taskPriority') as string;
  const taskType = formData.get('taskType') as string;

  // 通知時間のリストを取り出す（通知1, 通知2... と複数送られてくる想定）
  const notificationTimes = formData.getAll('notificationTimes') as string[];

  return {
    baseData: {
      taskTitle,
      taskMemo: taskMemo || "",
      taskStartTime: new Date(taskStartTime),
      taskDeadline: new Date(taskDeadline),
      taskPriority,
      taskType,
    },
    notifications: notificationTimes
      .filter(t => t !== "") // 空っぽは除外
      .map(t => ({ notificationTime: new Date(t) })),
  };
}

/**
 * 新しいタスクを作成する
 */
export async function createTaskAction(formData: FormData) {
  const { baseData, notifications } = getTaskDataFromForm(formData);

  await prisma.todoTask.create({
    data: {
      ...baseData,
      notifications: {
        create: notifications,
      },
    },
  });

  revalidatePath('/');
}

/**
 * 既存のタスクを更新（編集）する
 */
export async function updateTaskAction(taskId: number, formData: FormData) {
  const { baseData, notifications } = getTaskDataFromForm(formData);

  // 一旦古い通知を削除してから、新しい通知を作成します
  await prisma.todoTask.update({
    where: { id: taskId },
    data: {
      ...baseData,
      notifications: {
        deleteMany: {}, // 全削除
        create: notifications, // 新規作成
      },
    },
  });

  revalidatePath('/');
}

/**
 * タスクを削除する
 */
export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({
    where: { id: taskId },
  });
  revalidatePath('/');
}
