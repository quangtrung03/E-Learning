const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'E-Learning Platform API',
    version: '1.0.0',
    description: 'API documentation cho hệ thống học trực tuyến',
    contact: {
      name: 'API Support',
      email: 'support@elearning.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development server'
    },
    {
      url: 'https://your-production-url.com/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập JWT token để authenticate'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          _id: {
            type: 'string',
            description: 'User ID'
          },
          name: {
            type: 'string',
            description: 'Họ và tên',
            example: 'Nguyễn Văn A'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email đăng nhập',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'Mật khẩu (min 6 ký tự)',
            example: '123456'
          },
          isAdmin: {
            type: 'boolean',
            description: 'Người dùng có phải admin không',
            example: false
          },
          avatar: {
            type: 'string',
            description: 'URL avatar'
          },
          phone: {
            type: 'string',
            description: 'Số điện thoại'
          },
          bio: {
            type: 'string',
            description: 'Tiểu sử'
          },
          isActive: {
            type: 'boolean',
            description: 'Trạng thái tài khoản'
          },
          enrolledCourses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                course: { type: 'string' },
                enrolledAt: { type: 'string', format: 'date-time' },
                progress: { type: 'number', minimum: 0, maximum: 100 }
              }
            }
          },
          createdCourses: {
            type: 'array',
            items: { type: 'string' }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Course: {
        type: 'object',
        required: ['title', 'description', 'category', 'price', 'duration'],
        properties: {
          _id: {
            type: 'string',
            description: 'Course ID'
          },
          title: {
            type: 'string',
            maxLength: 200,
            description: 'Tiêu đề khóa học',
            example: 'Khóa học React cơ bản'
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Mô tả chi tiết',
            example: 'Học React từ cơ bản đến nâng cao'
          },
          instructor: {
            $ref: '#/components/schemas/User'
          },
          category: {
            type: 'string',
            enum: ['programming', 'design', 'business', 'marketing', 'language', 'science', 'other'],
            description: 'Danh mục khóa học',
            example: 'programming'
          },
          level: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            description: 'Cấp độ',
            example: 'beginner'
          },
          price: {
            type: 'number',
            minimum: 0,
            description: 'Giá khóa học (VNĐ)',
            example: 299000
          },
          discount: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Phần trăm giảm giá',
            example: 10
          },
          thumbnail: {
            type: 'string',
            description: 'URL hình ảnh'
          },
          duration: {
            type: 'number',
            minimum: 1,
            description: 'Thời lượng (phút)',
            example: 120
          },
          lessons: {
            type: 'array',
            items: { type: 'string' }
          },
          students: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                student: { type: 'string' },
                enrolledAt: { type: 'string', format: 'date-time' },
                progress: { type: 'number' }
              }
            }
          },
          rating: {
            type: 'object',
            properties: {
              average: { type: 'number', minimum: 0, maximum: 5 },
              count: { type: 'number', minimum: 0 }
            }
          },
          isPublished: {
            type: 'boolean',
            description: 'Trạng thái xuất bản'
          },
          requirements: {
            type: 'array',
            items: { type: 'string' }
          },
          whatYouWillLearn: {
            type: 'array',
            items: { type: 'string' }
          },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          token: {
            type: 'string',
            description: 'JWT token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
