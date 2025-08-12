'use client';

import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';

interface Post {
    id: string;
    title: string;
    content: string;
    author_id: string;
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

interface EditPostFormProps {
    postId: string;
}

export default function EditPostForm({ postId }: EditPostFormProps) {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [post, setPost] = useState<Post | null>(null);
    const [tags, setTags] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    
    useEffect(() => {
        if (!isAuthenticated && !authLoading) {
            router.push('/login');
            return;
        }

        if (isAuthenticated) {
            fetchPost();
        }

    }, [isAuthenticated, authLoading, router]);

    const fetchPost = async () => {
        try{
            setLoading(true);
            setError(null);
            const response = await axios.get(`/posts/${postId}`);
            setPost(response.data);
            setLoading(false);
            console.log('Post fetched:', response);

            setTitle(response.data.title);
            setContent(response.data.content);

            const tagNames = response.data.tags.map((tag: any) => tag.tag.name);
            setTags(tagNames.join(', '));


        }catch(err: any) {
            if (err.response?.status === 401) {
                setError('You need to be logged in to edit posts.');
                router.push('/login');
              } else if (err.response?.status === 404) {
                setError('Post not found.');
              } else {
                setError('Failed to load post. Please try again.');
              }
        }finally{
            setLoading(false);
        }
    };

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required.');
            return;
        }

        try{
            setSaving(true);
            setError(null);

            const tagArray = tags.split(', ').map((tag) => tag.trim());
            const updatedPost = {
                title: title.trim(),
                content: content.trim(),
                tags: tagArray
            };

            const response = await axios.put(`/posts/${postId}`, updatedPost);
            console.log('Successfully updated! Post updated:', response.data);
            router.push(`/posts/${postId}`);

        }catch(err: any) {
            if (err.response?.status === 401) {
                setError('You need to be logged in to edit posts.');
                router.push('/login');
            } else if (err.response?.status === 403) {
                setError('You can only edit your own posts.');
            } else if (err.response?.status === 404) {
                setError('Post not found.');
            } else {
                setError('Failed to update post. Please try again.');
            }
        }finally{
            setSaving(false);
        }
    };

    if (authLoading || loading) {
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

    if (error && !title) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/mypage" className="bg-gray-600 text-white px-6 py-2 rounded-md">
                Back to My Posts
              </Link>
            </div>
          </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
              <Link href={`/posts/${postId}`} className="text-blue-600 hover:text-blue-800">
                ← Back to Post
              </Link>
            </div>
    
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-red-800">{error}</div>
                  </div>
                )}
    
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
    
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
    
                <div className="flex justify-between pt-6 border-t">
                  <Link
                    href={`/posts/${postId}`}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
    );
    
}