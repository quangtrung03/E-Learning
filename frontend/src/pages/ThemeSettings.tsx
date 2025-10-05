import { motion } from 'framer-motion';
import { Palette, Monitor, Settings, Eye } from 'lucide-react';
import { useTheme, ThemePreview, ThemeSwitcher } from '../themes';
import { Card } from '../components/ui/Card';

const ThemeSettings = () => {
  const { currentTheme, themeConfig, setTheme, availableThemes } = useTheme();

  const themeDescriptions = {
    light: 'Chế độ sáng cổ điển với màu sắc nhẹ nhàng, phù hợp cho làm việc ban ngày và đọc nhiều văn bản.',
    dark: 'Chế độ tối giúp giảm mỏi mắt trong điều kiện ánh sáng thấp, tiết kiệm pin và tạo cảm giác tập trung.',
    cyber: 'Phong cách cyber futuristic với màu neon, tạo cảm giác hiện đại và công nghệ cao.',
    cute: 'Giao diện đáng yêu với màu sắc pastel, bo góc mềm mại, phù hợp cho người yêu thích sự dễ thương.',
  };

  const themeFeatures = {
    light: [
      'High contrast cho khả năng đọc tốt',
      'Màu sắc tự nhiên',
      'Phù hợp mọi thiết bị',
      'Tiết kiệm pin màn hình LCD'
    ],
    dark: [
      'Giảm mỏi mắt trong ánh sáng yếu',
      'Tiết kiệm pin OLED',
      'Tập trung cao',
      'Phong cách hiện đại'
    ],
    cyber: [
      'Hiệu ứng neon độc đáo',
      'Phong cách sci-fi',
      'Màu sắc sống động',
      'Trải nghiệm tương lai'
    ],
    cute: [
      'Màu sắc pastel dễ thương',
      'Bo góc mềm mại',
      'Giao diện thân thiện',
      'Cảm giác vui tươi'
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Palette className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Cài đặt giao diện
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Tùy chỉnh giao diện theo sở thích của bạn. Chọn theme phù hợp với phong cách và nhu cầu sử dụng.
          </motion.p>
        </div>

        {/* Current Theme Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Theme hiện tại
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {themeConfig.displayName}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Chuyển đổi nhanh:
                </span>
                <ThemeSwitcher variant="toggle" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Theme Selection Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Chọn theme
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableThemes.map((theme) => (
              <motion.div
                key={theme}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * availableThemes.indexOf(theme) }}
              >
                <div 
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    currentTheme === theme 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setTheme(theme)}
                >
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {themeConfig.name === theme ? themeConfig.displayName : theme}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {themeDescriptions[theme as keyof typeof themeDescriptions]}
                      </p>
                    </div>
                    {currentTheme === theme && (
                      <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                          Đang dùng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Theme Preview */}
                  <div className="mb-4">
                    <ThemePreview 
                      theme={theme}
                      isActive={currentTheme === theme}
                      onClick={() => setTheme(theme)}
                    />
                  </div>

                  {/* Theme Features */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Đặc điểm:
                    </h4>
                    <ul className="space-y-1">
                      {themeFeatures[theme as keyof typeof themeFeatures].map((feature, index) => (
                        <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme(theme);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      currentTheme === theme
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
                    }`}
                  >
                    {currentTheme === theme ? 'Đang sử dụng' : 'Áp dụng theme'}
                  </motion.button>
                </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Theme Customization Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Mẹo sử dụng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tối ưu trải nghiệm:</h4>
                <ul className="space-y-1">
                  <li>• Theme sáng phù hợp cho ban ngày</li>
                  <li>• Theme tối giảm mỏi mắt ban đêm</li>
                  <li>• Theme cyber cho cảm giác hiện đại</li>
                  <li>• Theme cute tạo không khí vui tươi</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Chuyển đổi nhanh:</h4>
                <ul className="space-y-1">
                  <li>• Sử dụng nút chuyển đổi ở header</li>
                  <li>• Theme được lưu tự động</li>
                  <li>• Có thể thay đổi bất cứ lúc nào</li>
                  <li>• Đồng bộ trên tất cả thiết bị</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ThemeSettings;