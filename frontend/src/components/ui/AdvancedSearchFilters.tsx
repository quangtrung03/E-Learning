import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { X, Filter, ChevronDown, ChevronUp, Star } from 'lucide-react';

interface FilterState {
  search: string;
  category: string;
  level: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  isFree: boolean | null;
  sort: string;
}

interface AdvancedSearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const CATEGORIES = [
  { value: '', label: 'Tất cả danh mục' },
  { value: 'programming', label: 'Lập trình' },
  { value: 'design', label: 'Thiết kế' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'language', label: 'Ngôn ngữ' },
  { value: 'science', label: 'Khoa học' },
  { value: 'data-science', label: 'Khoa học dữ liệu' },
  { value: 'personal-development', label: 'Phát triển bản thân' },
  { value: 'other', label: 'Khác' }
];

const LEVELS = [
  { value: '', label: 'Tất cả cấp độ' },
  { value: 'beginner', label: 'Mới bắt đầu' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Nâng cao' },
  { value: 'expert', label: 'Chuyên gia' }
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'popular', label: 'Phổ biến nhất' },
  { value: 'highest-rated', label: 'Đánh giá cao nhất' },
  { value: 'price-low-high', label: 'Giá thấp đến cao' },
  { value: 'price-high-low', label: 'Giá cao đến thấp' }
];

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFilterChange,
  isOpen,
  onToggle
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  const handleChange = (key: keyof FilterState, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      search: '',
      category: '',
      level: '',
      priceMin: 0,
      priceMax: 10000000,
      rating: 0,
      isFree: null,
      sort: 'newest'
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'search' || key === 'sort') return false;
    if (key === 'priceMin') return value > 0;
    if (key === 'priceMax') return value < 10000000;
    if (key === 'isFree') return value !== null;
    return value !== '' && value !== 0 && value !== null;
  }).length;

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Bộ lọc nâng cao</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Quick Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sắp xếp:</span>
          <select
            value={localFilters.sort}
            onChange={(e) => {
              handleChange('sort', e.target.value);
              onFilterChange({ ...localFilters, sort: e.target.value });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <input
                type="text"
                value={localFilters.search}
                onChange={(e) => handleChange('search', e.target.value)}
                placeholder="Tên khóa học..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={localFilters.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cấp độ
              </label>
              <select
                value={localFilters.level}
                onChange={(e) => handleChange('level', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng giá (VNĐ)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={localFilters.priceMin}
                  onChange={(e) => handleChange('priceMin', parseInt(e.target.value) || 0)}
                  placeholder="Từ"
                  min="0"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={localFilters.priceMax}
                  onChange={(e) => handleChange('priceMax', parseInt(e.target.value) || 10000000)}
                  placeholder="Đến"
                  min="0"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <input
                type="range"
                value={localFilters.priceMax}
                onChange={(e) => handleChange('priceMax', parseInt(e.target.value))}
                min="0"
                max="10000000"
                step="100000"
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{localFilters.priceMin.toLocaleString()}đ</span>
                <span>{localFilters.priceMax.toLocaleString()}đ</span>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá tối thiểu
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleChange('rating', star === localFilters.rating ? 0 : star)}
                    className={`p-1 rounded ${
                      star <= localFilters.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              {localFilters.rating > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {localFilters.rating} sao trở lên
                </p>
              )}
            </div>

            {/* Free/Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại khóa học
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChange('isFree', localFilters.isFree === true ? null : true)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-all ${
                    localFilters.isFree === true
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                  }`}
                >
                  Miễn phí
                </button>
                <button
                  onClick={() => handleChange('isFree', localFilters.isFree === false ? null : false)}
                  className={`flex-1 px-4 py-2 border rounded-lg transition-all ${
                    localFilters.isFree === false
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                  }`}
                >
                  Trả phí
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button onClick={handleApply} className="flex-1">
              Áp dụng bộ lọc
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <X className="w-4 h-4 mr-1" />
              Xóa bộ lọc
            </Button>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{activeFilterCount}</strong> bộ lọc đang hoạt động
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearchFilters;
