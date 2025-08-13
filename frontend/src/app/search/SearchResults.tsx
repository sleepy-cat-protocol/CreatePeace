'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Tag {
  id: string;
  name: string;
  posts: Array<{
    post: {
      id: string;
      title: string;
    };
  }>;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  posts: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<{
    tags: Tag[];
    posts: Post[];
    users: User[];
  }>({ tags: [], posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && query) {
      performSearch(query);
    }
  }, [isAuthenticated, authLoading, query, router]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(response.data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Order sections based on results (non-empty first)
  const getSectionOrder = () => {
    const sections = [
      { key: 'tags', name: 'Tags', count: results.tags.length },
      { key: 'posts', name: 'Posts', count: results.posts.length },
      { key: 'users', name: 'Users', count: results.users.length }
    ];

    return sections.sort((a, b) => {
      if (a.count === 0 && b.count === 0) return 0;
      if (a.count === 0) return 1;
      if (b.count === 0) return -1;
      return 0;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-md">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, users, or tags..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
          </form>

          {query && (
            <p className="text-gray-600 mt-2">
              Showing results for: <span className="font-semibold">"{query}"</span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-lg text-gray-600">Searching...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Search Results */}
        {!loading && !error && (
          <div className="space-y-8">
            {getSectionOrder().map(({ key, name, count }) => (
              <div key={key} className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {name} {count > 0 && <span className="text-gray-500">({count})</span>}
                </h2>

                {/* Tags Section */}
                {key === 'tags' && (
                  <div>
                    {results.tags.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.tags.map((tag) => (
                          <div key={tag.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                #{tag.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {tag.posts.length} post{tag.posts.length !== 1 ? 's' : ''}
                            </p>
                            {tag.posts.slice(0, 2).map((postItem) => (
                              <Link
                                key={postItem.post.id}
                                href={`/posts/${postItem.post.id}`}
                                className="block text-sm text-blue-600 hover:text-blue-800 mt-1"
                              >
                                {postItem.post.title}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No tags found</p>
                    )}
                  </div>
                )}

                {/* Posts Section */}
                {key === 'posts' && (
                  <div>
                    {results.posts.length > 0 ? (
                      <div className="space-y-4">
                        {results.posts.map((post) => (
                          <Link
                            key={post.id}
                            href={`/posts/${post.id}`}
                            className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {post.content.substring(0, 150)}...
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>By {post.users.name}</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            {post.tags.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {post.tags.slice(0, 3).map((tagItem) => (
                                  <span
                                    key={tagItem.tag.id}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                  >
                                    {tagItem.tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No posts found</p>
                    )}
                  </div>
                )}

                {/* Users Section */}
                {key === 'users' && (
                  <div>
                    {results.users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.users.map((user) => (
                          <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">{user.name}</h3>
                            <p className="text-gray-600 text-sm mb-2">{user.email}</p>
                            <p className="text-gray-500 text-xs mb-3">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                            
                            {user.posts.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Recent Posts ({user.posts.length}):
                                </p>
                                {user.posts.slice(0, 2).map((post) => (
                                  <Link
                                    key={post.id}
                                    href={`/posts/${post.id}`}
                                    className="block text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    {post.title}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No users found</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* No Results */}
            {results.tags.length === 0 && results.posts.length === 0 && results.users.length === 0 && query && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or search for something else.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}