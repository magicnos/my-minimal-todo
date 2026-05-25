import prisma from '@/lib/prisma';
import TodoClientContent from '@/components/todo/TodoClientContent';

export const dynamic = 'force-dynamic';

/**
 * サーバー側でデータを取得するメインページ
 */
export default async function TodoMainPage() {
  // ユーザープロファイルの取得（なければ作成）
  let userProfile = await prisma.userProfile.findUnique({ where: { id: 1 } });
  if (!userProfile) {
    userProfile = await prisma.userProfile.create({
      data: { id: 1, xp: 0, level: 1 }
    });
  }

  // データベースからタスク一覧を、通知データも含めて読み込みます
  const allTodoTasks = await prisma.todoTask.findMany({
    include: {
      notifications: true, // 通知データも一緒に持ってくる
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // カレンダーの予定を取得
  const calendarEvents = await prisma.calendarEvent.findMany({
    orderBy: { date: 'asc' }
  });

  return (
    <main style={mainContainerStyle}>
      <TodoClientContent 
        initialTasks={JSON.parse(JSON.stringify(allTodoTasks))} 
        userProfile={JSON.parse(JSON.stringify(userProfile))}
        calendarEvents={JSON.parse(JSON.stringify(calendarEvents))}
      />
    </main>
  );
}

const mainContainerStyle = { margin: '0 auto', minHeight: '100vh' };
