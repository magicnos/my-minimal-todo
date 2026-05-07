import prisma from '@/lib/prisma';
import TodoClientContent from '@/components/TodoClientContent';

// ビルド時にデータベースに接続しようとするのを防ぎます
export const dynamic = 'force-dynamic';

/**
 * サーバー側でデータを取得するメインページです。
 */
export default async function TodoMainPage() {
  // データベースからタスク一覧を読み込みます
  // 作成日時が新しい順（降順）に並べます
  const allTodoTasks = await prisma.todoTask.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 実際の表示やボタン操作は「クライアントコンポーネント」に任せます
  return (
    <main style={mainContainerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>My Tasks</h1>
      </header>

      <TodoClientContent initialTasks={JSON.parse(JSON.stringify(allTodoTasks))} />
    </main>
  );
}

const mainContainerStyle: React.CSSProperties = {
  padding: '20px',
  maxWidth: '600px',
  margin: '0 auto',
  minHeight: '100vh',
};

const headerStyle: React.CSSProperties = {
  padding: '40px 0 20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
};
