'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const googleBtnRef1 = useRef(null);
  const googleBtnRef2 = useRef(null);

  // Initialize Google Identity Services once the script loads
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id_here') return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setGoogleError('');
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Google authentication failed');
            }
            login(data.token, { id: data._id, username: data.username, email: data.email });
            router.push('/analyze');
          } catch (err) {
            setGoogleError(err.message);
          }
        },
      });

      // Render Google's official buttons into hidden containers
      if (googleBtnRef1.current) {
        window.google.accounts.id.renderButton(googleBtnRef1.current, {
          type: 'icon',
          shape: 'circle',
          size: 'large',
        });
      }
      if (googleBtnRef2.current) {
        window.google.accounts.id.renderButton(googleBtnRef2.current, {
          type: 'icon',
          shape: 'circle',
          size: 'large',
        });
      }
      setGoogleReady(true);
    };

    // If script is already loaded, initialize immediately
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Otherwise wait for it
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [login, router]);

  const handleAuth = async (endpoint, body, setError) => {
    setError('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      login(data.token, { id: data._id, username: data.username, email: data.email });
      router.push('/analyze');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    handleAuth('/api/auth/login', { email: loginEmail, password: loginPassword }, setLoginError);
  };

  const handleSignup = (e) => {
    e.preventDefault();
    handleAuth('/api/auth/register', { username: signupUsername, email: signupEmail, password: signupPassword }, setSignupError);
  };

  return (
    <>
      <style jsx>{`
        .auth-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          padding: 2rem;
          margin-top: 60px;
          min-height: calc(100vh - 60px);
        }
        .auth-container-sliding {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: 0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          width: 768px;
          max-width: 100%;
          min-height: 520px;
          border: 1px solid var(--border-color);
        }
        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
          background-color: var(--bg-card);
        }
        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
          opacity: 1;
          visibility: visible;
          transition: all 0.6s ease-in-out;
        }
        .auth-container-sliding.right-panel-active .sign-in-container {
          transform: translateX(100%);
          opacity: 0;
          visibility: hidden;
        }
        .sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          visibility: hidden;
          z-index: 1;
          transition: all 0.6s ease-in-out;
        }
        .auth-container-sliding.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          visibility: visible;
          z-index: 5;
          animation: show 0.6s;
        }
        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }
        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }
        .auth-container-sliding.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }
        .overlay {
          background: #10b981;
          background: linear-gradient(to right, #10b981, #059669);
          color: #ffffff;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }
        .auth-container-sliding.right-panel-active .overlay {
          transform: translateX(50%);
        }
        .overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 40px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }
        .overlay-left {
          transform: translateX(-20%);
        }
        .auth-container-sliding.right-panel-active .overlay-left {
          transform: translateX(0);
        }
        .overlay-right {
          right: 0;
          transform: translateX(0);
        }
        .auth-container-sliding.right-panel-active .overlay-right {
          transform: translateX(20%);
        }
        .overlay-panel h1 {
          font-size: 2.2rem;
          margin-bottom: 1rem;
          color: #ffffff;
        }
        .overlay-panel p {
          font-size: 1rem;
          font-weight: 300;
          line-height: 1.5;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.9);
        }
        .auth-form {
          background-color: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 50px;
          height: 100%;
          text-align: center;
        }
        .auth-form h1 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: var(--text-color);
        }
        .auth-form input {
          background-color: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 14px 15px;
          margin-bottom: 20px;
          width: 100%;
          border-radius: var(--radius-md);
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .auth-form input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .auth-form button[type="submit"] {
          border-radius: var(--radius-md);
          border: 1px solid #3b82f6;
          background-color: #3b82f6;
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 700;
          padding: 14px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform 80ms ease-in, background-color 0.2s;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .auth-form button[type="submit"]:active { transform: scale(0.95); }
        .auth-form button[type="submit"]:hover { background-color: #2563eb; }
        button.ghost {
          background-color: transparent;
          border: 1px solid #ffffff;
          margin-top: 1rem;
          border-radius: var(--radius-md);
          color: #ffffff;
          font-size: 1rem;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform 80ms ease-in, background-color 0.2s, color 0.2s;
          cursor: pointer;
        }
        button.ghost:active { transform: scale(0.95); }
        button.ghost:hover { background-color: #ffffff; color: #10b981; }
        .auth-error {
          color: #ef4444;
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-sm);
          width: 100%;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          width: 100%;
          margin: 1.25rem 0;
          gap: 12px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background-color: var(--border-color);
        }
        .auth-divider span {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .google-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background-color: #ffffff;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 80ms ease-in;
          padding: 0;
        }
        .google-icon-btn:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.05);
        }
        .google-icon-btn:active { transform: scale(0.95); }
        .google-icon-btn svg {
          width: 24px;
          height: 24px;
        }
        @media (max-width: 768px) {
          .auth-wrapper { padding: 1rem; align-items: flex-start; margin-top: 70px; }
          .auth-container-sliding { width: 100%; min-height: 560px; }
          .overlay-container { position: absolute; top: 0; left: 0 !important; width: 100% !important; height: 42%; transition: none !important; transform: none !important; z-index: 100; }
          .auth-container-sliding.right-panel-active .overlay-container { transform: none !important; }
          .overlay { left: -100%; width: 200%; height: 100%; transform: translateX(0); transition: transform 0.6s ease-in-out; }
          .auth-container-sliding.right-panel-active .overlay { transform: translateX(50%); }
          .overlay-panel { position: absolute; width: 50%; height: 100%; padding: 1.25rem 20px; }
          .overlay-left { transform: translateX(-20%); }
          .auth-container-sliding.right-panel-active .overlay-left { transform: translateX(0); }
          .overlay-right { right: 0; transform: translateX(0); }
          .auth-container-sliding.right-panel-active .overlay-right { transform: translateX(20%); }
          .overlay-panel h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }
          .overlay-panel p { font-size: 0.85rem; margin-bottom: 1rem; }
          .form-container { position: absolute; width: 100%; height: 58%; top: 42%; left: 0; transition: all 0.6s ease-in-out; }
          .sign-in-container { opacity: 1; visibility: visible; z-index: 2; transform: translateX(0); }
          .auth-container-sliding.right-panel-active .sign-in-container { opacity: 0; visibility: hidden; transform: translateX(-40px); z-index: 1; }
          .sign-up-container { opacity: 0; visibility: hidden; z-index: 1; transform: translateX(40px); }
          .auth-container-sliding.right-panel-active .sign-up-container { opacity: 1; visibility: visible; z-index: 5; transform: translateX(0); animation: none; }
          .auth-form { padding: 1.25rem 20px 1rem; }
          .auth-form h1 { font-size: 1.5rem; margin-bottom: 0.75rem; }
        }
      `}</style>

      <div className="auth-wrapper">
        <div className={`auth-container-sliding ${isSignUp ? 'right-panel-active' : ''}`} id="auth-container">
          {/* Sign Up Form */}
          <div className="form-container sign-up-container">
            <form className="auth-form" onSubmit={handleSignup}>
              <h1>Create Account</h1>
              {signupError && <div className="auth-error">{signupError}</div>}
              {googleError && <div className="auth-error">{googleError}</div>}
              <input type="text" placeholder="Name" required value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} />
              <input type="email" placeholder="Email Address" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
              <input type="password" placeholder="Password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
              <button type="submit">Sign Up</button>
              <div className="auth-divider"><span>or</span></div>
              <div ref={googleBtnRef1} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}></div>
              <button type="button" className="google-icon-btn" onClick={() => { const el = googleBtnRef1.current?.querySelector('div[role=button]'); if (el) el.click(); }}>
                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </button>
            </form>
          </div>

          {/* Sign In Form */}
          <div className="form-container sign-in-container">
            <form className="auth-form" onSubmit={handleLogin}>
              <h1>Sign In</h1>
              {loginError && <div className="auth-error">{loginError}</div>}
              {googleError && <div className="auth-error">{googleError}</div>}
              <input type="email" placeholder="Email Address" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <input type="password" placeholder="Password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <button type="submit">Sign In</button>
              <div className="auth-divider"><span>or</span></div>
              <div ref={googleBtnRef2} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}></div>
              <button type="button" className="google-icon-btn" onClick={() => { const el = googleBtnRef2.current?.querySelector('div[role=button]'); if (el) el.click(); }}>
                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              </button>
            </form>
          </div>

          {/* Sliding Overlay */}
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>To keep saving the environment please login with your info</p>
                <button className="ghost" onClick={() => setIsSignUp(false)}>Sign In</button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hello, Ecosaver!</h1>
                <p>Enter your personal details and start tracking your carbon footprint</p>
                <button className="ghost" onClick={() => setIsSignUp(true)}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
