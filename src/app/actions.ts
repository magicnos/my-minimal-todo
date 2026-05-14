'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * ユーザープロファイルを取得または作成する
 */
async function getOrCreateProfile() {
  let profile = await prisma.userProfile.findUnique({ where: { id: 1 } });
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { id: 1, points: 0, xp: 0, level: 1, xpScaling: 100 }
    });
  }
  return profile;
}

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
    rewardPoints: parseInt(formData.get('rewardPoints') as string || '10'),
    rewardXP: parseInt(formData.get('rewardXP') as string || '10'),
    rewardTiming: (formData.get('rewardTiming') as string) || "EACH",
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
 * 指定された順番通りに sortOrder を振り直します
 */
export async function updateTaskOrderAction(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.todoTask.update({
      where: { id: orderedIds[i] },
      data: { sortOrder: i }
    });
  }
  revalidatePath('/');
}

export async function completeTaskAction(taskId: number, currentCount: number) {
  const task = await prisma.todoTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  const nextCount = currentCount + 1;
  
  // 目標値の取得
  let target = task.habitTargetCount || 1;
  if (task.taskType === 'DAILY') {
    const currentDay = new Date().getDay();
    target = (task.habitDailySchedule as any)?.[currentDay] || 0;
  }

  // タスクを更新
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { completedCount: nextCount, lastCompletedAt: new Date() }
  });

  // 報酬を付与するか判定
  const shouldGiveReward = task.rewardTiming === 'EACH' || (task.rewardTiming === 'TOTAL' && nextCount >= target);

  if (shouldGiveReward) {
    const profile = await getOrCreateProfile();
    let newXP = profile.xp + task.rewardXP;
    let newLevel = profile.level;
    let newPoints = profile.points + task.rewardPoints;

    const xpPerLevel = profile.xpScaling || 100;

    // レベルアップ判定
    while (newXP >= newLevel * xpPerLevel) {
      newXP -= newLevel * xpPerLevel;
      newLevel += 1;
    }

    await prisma.userProfile.update({
      where: { id: 1 },
      data: { xp: newXP, level: newLevel, points: newPoints }
    });
  }

  revalidatePath('/');
}

export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}

export async function updateSettingsAction(formData: FormData) {
  const level = parseInt(formData.get('level') as string || '1');
  const xp = parseInt(formData.get('xp') as string || '0');
  const points = parseInt(formData.get('points') as string || '0');
  const xpScaling = parseInt(formData.get('xpScaling') as string || '100');

  await prisma.userProfile.update({
    where: { id: 1 },
    data: { level, xp, points, xpScaling }
  });
  revalidatePath('/');
}

// ご褒美関連のアクション
export async function createRewardAction(formData: FormData) {
  const title = formData.get('title') as string;
  const pointsCost = parseInt(formData.get('pointsCost') as string || '0');
  
  await prisma.reward.create({
    data: { title, pointsCost }
  });
  revalidatePath('/');
}

export async function deleteRewardAction(rewardId: number) {
  await prisma.reward.delete({ where: { id: rewardId } });
  revalidatePath('/');
}

export async function exchangeRewardAction(rewardId: number) {
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  const profile = await getOrCreateProfile();

  if (reward && profile.points >= reward.pointsCost) {
    await prisma.userProfile.update({
      where: { id: 1 },
      data: { points: profile.points - reward.pointsCost }
    });
    revalidatePath('/');
    return { success: true };
  }
  return { success: false, error: 'ポイントが足りません' };
}

export async function getUserProfileAction() {
  return await getOrCreateProfile();
}
