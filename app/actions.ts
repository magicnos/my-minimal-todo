'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

function getTaskDataFromForm(formData: FormData) {
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskType = formData.get('taskType') as string;
  const taskPriority = formData.get('taskPriority') as string;
  const deadlineStr = formData.get('taskDeadline') as string;

  let habitDailySchedule = null;
  let habitStartDay = null;
  let habitStartTime = null;
  let habitEndDay = null;
  let habitEndTime = null;
  let habitTargetCount = 1;

  if (taskType === 'DAILY') {
    const schedule: any = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = parseInt(formData.get(`dailyCount_${i}`) as string || '0');
    }
    habitDailySchedule = schedule;
  } else if (taskType === 'MULTI_DAY') {
    habitStartDay = parseInt(formData.get('habitStartDay') as string || '0');
    habitStartTime = formData.get('habitStartTime') as string;
    habitEndDay = parseInt(formData.get('habitEndDay') as string || '0');
    habitEndTime = formData.get('habitEndTime') as string;
    habitTargetCount = parseInt(formData.get('habitTargetCount') as string || '1');
  }

  return {
    data: {
      taskTitle,
      taskMemo: taskMemo || "",
      taskDeadline: deadlineStr ? new Date(deadlineStr) : null,
      taskPriority,
      taskType,
      habitDailySchedule,
      habitStartDay,
      habitStartTime,
      habitEndDay,
      habitEndTime,
      habitTargetCount,
    }
  };
}

export async function createTaskAction(formData: FormData) {
  const { data } = getTaskDataFromForm(formData);
  const lastTask = await prisma.todoTask.findFirst({ orderBy: { sortOrder: 'desc' } });
  const newOrder = lastTask ? lastTask.sortOrder + 1 : 0;
  await prisma.todoTask.create({ data: { ...data, sortOrder: newOrder } });
  revalidatePath('/');
}

export async function updateTaskAction(taskId: number, formData: FormData) {
  const { data } = getTaskDataFromForm(formData);
  await prisma.todoTask.update({ where: { id: taskId }, data });
  revalidatePath('/');
}

export async function updateTaskOrderAction(taskIds: number[]) {
  await Promise.all(taskIds.map((id, index) => prisma.todoTask.update({ where: { id }, data: { sortOrder: index } })));
  revalidatePath('/');
}

export async function completeTaskAction(taskId: number, currentCount: number) {
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { completedCount: currentCount + 1, lastCompletedAt: new Date() },
  });
  revalidatePath('/');
}

export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}
