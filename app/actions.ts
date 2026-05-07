'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * 新しいタスクをデータベースに保存する関数です。
 * 'use server' を付けることで、サーバー側で安全に実行されます。
 */
export async function createTaskAction(formData: FormData) {
  // フォームから送られてきたデータを取り出します
  const taskTitle = formData.get('taskTitle') as string;
  const taskMemo = formData.get('taskMemo') as string;
  const taskDeadlineString = formData.get('taskDeadline') as string;
  const taskPriority = formData.get('taskPriority') as string;
  const taskType = formData.get('taskType') as string;
  const isNotificationEnabled = formData.get('isNotificationEnabled') === 'on';
  const notificationLeadTimeMinutes = parseInt(formData.get('notificationLeadTimeMinutes') as string || '0');

  // データベースに保存します
  await prisma.todoTask.create({
    data: {
      taskTitle: taskTitle,
      taskMemo: taskMemo || "",
      taskDeadline: new Date(taskDeadlineString), // 文字列を日付形式に変換
      taskPriority: taskPriority,
      taskType: taskType,
      isNotificationEnabled: isNotificationEnabled,
      notificationLeadTimeMinutes: notificationLeadTimeMinutes,
    },
  });

  // 画面を更新して、新しいタスクが表示されるようにします
  revalidatePath('/');
}

/**
 * タスクを削除する関数です。
 * 要件通り、完了＝削除という運用にするための準備です。
 */
export async function deleteTaskAction(taskId: number) {
  await prisma.todoTask.delete({
    where: {
      id: taskId,
    },
  });

  revalidatePath('/');
}
