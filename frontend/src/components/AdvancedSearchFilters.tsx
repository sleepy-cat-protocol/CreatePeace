'use client';

import { useState } from 'react';
import { 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface SearchFilters {
  type: 'all' | 'posts' | 'users' | 'tags';
  dateFrom: string;
  dateTo: string;
  sortBy: 'relevance' | 'date' | 'likes' | 'title' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  isLoading = false,
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.type !== 'all' ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.sortBy !== 'relevance' ||
      filters.sortOrder !== 'desc'
    );
  };

  const getSortOptions = () => {
    const baseOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'date', label: 'Date' },
    ];

    if (filters.type === 'posts' || filters.type === 'all') {
      baseOptions.push(
        { value: 'likes', label: 'Likes' },
        { value: 'title', label: 'Title' }
      );
    }

    if (filters.type === 'users' || filters.type === 'all') {
      baseOptions.push({ value: 'name', label: 'Name' });
    }

    return baseOptions;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Toggle Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Advanced Filters</span>
            {hasActiveFilters() && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Content Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Content</option>
              <option value="posts">Posts Only</option>
              <option value="users">Users Only</option>
              <option value="tags">Tags Only</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Published From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Published To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getSortOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">
                  {filters.sortBy === 'date' ? 'Newest First' : 
                   filters.sortBy === 'likes' ? 'Most Liked' : 
                   filters.sortBy === 'title' || filters.sortBy === 'name' ? 'Z to A' : 
                   'Most Relevant'}
                </option>
                <option value="asc">
                  {filters.sortBy === 'date' ? 'Oldest First' : 
                   filters.sortBy === 'likes' ? 'Least Liked' : 
                   filters.sortBy === 'title' || filters.sortBy === 'name' ? 'A to Z' : 
                   'Least Relevant'}
                </option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onResetFilters}
              disabled={!hasActiveFilters() || isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>

            <button
              onClick={onApplyFilters}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Searching...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
