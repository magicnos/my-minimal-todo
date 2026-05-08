'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

function getTaskDataFromForm(formData: FormData) {
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskType = formData.get('taskType') as string;
  const taskPriority = formData.get('taskPriority') as string;
  
  const deadlineStr = formData.get('taskDeadline') as string;
  const taskDeadline = deadlineStr ? new Date(deadlineStr) : new Date();

  let habitPeriodDays = null;
  let habitTargetCount = 1;
  let habitDailySchedule = null;

  if (taskType === 'DAILY') {
    const schedule: any = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = parseInt(formData.get(`dailyCount_${i}`) as string || '0');
    }
    habitDailySchedule = schedule;
  } else if (taskType === 'WEEKLY' || taskType === 'MONTHLY') {
    habitPeriodDays = parseInt(formData.get('habitPeriodDays') as string || '7');
    habitTargetCount = parseInt(formData.get('habitTargetCount') as string || '1');
  }

  return {
    data: {
      taskTitle,
      taskMemo: taskMemo || "",
      taskDeadline,
      taskPriority,
      taskType,
      habitPeriodDays,
      habitTargetCount,
      habitDailySchedule,
    }
  };
}

export async function createTaskAction(formData: FormData) {
  const { data } = getTaskDataFromForm(formData);
  await prisma.todoTask.create({ data });
  revalidatePath('/');
}

export async function updateTaskAction(taskId: number, formData: FormData) {
  const { data } = getTaskDataFromForm(formData);
  await prisma.todoTask.update({
    where: { id: taskId },
    data,
  });
  revalidatePath('/');
}

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
