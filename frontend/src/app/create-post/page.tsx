'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

export default function CreatePostPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'DRAFT',
      chapter_count: 1,
      is_complete: true,
      rating: 'T',
    },
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
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Convert tags string to array
      const tagsArray = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const postData = {
        ...data,
        tags: tagsArray,
        featured_image: data.featured_image || undefined,
        scheduled_for: data.scheduled_for || undefined,
      };

      console.log('Submitting post data:', postData);

      const response = await axios.post('/posts', postData);
      
      console.log('Post created successfully:', response.data);
      router.push(`/users/${user?.username || user?.id}/dashboard`);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to create post. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Work</h1>
              <p className="text-gray-600 mt-2">Share your creative work with the community</p>
            </div>
            <Link
              href={`/users/${user?.username || user?.id}/dashboard`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to My Page
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
              href={`/users/${user?.username || user?.id}/dashboard`}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}