# E-Learning Platform - Production Deployment Guide

## 📋 Overview

Hướng dẫn đầy đủ để deploy E-Learning Platform lên production server.

## 🔧 System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **RAM**: 2GB (recommended: 4GB+)
- **CPU**: 2 cores (recommended: 4+ cores)
- **Storage**: 20GB (recommended: 50GB+)
- **Network**: Stable internet connection

### Software Requirements
- **Node.js**: v16.x or later
- **npm**: v8.x or later
- **MongoDB**: v5.x or later
- **PM2**: v5.x (for process management)
- **Nginx**: v1.18+ (for reverse proxy)
- **SSL Certificate**: Let's Encrypt or commercial

## 🚀 Production Deployment Steps

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/e-learning-platform.git
cd e-learning-platform/backend

# Install dependencies
npm install --production

# Create environment file
cp .env.production .env
# Edit .env with your production values
nano .env
```

### 3. Environment Configuration

Cập nhật file `.env` với thông tin production:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/elearning_prod

# JWT Secrets (generate strong secrets)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Production URL
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email configuration (use your email service)
EMAIL_SERVICE=smtp
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_email_password

# Payment gateways (use production keys)
VNPAY_TMN_CODE=your_production_vnpay_code
STRIPE_SECRET_KEY=sk_live_your_production_stripe_key
```

### 4. Database Setup

```bash
# Create production database
mongo
> use elearning_prod
> db.createUser({
    user: "elearning_user",
    pwd: "secure_password_here",
    roles: ["readWrite"]
  })
> exit

# Run database seeding (optional)
npm run seed
```

### 5. PM2 Process Management

Tạo file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'elearning-backend',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

Khởi động ứng dụng:

```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions printed by PM2

# Monitor application
pm2 monit
```

### 6. Nginx Configuration

Tạo file cấu hình Nginx `/etc/nginx/sites-available/elearning`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (assuming React build is served here)
    location / {
        root /var/www/elearning/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # File uploads
    location /uploads/ {
        alias /path/to/your/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Security: Hide server version
    server_tokens off;

    # File upload size limit
    client_max_body_size 50M;
}
```

Kích hoạt cấu hình:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/elearning /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. SSL Certificate Setup

Sử dụng Let's Encrypt để tạo SSL certificate miễn phí:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup (already configured by certbot)
sudo systemctl status certbot.timer
```

### 8. Database Backup Setup

Tạo script backup tự động:

```bash
#!/bin/bash
# /home/deploy/backup-db.sh

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="elearning_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create MongoDB dump
mongodump --db $DB_NAME --out $BACKUP_DIR/mongodb_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/mongodb_$DATE.tar.gz"
```

Thêm vào crontab:

```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1
```

### 9. Monitoring & Logging

#### Application Monitoring
```bash
# PM2 monitoring
pm2 install pm2-server-monit

# View logs
pm2 logs elearning-backend

# Monitor system resources
pm2 monit
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor disk space
df -h

# Monitor memory usage
free -h

# Monitor processes
htop
```

### 10. Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow MongoDB (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 27017

# Check firewall status
sudo ufw status
```

## 🔍 Health Checks & Maintenance

### Application Health
```bash
# Check API health
curl https://yourdomain.com/api/health

# Check PM2 processes
pm2 status

# Check application logs
pm2 logs elearning-backend --lines 100
```

### Database Health
```bash
# Check MongoDB status
sudo systemctl status mongod

# Connect to MongoDB
mongo elearning_prod

# Check database stats
> db.stats()
```

### System Health
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check system load
uptime

# Check nginx status
sudo systemctl status nginx
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   pm2 logs elearning-backend
   
   # Check environment variables
   pm2 env 0
   
   # Restart application
   pm2 restart elearning-backend
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check MongoDB logs
   sudo tail -f /var/log/mongodb/mongod.log
   
   # Test connection
   mongo --eval "db.adminCommand('ismaster')"
   ```

3. **High memory usage**
   ```bash
   # Check process memory
   pm2 monit
   
   # Restart application if needed
   pm2 restart elearning-backend
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate
   sudo certbot renew --dry-run
   ```

## 📊 Performance Optimization

### Database Optimization
```javascript
// Create indexes for better performance
db.users.createIndex({ email: 1 })
db.courses.createIndex({ status: 1, createdAt: -1 })
db.payments.createIndex({ user: 1, status: 1 })
db.learninganalytics.createIndex({ user: 1, course: 1 })
```

### Application Optimization
- Enable gzip compression in Nginx
- Set up Redis for caching (optional)
- Optimize database queries with indexes
- Use CDN for static assets
- Monitor and optimize API response times

## 🔐 Security Checklist

- [ ] Strong passwords for all accounts
- [ ] SSL certificate installed and configured
- [ ] Firewall configured properly
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] Regular backups tested
- [ ] Monitoring and logging active
- [ ] Error reporting configured

## 📞 Support

For deployment support or issues:
- Check application logs: `pm2 logs elearning-backend`
- Monitor system health: `pm2 monit`
- Review this documentation
- Contact: [your-support-email@domain.com]

---

**Note**: Always test deployment procedures in a staging environment before applying to production.