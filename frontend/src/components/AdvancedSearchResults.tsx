'use client';

import Link from 'next/link';
import { 
  CalendarIcon,
  UserIcon,
  HeartIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon,
  TagIcon
} from '@heroicons/react/24/outline';

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
  summary?: string;
  created_at: string;
  published_at?: string;
  users: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar_url: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    likes: number;
    collections: number;
    comments: number;
  };
}

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  posts: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

interface AdvancedSearchResultsProps {
  results: {
    tags?: Tag[];
    posts?: Post[];
    users?: User[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  };
  searchType: 'all' | 'posts' | 'users' | 'tags';
  query: string;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function AdvancedSearchResults({
  results,
  searchType,
  query,
  onPageChange,
  isLoading = false,
}: AdvancedSearchResultsProps) {
  console.log('results', results);
  console.log('searchType', searchType);
  console.log('tags', results.tags);
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Searching...</p>
      </div>
    );
  }

  if (results.totalCount === 0) {
    return (
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
          Try adjusting your search terms or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Search Results ({results.totalCount.toLocaleString()})
          </h2>
          <p className="text-sm text-gray-600">
            Showing results for "<span className="font-medium">{query}</span>"
          </p>
        </div>
      </div>

      {/* Results Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tags Results */}
        {(searchType === 'all' || searchType === 'tags') && results.tags && results.tags.length > 0 && (
          <div className="p-6">
            <p>Tags</p>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-blue-600" />
              Tags {searchType === 'all' && `(${results.tags.length})`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.tags.map((tag) => (
                <div key={tag.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center mb-2">
                    <Link 
                      href={`/tags/${tag.id}`}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      #{tag.name}
                    </Link>
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
          </div>
        )}

        {/* Posts Results */}
        {(searchType === 'all' || searchType === 'posts') && results.posts && results.posts.length > 0 && (
          <div className={`p-6 ${results.tags && results.tags.length > 0 ? 'border-t border-gray-200' : ''}`}>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Posts {searchType === 'all' && `(${results.posts.length})`}
            </h3>
            <div className="space-y-4">
              {results.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-900 mb-2 text-lg">{post.title}</h4>
                  {post.summary && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.summary}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      <span>By {post.users.name}</span>
                      {post.users.username && (
                        <span className="text-gray-400">@{post.users.username}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Post Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="h-4 w-4" />
                      <span>{post._count.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookmarkIcon className="h-4 w-4" />
                      <span>{post._count.collections}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      <span>{post._count.comments}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {post.tags.slice(0, 4).map((tagItem) => (
                        <Link
                          key={tagItem.tag.id}
                          href={`/tags/${tagItem.tag.id}`}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                        >
                          #{tagItem.tag.name}
                        </Link>
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
          </div>
        )}

        {/* Users Results */}
        {(searchType === 'all' || searchType === 'users') && results.users && results.users.length > 0 && (
          <div className={`p-6 ${(results.tags && results.tags.length > 0) || (results.posts && results.posts.length > 0) ? 'border-t border-gray-200' : ''}`}>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-purple-600" />
              Users {searchType === 'all' && `(${results.users.length})`}
            </h3>
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
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">{user.username || user.email}</h4>
                      {user.username && (
                        <p className="text-gray-600 text-sm">@{user.username}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* User Stats */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                    <span>{user._count.posts} posts</span>
                    <span>{user._count.followers} followers</span>
                    <span>{user._count.following} following</span>
                  </div>

                  <p className="text-gray-500 text-xs mb-3">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  
                  {user.posts.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Recent Posts:</p>
                      {user.posts.slice(0, 2).map((post) => (
                        <div key={post.id} className="text-sm text-blue-600 mb-1 truncate">
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
          </div>
        )}

        {/* Pagination */}
        {results.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-center items-center space-x-4">
              <button
                onClick={() => onPageChange(results.currentPage - 1)}
                disabled={results.currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {results.currentPage} of {results.totalPages}
              </span>
              <button
                onClick={() => onPageChange(results.currentPage + 1)}
                disabled={results.currentPage === results.totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
