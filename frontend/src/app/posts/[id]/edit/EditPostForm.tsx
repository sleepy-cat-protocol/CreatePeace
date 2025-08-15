'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  tags: z.string().optional(),
  word_count: z.number().min(0).optional(),
  chapter_count: z.number().min(1).optional(),
  is_complete: z.boolean().optional(),
  content_warning: z.string().optional(),
  rating: z.enum(['G', 'T', 'M', 'E']).optional(),
  featured_image: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED']).optional(),
  scheduled_for: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Post {
  id: string;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  
  // Creative work fields
  word_count: number;
  chapter_count: number;
  is_complete: boolean;
  
  // Content warnings and ratings
  content_warning?: string;
  rating?: string;
  
  // Media
  featured_image?: string;
  
  // Status
  status: string;
  scheduled_for?: string;
  
  // Statistics
  view_count: number;
  
  users: {
    id: string;
    name: string;
    email: string;
    username?: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

interface EditPostFormProps {
  postId: string;
}

export default function EditPostForm({ postId }: EditPostFormProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchedContent = watch('content');
  const watchedStatus = watch('status');

  // Auto-calculate word count
  useEffect(() => {
    if (watchedContent) {
      const wordCount = watchedContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      setValue('word_count', wordCount);
    }
  }, [watchedContent, setValue]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      fetchPost();
    }
  }, [isAuthenticated, authLoading, router, postId]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/posts/${postId}`);
      const postData = response.data;
      setPost(postData);
      
      // Check if user owns this post
      if (postData.author_id !== user?.id) {
        setError('You can only edit your own posts');
        return;
      }

      // Convert tags array to string for form
      const tagsString = postData.tags?.map((tagItem: any) => tagItem.tag.name).join(', ') || '';
      
      // Format scheduled_for for datetime-local input
      const scheduledFor = postData.scheduled_for 
        ? new Date(postData.scheduled_for).toISOString().slice(0, 16)
        : '';

      // Reset form with post data
      reset({
        title: postData.title,
        content: postData.content,
        summary: postData.summary || '',
        tags: tagsString,
        word_count: postData.word_count,
        chapter_count: postData.chapter_count,
        is_complete: postData.is_complete,
        content_warning: postData.content_warning || '',
        rating: postData.rating as any,
        featured_image: postData.featured_image || '',
        status: postData.status as any,
        scheduled_for: scheduledFor,
      });
    } catch (err: any) {
      console.error('Failed to fetch post:', err);
      setError('Failed to load post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Convert tags string to array
      const tagsArray = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const updateData = {
        ...data,
        tags: tagsArray,
        featured_image: data.featured_image || undefined,
        scheduled_for: data.scheduled_for || undefined,
      };

      console.log('Updating post with data:', updateData);

      const response = await axios.put(`/posts/${postId}`, updateData);
      
      console.log('Post updated successfully:', response.data);
      router.push(`/posts/${postId}`);
    } catch (error: any) {
      console.error('Failed to update post:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to update post. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Auth check
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchPost}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/mypage"
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to My Posts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The post you're trying to edit doesn't exist.</p>
          <Link
            href="/mypage"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to My Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Work</h1>
              <p className="text-gray-600 mt-2">Update your creative work</p>
            </div>
            <Link
              href={`/posts/${postId}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Post
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{submitError}</div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your work's title"
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  {...register('summary')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief summary of your work (optional)"
                />
                {errors.summary && (
                  <p className="text-red-600 text-sm mt-1">{errors.summary.message}</p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  {...register('content')}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your story, poem, or creative work here..."
                />
                {errors.content && (
                  <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Work Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Word Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Word Count
                </label>
                <input
                  type="number"
                  {...register('word_count', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Auto-calculated"
                  readOnly
                />
              </div>

              {/* Chapter Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter Count
                </label>
                <input
                  type="number"
                  {...register('chapter_count', { valueAsNumber: true })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <select
                  {...register('rating')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Rating</option>
                  <option value="G">G - General Audiences</option>
                  <option value="T">T - Teen and Up</option>
                  <option value="M">M - Mature</option>
                  <option value="E">E - Explicit</option>
                </select>
              </div>

              {/* Completion Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('is_complete')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  This work is complete
                </label>
              </div>
            </div>

            {/* Content Warning */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Warnings
              </label>
              <input
                type="text"
                {...register('content_warning')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Violence, Strong Language, etc. (optional)"
              />
            </div>
          </div>

          {/* Tags and Media */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags & Media</h2>
            
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., romance, fantasy, enemies to lovers (separate with commas)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="url"
                  {...register('featured_image')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg (optional)"
                />
                {errors.featured_image && (
                  <p className="text-red-600 text-sm mt-1">{errors.featured_image.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Publishing Options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Publishing Options</h2>
            
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DRAFT">Save as Draft</option>
                  <option value="PUBLISHED">Publish Now</option>
                  <option value="SCHEDULED">Schedule for Later</option>
                  <option value="ARCHIVED">Archive</option>
                </select>
              </div>

              {/* Scheduled For */}
              {watchedStatus === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule For
                  </label>
                  <input
                    type="datetime-local"
                    {...register('scheduled_for')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled
                  />
                  <p className="text-sm text-amber-600 mt-1">
                    ⏰ Scheduling feature coming soon! Posts will be saved as drafts for now.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Link
              href={`/posts/${postId}`}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}