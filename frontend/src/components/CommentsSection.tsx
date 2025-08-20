'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

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

interface CommentsSectionProps {
  postId: string;
  initialCount?: number;
}

export default function CommentsSection({ postId, initialCount = 0 }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalComments, setTotalComments] = useState(initialCount);

  useEffect(() => {
    fetchComments();
  }, [postId, currentPage]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`/posts/${postId}/comments?page=${currentPage}&limit=20`);
      const data = response.data;
      
      setComments(data.comments);
      setTotalPages(data.totalPages);
      setTotalComments(data.totalComments);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentAdded = (newComment: Comment, parentId?: string) => {
    if (parentId) {
      // Add reply to existing comment
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment],
            _count: {
              ...comment._count,
              replies: comment._count.replies + 1,
            },
          };
        }
        return comment;
      }));
    } else {
      // Add new top-level comment
      setComments(prev => [newComment, ...prev]);
      setTotalComments(prev => prev + 1);
    }
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prev => prev.map(comment => 
      comment.id === updatedComment.id ? updatedComment : comment
    ));
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setTotalComments(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Comments ({totalComments})
        </h3>
      </div>

      {/* Comment Form */}
      <div className="mb-8">
        <CommentForm
          postId={postId}
          onCommentAdded={handleCommentAdded}
          placeholder="Share your thoughts..."
        />
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comments...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchComments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <ChatBubbleLeftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
          <p className="text-gray-600">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentAdded={handleCommentAdded}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
