// src/app/create-post/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreatePostPage() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema)
  });
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loading } = useAuth();
  
  // Watch the tags input for real-time preview
  const tagsInput = watch('tags');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Function to parse hashtags from text
  const parseHashtags = (text: string): string[] => {
    if (!text) return [];
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : []; // Remove # symbol
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      // Parse tags from the tags input
      const parsedTags = parseHashtags(data.tags || '');
      
      // Prepare data for backend
      const postData = {
        title: data.title,
        content: data.content,
        tags: parsedTags.length > 0 ? parsedTags : undefined
      };
      
      const res = await axios.post('/posts', postData);
      console.log(res.data);
      router.push('/mypage'); // Redirect to mypage after successful creation
    } catch (err) {
      console.error(err);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Post</h1>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                {...register('title')}
                id="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter post title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                {...register('content')}
                id="content"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your post content here..."
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                {...register('tags')}
                id="tags"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add tags like #javascript #webdev #tutorial"
              />
              <p className="text-gray-500 text-sm mt-1">
                Use hashtags like Twitter: #javascript #webdev #tutorial
              </p>
              {/* Preview parsed tags */}
              {tagsInput && parseHashtags(tagsInput).length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">Detected tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {parseHashtags(tagsInput).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {errors.tags && (
                <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 