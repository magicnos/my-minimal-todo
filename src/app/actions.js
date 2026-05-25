'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * データベース操作やサーバーサイドのロジックを管理するサーバーアクション
 */

/**
 * ユーザープロファイルを取得または作成する
 * 初回起動時などにプロファイルがない場合、デフォルト値で作成します。
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
 * フォームから送信されたデータ（formData）を整形してオブジェクトとして返す
 * 各タスクタイプ（毎日、一回きりなど）に応じたデータの処理を行います。
 */
function extractTaskData(formData) {
  const taskType = formData.get('taskType');
  const deadlineStr = formData.get('taskDeadline');

  let habitDailySchedule = null;
  // 毎日タスクの場合、曜日ごとの目標回数を取得
  if (taskType === 'DAILY') {
    const schedule = {};
    for (let i = 0; i < 7; i++) {
      schedule[i] = parseInt(formData.get(`dailyCount_${i}`) || '0');
    }
    habitDailySchedule = schedule;
  }

  return {
    taskTitle: formData.get('taskTitle'),
    taskMemo: formData.get('taskMemo') || "",
    taskType,
    taskPriority: formData.get('taskPriority'),
    taskDeadline: deadlineStr ? new Date(deadlineStr) : null,
    habitDailySchedule,
    habitStartDay: taskType === 'MULTI_DAY' ? parseInt(formData.get('habitStartDay') || '0') : null,
    habitStartTime: taskType === 'MULTI_DAY' ? formData.get('habitStartTime') : null,
    habitEndDay: taskType === 'MULTI_DAY' ? parseInt(formData.get('habitEndDay') || '0') : null,
    habitEndTime: taskType === 'MULTI_DAY' ? formData.get('habitEndTime') : null,
    habitTargetCount: parseInt(formData.get('habitTargetCount') || '1'),
    rewardPoints: parseInt(formData.get('rewardPoints') || '10'),
    rewardXP: parseInt(formData.get('rewardXP') || '10'),
    rewardTiming: formData.get('rewardTiming') || "EACH",
  };
}

/**
 * 新しいタスクを作成する
 */
export async function createTaskAction(formData) {
  const taskData = extractTaskData(formData);
  const lastTask = await prisma.todoTask.findFirst({ orderBy: { sortOrder: 'desc' } });
  const newSortOrder = lastTask ? lastTask.sortOrder + 1 : 0;
  
  await prisma.todoTask.create({
    data: { ...taskData, sortOrder: newSortOrder }
  });
  revalidatePath('/');
}

/**
 * タスクの内容を更新する
 */
export async function updateTaskAction(taskId, formData) {
  const taskData = extractTaskData(formData);
  await prisma.todoTask.update({ where: { id: taskId }, data: taskData });
  revalidatePath('/');
}

/**
 * タスクの並び順（sortOrder）を一括で更新する
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
 * タスクを完了（または取り消し）し、XPとポイントを更新する
 * レベルアップの判定もここで行います。
 */
export async function completeTaskAction(taskId, currentCount, isCancel = false) {
  const task = await prisma.todoTask.findUnique({ where: { id: taskId } });
  if (!task) return;

  const nextCount = isCancel ? Math.max(0, currentCount - 1) : currentCount + 1;
  
  // タスクの完了回数と最終完了日時を更新
  await prisma.todoTask.update({
    where: { id: taskId },
    data: { completedCount: nextCount, lastCompletedAt: new Date() }
  });

  const profile = await getOrCreateProfile();
  let addXP = 0;
  let addPoints = 0;

  // 報酬を付与するタイミングか判定
  let target = task.habitTargetCount || 1;
  if (task.taskType === 'DAILY') {
    const currentDay = new Date().getDay();
    target = task.habitDailySchedule?.[currentDay] || 0;
  }

  const shouldGiveReward = task.rewardTiming === 'EACH' || (task.rewardTiming === 'TOTAL' && (isCancel ? currentCount === target : nextCount === target));

  if (shouldGiveReward) {
    addXP = isCancel ? -task.rewardXP : task.rewardXP;
    addPoints = isCancel ? -task.rewardPoints : task.rewardPoints;
  }

  if (addXP !== 0 || addPoints !== 0) {
    let newXP = profile.xp + addXP;
    let newLevel = profile.level;
    let newPoints = profile.points + addPoints;
    const xpScaling = profile.xpScaling || 100;

    // レベルアップのループ判定
    if (addXP > 0) {
      while (newXP >= newLevel * xpScaling) {
        newXP -= newLevel * xpScaling;
        newLevel += 1;
      }
    } else if (addXP < 0) {
      // XPがマイナスになった場合のレベルダウン処理
      while (newXP < 0 && newLevel > 1) {
        newLevel -= 1;
        newXP += newLevel * xpScaling;
      }
      if (newXP < 0) newXP = 0;
    }

    await prisma.userProfile.update({
      where: { id: 1 },
      data: { xp: newXP, level: newLevel, points: newPoints }
    });
  }

  // 一回きりのタスクで完了した場合、データベースから削除（クリーンアップ）
  if (!isCancel && task.taskType === 'SINGLE' && nextCount >= 1) {
    await prisma.todoTask.delete({ where: { id: taskId } });
  }

  revalidatePath('/');
}

