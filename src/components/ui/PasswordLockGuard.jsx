'use client';

import { useState, useEffect } from 'react';

/**
 * アプリ全体をパスワードで保護するコンポーネントです。
 * 正しいパスワードが入力されるまで、中身（TODOリストなど）を表示させません。
 */
export default function PasswordLockGuard({ children }) {
  // パスワードが認証されたかどうかを管理する状態（最初は false = 未認証）
  const [isAccessAuthorized, setIsAccessAuthorized] = useState(false);
  
  // ユーザーが入力中のパスワードを管理する状態
  const [passwordInputFieldValue, setPasswordInputFieldValue] = useState('');

  // ページを読み込んだ時に、すでに認証済み（ブラウザに記録済み）か確認します
  useEffect(() => {
    const savedAuthStatus = localStorage.getItem('isTodoAppAuthorized');
    if (savedAuthStatus === 'true') {
      setIsAccessAuthorized(true);
    }
  }, []);

  /**
   * パスワード送信ボタンが押された時の処理です。
   */
  const handlePasswordSubmitButtonClick = async () => {
    // 本来はサーバー側で確認するのが安全ですが、今回はシンプルさを優先し
    // 環境変数に設定した合言葉と一致するか確認します
    // ※Vercelデプロイ時は、環境変数 APP_ACCESS_PASSWORD を設定してください
    const correctPassword = process.env.NEXT_PUBLIC_APP_ACCESS_PASSWORD || 'mypassword123';

    if (passwordInputFieldValue === correctPassword) {
      // 合っていたら、認証状態を true にし、ブラウザにも保存します
      setIsAccessAuthorized(true);
      localStorage.setItem('isTodoAppAuthorized', 'true');
    } else {
      alert('パスワードが違います');
    }
  };

  /**
   * 入力欄の文字が変わるたびに呼び出される処理です。
   */
  const handlePasswordInputChange = (event) => {
    setPasswordInputFieldValue(event.target.value);
  };

  // まだ認証されていない場合は、パスワード入力画面を表示します
  if (!isAccessAuthorized) {
    return (
      <div style={passwordScreenContainerStyle}>
        <div style={passwordCardStyle}>
          <h1 style={titleStyle}>My Minimal Todo</h1>
          <p style={messageStyle}>パスワードを入力してください</p>
          <input
            type="password"
            value={passwordInputFieldValue}
            onChange={handlePasswordInputChange}
            placeholder="パスワード"
            style={inputStyle}
          />
          <button onClick={handlePasswordSubmitButtonClick} style={buttonStyle}>
            入室する
          </button>
        </div>
      </div>
    );
  }

  // 認証されている場合は、本来のアプリ内容（TODOリスト）を表示します
  return <>{children}</>;
}

// --- 見た目の設定（CSS） ---

const passwordScreenContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#0a0a0a', // ダークモード背景
  color: '#ededed',
};

const passwordCardStyle = {
  padding: '2rem',
  borderRadius: '12px',
  backgroundColor: '#171717',
  textAlign: 'center',
  width: '90%',
  maxWidth: '400px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
};

const titleStyle = {
  marginBottom: '1rem',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const messageStyle = {
  marginBottom: '1.5rem',
  fontSize: '0.9rem',
  opacity: 0.8,
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem',
  marginBottom: '1rem',
  borderRadius: '8px',
  border: '1px solid #333',
  backgroundColor: '#0a0a0a',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
};

const buttonStyle = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#ededed',
  color: '#0a0a0a',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};
