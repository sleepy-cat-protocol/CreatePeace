'use client';

import { useState } from 'react';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded: (comment: any) => void;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({ 
  postId, 
  parentId, 
  onCommentAdded, 
  onCancel, 
  placeholder = "Write a comment..." 
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`/posts/${postId}/comments`, {
        content: content.trim(),
        parent_id: parentId,
      });

      onCommentAdded(response.data);
      setContent('');
      
      if (onCancel) {
        onCancel();
      }
    } catch (err: any) {
      console.error('Error posting comment:', err);
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">Please log in to comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start space-x-3">
        {user?.avatar_url ? (
          <img
            className="h-8 w-8 rounded-full object-cover"
            src={user.avatar_url}
            alt={user.name}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        <div className="flex-grow">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            maxLength={2000}
            disabled={isSubmitting}
          />
          
          {error && (
            <div className="mt-2 text-sm text-red-600">{error}</div>
          )}
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500">
              {content.length}/2000 characters
            </div>
            
            <div className="flex space-x-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
