import { useState } from 'react';
import { Heart } from 'lucide-react';
import { wishlistAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface WishlistButtonProps {
  courseId: string;
  initialInWishlist?: boolean;
  onToggle?: (inWishlist: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  courseId,
  initialInWishlist = false,
  onToggle,
  size = 'md',
  className = '',
  showText = false,
}) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.showToast({ type: 'info', title: 'Vui lòng đăng nhập để sử dụng tính năng này' });
      return;
    }

    try {
      setLoading(true);
      if (inWishlist) {
        await wishlistAPI.removeFromWishlist(courseId);
        setInWishlist(false);
        toast.showToast({ type: 'success', title: 'Đã xóa khỏi danh sách yêu thích' });
        onToggle?.(false);
      } else {
        await wishlistAPI.addToWishlist(courseId);
        setInWishlist(true);
        toast.showToast({ type: 'success', title: 'Đã thêm vào danh sách yêu thích' });
        onToggle?.(true);
      }
    } catch (error: any) {
      toast.showToast({ type: 'error', title: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
      className={`inline-flex items-center gap-1.5 transition-colors ${
        inWishlist
          ? 'text-red-500 hover:text-red-600'
          : 'text-gray-400 hover:text-red-400'
      } disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`${sizeClasses[size]} ${loading ? 'animate-pulse' : ''} transition-all`}
        fill={inWishlist ? 'currentColor' : 'none'}
      />
      {showText && (
        <span className="text-sm font-medium">
          {inWishlist ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </button>
  );
};

export default WishlistButton;
