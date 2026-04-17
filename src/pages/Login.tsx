import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError('認証に失敗しました。入力内容を確認してください。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
        <h2 className="text-center mb-8">{isLoginMode ? 'ログイン' : '新規登録'}</h2>
        
        {error && (
          <div style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">パスワード (6文字以上)</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              minLength={6}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '16px' }}
            disabled={loading}
          >
            {loading ? '処理中...' : (isLoginMode ? 'ログイン' : '登録して始める')}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '16px', fontSize: '14px' }}>
          <button 
            type="button"
            className="btn"
            style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', color: 'var(--color-primary)' }}
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
          >
            {isLoginMode ? '新規登録はこちら' : 'すでにアカウントをお持ちの方はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}
