'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = (user: User) => {
    login(user);
    router.replace('/dashboard');
  };

  return <LoginForm onLogin={handleLogin} />;
}
