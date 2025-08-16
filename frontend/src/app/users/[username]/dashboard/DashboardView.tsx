'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIcon, 
  LinkIcon, 
  CalendarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  CheckBadgeIcon,
  UserPlusIcon,
  UserMinusIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatar_url: string;
  website: string;
  is_verified: boolean;
  created_at: string;
  _count: {
    posts: number;
    likes: number;
    collections: number;
    followers: number;
    following: number;
  };
}

interface Post {
  id: string;
  title: string;
  summary: string;
  excerpt: string;
  featured_image: string;
  view_count: number;
  created_at: string;
  users: {
    id: string;
    name: string;
    username: string;
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
    comments: number;
  };
}

interface DashboardViewProps {
  username: string;
}

export default function DashboardView({ username }: DashboardViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUserByUsername();
  }, [username]);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      if (currentUser && currentUser.id !== user.id) {
        fetchFollowStatus();
      }
    }
  }, [user, currentPage, currentUser]);

  const fetchUserByUsername = async () => {
    try {
      // First try to get user by username
      let response;
      try {
        response = await axios.get(`/users/username/${username}`);
      } catch (usernameError: any) {
        // If username lookup fails, try by ID (in case username is actually an ID)
        if (usernameError.response?.status === 404) {
          response = await axios.get(`/users/${username}`);
        } else {
          throw usernameError;
        }
      }
      setUser(response.data);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      setError('User not found');
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/posts?page=${currentPage}&limit=10`);
      setPosts(response.data.posts);
      setTotalPages(response.data.totalPages);
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowStatus = async () => {
    if (!user || !currentUser) return;
    
    try {
      const response = await axios.get(`/users/${user.id}/follow-status`);
      setIsFollowing(response.data.isFollowing);
    } catch (error: any) {
      console.error('Error fetching follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !currentUser) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.delete(`/users/${user.id}/follow`);
        setIsFollowing(false);
        setUser(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            followers: prev._count.followers - 1
          }
        } : null);
      } else {
        await axios.post(`/users/${user.id}/follow`);
        setIsFollowing(true);
        setUser(prev => prev ? {
          ...prev,
          _count: {
            ...prev._count,
            followers: prev._count.followers + 1
          }
        } : null);
      }
    } catch (error: any) {
      console.error('Error following/unfollowing user:', error);
      setError(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This user does not exist.'}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isOwnDashboard = currentUser?.id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img
                  className="h-24 w-24 rounded-full object-cover"
                  src={user.avatar_url}
                  alt={user.name}
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                {user.is_verified && (
                  <CheckBadgeIcon className="h-6 w-6 text-blue-500" />
                )}
              </div>
              {user.username && (
                <p className="text-gray-600 mb-2">@{user.username}</p>
              )}
              {user.bio && (
                <p className="text-gray-800 mb-4">{user.bio}</p>
              )}

              {/* User Details */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {user.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{user._count.posts}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <Link
                  href={`/users/${username}/follows?tab=followers`}
                  className="text-center hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="text-lg font-semibold text-gray-900">{user._count.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </Link>
                <Link
                  href={`/users/${username}/follows?tab=following`}
                  className="text-center hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="text-lg font-semibold text-gray-900">{user._count.following}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </Link>
                <Link
                  href={`/users/${username}/likes-collections?tab=likes`}
                  className="text-center hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="text-lg font-semibold text-gray-900">{user._count.likes}</div>
                  <div className="text-sm text-gray-600">Likes</div>
                </Link>
                <Link
                  href={`/users/${username}/likes-collections?tab=collections`}
                  className="text-center hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="text-lg font-semibold text-gray-900">{user._count.collections || 0}</div>
                  <div className="text-sm text-gray-600">Collections</div>
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0">
              {isOwnDashboard ? (
                <div className="flex space-x-3">
                  <Link
                    href="/profile/edit"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Edit Profile
                  </Link>
                  <Link
                    href="/create-post"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Post
                  </Link>
                </div>
              ) : currentUser ? (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {followLoading ? (
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isFollowing ? (
                    <UserMinusIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                  )}
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login to Follow
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Posts ({user._count.posts})
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">
              {isOwnDashboard ? "You haven't published any posts yet." : "This user hasn't published any posts yet."}
            </p>
            {isOwnDashboard && (
              <Link
                href="/create-post"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
              >
                {post.featured_image && (
                  <img
                    className="w-full h-48 object-cover"
                    src={post.featured_image}
                    alt={post.title}
                  />
                )}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  {post.summary && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.summary}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tagConnection) => (
                        <span
                          key={tagConnection.tag.id}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tagConnection.tag.name}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="h-4 w-4" />
                        <span>{post._count.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{post._count.comments}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{post.view_count}</span>
                      </div>
                    </div>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
