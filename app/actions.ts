'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * フォームの入力データを整理する補助関数
 */
function extractTaskData(formData: FormData) {
  const taskType = formData.get('taskType') as string;
  const deadlineStr = formData.get('taskDeadline') as string;

  // DAILY（毎日）の場合は曜日ごとのスケジュールを組み立てる
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

/**
 * タスクを新しく作る
 */
export async function createTaskAction(formData: FormData) {
  const taskData = extractTaskData(formData);
  
  // 一番最後に並べるための番号を計算
  const lastTask = await prisma.todoTask.findFirst({ orderBy: { sortOrder: 'desc' } });
  const newSortOrder = lastTask ? lastTask.sortOrder + 1 : 0;
  
  await prisma.todoTask.create({
    data: { ...taskData, sortOrder: newSortOrder }
  });
  revalidatePath('/');
}

/**
 * タスクの内容を書き換える
 */
export async function updateTaskAction(taskId: number, formData: FormData) {
  const taskData = extractTaskData(formData);
  await prisma.todoTask.update({
    where: { id: taskId },
    data: taskData
  });
  revalidatePath('/');
}

/**
 * 【ラグ改善】並び順を保存する
 * revalidatePath を最後に一回だけ呼ぶようにし、無駄な再読み込みを減らします。
 */
export async function updateTaskOrderAction(taskIds: number[]) {
  // 全てのタスクの順序を更新
  const updatePromises = taskIds.map((id, index) => 
    prisma.todoTask.update({
      where: { id },
      data: { sortOrder: index }
    })
  );
  
  await Promise.all(updatePromises);
  revalidatePath('/');
}

/**
 * 完了ボタンが押された時のカウントアップ
 */
export async function completeTaskAction(taskId: number, currentCount: number) {
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { 
      completedCount: currentCount + 1,
      lastCompletedAt: new Date() 
    }
  });
  revalidatePath('/');
}

/**
 * タスクを完全に消す
 */
export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}
