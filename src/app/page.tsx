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
      data: { id: 1, points: 0, xp: 0, level: 1 }
    });
  }

  // ご褒美リストの取得
  const rewards = await prisma.reward.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // データベースからタスク一覧を、通知データも含めて読み込みます
  const allTodoTasks = await prisma.todoTask.findMany({
    include: {
      notifications: true, // 通知データも一緒に持ってくる
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <main style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>My Tasks</h1>
      </header>

      <TodoClientContent 
        initialTasks={JSON.parse(JSON.stringify(allTodoTasks))} 
        userProfile={JSON.parse(JSON.stringify(userProfile))}
        rewards={JSON.parse(JSON.stringify(rewards))}
      />
    </main>
  );
}

const mainContainerStyle: React.CSSProperties = { padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' };
const headerStyle: React.CSSProperties = { padding: '40px 0 20px' };
const titleStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 'bold' };
