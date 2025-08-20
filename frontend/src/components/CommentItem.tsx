'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import CommentForm from './CommentForm';
import { 
  HeartIcon as HeartOutline,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  replies?: Comment[];
  _count: {
    replies: number;
    likes: number;
  };
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onCommentAdded: (comment: Comment, parentId?: string) => void;
  onCommentUpdated: (comment: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
  depth?: number;
}

export default function CommentItem({ 
  comment, 
  postId, 
  onCommentAdded, 
  onCommentUpdated, 
  onCommentDeleted,
  depth = 0 
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment._count.likes);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const isOwner = user?.id === comment.users.id;
  const maxDepth = 3; // Maximum nesting depth

  const handleReplyAdded = (newComment: Comment) => {
    onCommentAdded(newComment, comment.id);
    setShowReplyForm(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.put(`/comments/${comment.id}`, {
        content: editContent.trim(),
      });
      onCommentUpdated(response.data);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsLoading(true);
    try {
      await axios.delete(`/comments/${comment.id}`);
      onCommentDeleted(comment.id);
    } catch (error: any) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;

    try {
      if (isLiked) {
        await axios.delete(`/comments/${comment.id}/like`);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await axios.post(`/comments/${comment.id}/like`);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
    }
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-gray-200 pl-4' : ''}`}>
      <div className="flex items-start space-x-3 group">
        {/* Avatar */}
        <Link href={`/users/${comment.users.username || comment.users.id}/dashboard`}>
          {comment.users.avatar_url ? (
            <img
              className="h-8 w-8 rounded-full object-cover hover:ring-2 hover:ring-blue-500 transition-all"
              src={comment.users.avatar_url}
              alt={comment.users.name}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors">
              <span className="text-gray-600 text-sm font-medium">
                {comment.users.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Link>

        {/* Comment Content */}
        <div className="flex-grow min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <Link
              href={`/users/${comment.users.username || comment.users.id}/dashboard`}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {comment.users.name}
            </Link>
            {comment.users.username && (
              <span className="text-gray-500 text-sm">@{comment.users.username}</span>
            )}
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-sm">{timeAgo(comment.created_at)}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-gray-400 text-xs">(edited)</span>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={2000}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!editContent.trim() || isLoading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-800 mb-3 whitespace-pre-wrap">{comment.content}</div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4 text-sm">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={!isAuthenticated}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-red-600 hover:text-red-700' 
                  : 'text-gray-500 hover:text-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLiked ? (
                <HeartSolid className="h-4 w-4" />
              ) : (
                <HeartOutline className="h-4 w-4" />
              )}
              <span>{likeCount}</span>
            </button>

            {/* Reply */}
            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ChatBubbleLeftIcon className="h-4 w-4" />
                <span>Reply</span>
              </button>
            )}

            {/* Show Replies */}
            {comment._count.replies > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showReplies ? 'Hide' : 'Show'} {comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* Menu for owner */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <PencilIcon className="h-3 w-3 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon className="h-3 w-3 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentAdded={handleReplyAdded}
                onCancel={() => setShowReplyForm(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}

          {/* Replies */}
          {showReplies && comment.replies && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onCommentAdded={onCommentAdded}
                  onCommentUpdated={onCommentUpdated}
                  onCommentDeleted={onCommentDeleted}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
