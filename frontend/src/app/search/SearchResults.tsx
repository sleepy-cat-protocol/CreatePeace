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
  username: string;
  email: string;
  avatar_url: string;
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
  const [activeTab, setActiveTab] = useState<'tags' | 'posts' | 'users'>('tags');

  useEffect(() => {
    // if (!authLoading && !isAuthenticated) {
    //   router.push('/login');
    //   return;
    // }

    if (query) {
      performSearch(query);
    }
  }, [isAuthenticated, authLoading, query, router]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/search?q=${encodeURIComponent(searchTerm)}`);
      const searchResults = response.data;
      setResults(searchResults);
      
      // Auto-select tab with results (priority: tags -> posts -> users)
      if (searchResults.tags?.length > 0) {
        setActiveTab('tags');
      } else if (searchResults.posts?.length > 0) {
        setActiveTab('posts');
      } else if (searchResults.users?.length > 0) {
        setActiveTab('users');
      } else {
        setActiveTab('tags'); // Default to tags if no results
      }
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

  // Get tab data with counts
  const getTabData = () => {
    return [
      { key: 'tags' as const, name: 'Tags', count: results.tags.length },
      { key: 'posts' as const, name: 'Posts', count: results.posts.length },
      { key: 'users' as const, name: 'Users', count: results.users.length }
    ];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

//   if (!isAuthenticated) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
//           <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-md">
//             Go to Login
//           </Link>
//         </div>
//       </div>
//     );
//   }

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

        {/* Tab Navigation */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {getTabData().map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                        activeTab === tab.key
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Tags Tab */}
              {activeTab === 'tags' && (
                <div>
                  {results.tags.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.tags.map((tag) => (
                        <div key={tag.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center mb-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              #{tag.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {tag.posts.length} post{tag.posts.length !== 1 ? 's' : ''}
                          </p>
                          {tag.posts.slice(0, 2).map((postItem) => (
                            <Link
                              key={postItem.post.id}
                              href={`/posts/${postItem.post.id}`}
                              className="block text-sm text-blue-600 hover:text-blue-800 mt-1 truncate"
                            >
                              {postItem.post.title}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tags found</h3>
                      <p className="text-gray-500">No tags match your search query.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div>
                  {results.posts.length > 0 ? (
                    <div className="space-y-4">
                      {results.posts.map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.id}`}
                          className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <h3 className="font-semibold text-gray-900 mb-2 text-lg">{post.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {post.content.substring(0, 200)}...
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>By {post.users.name}</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                          {post.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {post.tags.slice(0, 4).map((tagItem) => (
                                <span
                                  key={tagItem.tag.id}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                >
                                  #{tagItem.tag.name}
                                </span>
                              ))}
                              {post.tags.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                                  +{post.tags.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                      <p className="text-gray-500">No posts match your search query.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  {results.users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/users/${user.username || user.id}/dashboard`}
                          className="block border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow hover:border-blue-300"
                        >
                          <div className="flex items-center mb-3">
                            {user.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.avatar_url}
                                alt={user.username}
                              />
                            ) : (
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="ml-3">
                              <h3 className="font-semibold text-gray-900">{user.username || user.email}</h3>
                              {user.username && (
                                <p className="text-gray-600 text-sm">@{user.username}</p>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-500 text-xs mb-3">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          
                          {user.posts.length > 0 ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Recent Posts ({user.posts.length}):
                              </p>
                              {user.posts.slice(0, 2).map((post) => (
                                <div
                                  key={post.id}
                                  className="text-sm text-blue-600 mb-1 truncate"
                                >
                                  {post.title}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No posts yet</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-500">No users match your search query.</p>
                    </div>
                  )}
                </div>
              )}

              {/* No Results At All */}
              {results.tags.length === 0 && results.posts.length === 0 && results.users.length === 0 && query && (
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">
                    No results found for "<span className="font-semibold">{query}</span>"
                  </p>
                  <p className="text-gray-500">
                    Try adjusting your search terms or search for something else.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}