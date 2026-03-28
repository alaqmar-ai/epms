'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loginUser } from '@/lib/api';
import { User } from '@/lib/types';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      setError('Please enter both name and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(name.trim(), password.trim());
      onLogin(user as User);
    } catch {
      setError('Invalid name or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-panel border border-border rounded-lg overflow-hidden">
          {/* Toyota red top accent */}
          <div className="h-[3px] bg-toyota" />

          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-text-primary tracking-wide">EPMS</h1>
              <p className="text-xs text-text-muted mt-1">Equipment Project Monitoring System</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-name" className="block text-xs text-text-secondary mb-1.5">Name</label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-eng transition-colors"
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs text-text-secondary mb-1.5">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-eng transition-colors"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-xs text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-toyota hover:bg-red-700 text-white py-2.5 rounded-md text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Sign In
              </button>
            </form>

            <p className="text-center text-[10px] text-text-muted mt-6">
              v1.0 — Mechanical Engineering Division
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
