import prisma from '@/lib/prisma';
import TodoClientContent from '@/components/todo/TodoClientContent';

export const dynamic = 'force-dynamic';

/**
 * アプリのメインエントリーポイント（サーバーコンポーネント）
 * データの取得とクライアントコンポーネントへの受け渡しを行います。
 */
export default async function TodoMainPage() {
  // タスク一覧の取得
  const allTodoTasks = await prisma.todoTask.findMany({
    include: { notifications: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <TodoClientContent 
      initialTasks={JSON.parse(JSON.stringify(allTodoTasks))} 
    />
  );
}
