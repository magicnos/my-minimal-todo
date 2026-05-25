import prisma from '@/lib/prisma';
import TodoClientContent from '@/components/todo/TodoClientContent';

export const dynamic = 'force-dynamic';

/**
 * アプリのメインエントリーポイント（サーバーコンポーネント）
 * データの取得とクライアントコンポーネントへの受け渡しを行います。
 */
export default async function TodoMainPage() {
  // ユーザー情報の取得（初期化）
  let userProfile = await prisma.userProfile.findUnique({ where: { id: 1 } });
  if (!userProfile) {
    userProfile = await prisma.userProfile.create({
      data: { id: 1, xp: 0, level: 1 }
    });
  }

  // タスク一覧の取得
  const allTodoTasks = await prisma.todoTask.findMany({
    include: { notifications: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <TodoClientContent 
      initialTasks={JSON.parse(JSON.stringify(allTodoTasks))} 
      userProfile={JSON.parse(JSON.stringify(userProfile))}
    />
  );
}
