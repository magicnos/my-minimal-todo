import prisma from '@/lib/prisma';
import TodoClientContent from '@/components/TodoClientContent';

export const dynamic = 'force-dynamic';

/**
 * サーバー側でデータを取得するメインページ
 */
export default async function TodoMainPage() {
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

      <TodoClientContent initialTasks={JSON.parse(JSON.stringify(allTodoTasks))} />
    </main>
  );
}

const mainContainerStyle: React.CSSProperties = { padding: '20px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' };
const headerStyle: React.CSSProperties = { padding: '40px 0 20px' };
const titleStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 'bold' };
