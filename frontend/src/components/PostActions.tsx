'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HeartIcon as HeartOutline,
  BookmarkIcon as BookmarkOutline
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid
} from '@heroicons/react/24/solid';

interface PostActionsProps {
  postId: string;
  initialLikeCount?: number;
  initialCollectionCount?: number;
  className?: string;
  showCounts?: boolean;
}

export default function PostActions({ 
  postId, 
  initialLikeCount = 0, 
  initialCollectionCount = 0, 
  className = '',
  showCounts = true 
}: PostActionsProps) {
  const { user, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [collectionCount, setCollectionCount] = useState(initialCollectionCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPostStatus();
    }
  }, [postId, isAuthenticated, user]);

  const fetchPostStatus = async () => {
    try {
      const response = await axios.get(`/posts/${postId}/status`);
      setIsLiked(response.data.isLiked);
      setIsCollected(response.data.isCollected);
    } catch (error: any) {
      console.error('Error fetching post status:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user || isLoading) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        await axios.delete(`/posts/${postId}/like`);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await axios.post(`/posts/${postId}/like`);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollect = async () => {
    if (!isAuthenticated || !user || isLoading) return;

    setIsLoading(true);
    try {
      if (isCollected) {
        await axios.delete(`/posts/${postId}/collect`);
        setIsCollected(false);
        setCollectionCount(prev => Math.max(0, prev - 1));
      } else {
        await axios.post(`/posts/${postId}/collect`);
        setIsCollected(true);
        setCollectionCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center space-x-4 text-gray-500 ${className}`}>
        {showCounts && (
          <>
            <div className="flex items-center space-x-1">
              <HeartOutline className="h-5 w-5" />
              <span className="text-sm">{likeCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookmarkOutline className="h-5 w-5" />
              <span className="text-sm">{collectionCount}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center space-x-1 transition-colors ${
          isLiked 
            ? 'text-red-600 hover:text-red-700' 
            : 'text-gray-500 hover:text-red-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLiked ? (
          <HeartSolid className="h-5 w-5" />
        ) : (
          <HeartOutline className="h-5 w-5" />
        )}
        {showCounts && <span className="text-sm">{likeCount}</span>}
      </button>

      {/* Collect Button */}
      <button
        onClick={handleCollect}
        disabled={isLoading}
        className={`flex items-center space-x-1 transition-colors ${
          isCollected 
            ? 'text-blue-600 hover:text-blue-700' 
            : 'text-gray-500 hover:text-blue-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isCollected ? (
          <BookmarkSolid className="h-5 w-5" />
        ) : (
          <BookmarkOutline className="h-5 w-5" />
        )}
        {showCounts && <span className="text-sm">{collectionCount}</span>}
      </button>
    </div>
  );
}