/**
 * タスクを削除する
 */
export async function deleteTaskAction(taskId) {
  await prisma.todoTask.delete({ where: { id: taskId } });
  revalidatePath('/');
}

/**
 * ユーザー設定（レベル、XP、ポイントなど）を直接更新する
 */
export async function updateSettingsAction(formData) {
  const level = parseInt(formData.get('level') || '1');
  const xp = parseInt(formData.get('xp') || '0');
  const points = parseInt(formData.get('points') || '0');
  const xpScaling = parseInt(formData.get('xpScaling') || '100');

  await prisma.userProfile.update({
    where: { id: 1 },
    data: { level, xp, points, xpScaling }
  });
  revalidatePath('/');
}

/**
 * ご褒美項目を作成する
 */
export async function createRewardAction(formData) {
  const title = formData.get('title');
  const pointsCost = parseInt(formData.get('pointsCost') || '0');
  const lastReward = await prisma.reward.findFirst({ orderBy: { sortOrder: 'desc' } });
  const newSortOrder = lastReward ? lastReward.sortOrder + 1 : 0;
  
  await prisma.reward.create({
    data: { title, pointsCost, sortOrder: newSortOrder }
  });
  revalidatePath('/');
}

/**
 * ご褒美項目を更新する
 */
export async function updateRewardAction(rewardId, formData) {
  const title = formData.get('title');
  const pointsCost = parseInt(formData.get('pointsCost') || '0');
  
  await prisma.reward.update({
    where: { id: rewardId },
    data: { title, pointsCost }
  });
  revalidatePath('/');
}

/**
 * ご褒美項目を削除する
 */
export async function deleteRewardAction(rewardId) {
  await prisma.reward.delete({ where: { id: rewardId } });
  revalidatePath('/');
}

/**
 * ご褒美項目の並び順を更新する
 */
export async function updateRewardOrderAction(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    await prisma.reward.update({
      where: { id: orderedIds[i] },
      data: { sortOrder: i }
    });
  }
  revalidatePath('/');
}

/**
 * 貯めたポイントをご褒美と交換する
 */
export async function exchangeRewardAction(rewardId) {
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  const profile = await getOrCreateProfile();

  if (reward && profile.points >= reward.pointsCost) {
    await prisma.userProfile.update({
      where: { id: 1 },
      data: { points: profile.points - reward.pointsCost }
    });
    revalidatePath('/');
    return { success: true, title: reward.title };
  }
  return { success: false, error: 'ポイントが足りません' };
}

/**
 * カレンダーの予定を作成する
 */
export async function createCalendarEventAction(formData) {
  const title = formData.get('title');
  const memo = formData.get('memo') || "";
  const dateStr = formData.get('date');
  const startTime = formData.get('startTime') || null;
  const endTime = formData.get('endTime') || null;

  await prisma.calendarEvent.create({
    data: {
      title,
      memo,
      date: new Date(dateStr),
      startTime,
      endTime
    }
  });
  revalidatePath('/');
}

/**
 * カレンダーの予定を更新する
 */
export async function updateCalendarEventAction(eventId, formData) {
  const title = formData.get('title');
  const memo = formData.get('memo') || "";
  const dateStr = formData.get('date');
  const startTime = formData.get('startTime') || null;
  const endTime = formData.get('endTime') || null;

  await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title,
      memo,
      date: new Date(dateStr),
      startTime,
      endTime
    }
  });
  revalidatePath('/');
}

/**
 * カレンダーの予定を削除する
 */
export async function deleteCalendarEventAction(eventId) {
  await prisma.calendarEvent.delete({
    where: { id: eventId }
  });
  revalidatePath('/');
}

/**
 * ユーザープロファイルを取得する
 */
export async function getUserProfileAction() {
  return await getOrCreateProfile();
}

