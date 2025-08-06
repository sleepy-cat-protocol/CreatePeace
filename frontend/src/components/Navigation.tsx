'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navigation() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <nav className="flex justify-between items-center mb-4">
        <Link href="/" className="text-xl font-bold">MyBlog</Link>
        <div>Loading...</div>
      </nav>
    );
  }

  return (
    <nav className="flex justify-between items-center mb-4">
      <Link href="/" className="text-xl font-bold">MyBlog</Link>
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <Link
              href="/mypage"
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              My Page
            </Link>
            <Link
              href="/create-post"
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Create Post
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-600 hover:text-gray-800">
              Login
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
} 