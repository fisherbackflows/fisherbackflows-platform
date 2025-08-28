# 🚀 Fisher Backflows Production Deployment Guide

This comprehensive guide will help you deploy the Fisher Backflows automation platform to production with enterprise-grade reliability, security, and performance.

## 📋 Pre-Deployment Checklist

### 1. Infrastructure Requirements
- [ ] **Server**: Minimum 4GB RAM, 2 CPU cores, 50GB SSD
- [ ] **Domain**: Registered domain name (e.g., fisherbackflows.com)
- [ ] **SSL Certificate**: Valid SSL/TLS certificate for HTTPS
- [ ] **Database**: Supabase project or PostgreSQL instance
- [ ] **Email**: Gmail account with app password for notifications
- [ ] **Payments**: Stripe account for payment processing
- [ ] **Monitoring**: Optional Grafana/Prometheus setup

### 2. Required Accounts & Services
- [ ] **Supabase**: Database and real-time features
- [ ] **Stripe**: Payment processing
- [ ] **Gmail**: Automated email notifications
- [ ] **Google Cloud**: Calendar integration (optional)
- [ ] **AWS/DigitalOcean**: Cloud hosting (optional)
- [ ] **Cloudflare**: CDN and security (recommended)

## 🛠 Installation Steps

### Step 1: Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install additional tools
sudo apt install -y git curl wget htop
```

### Step 2: Clone and Configure
```bash
# Clone the repository
git clone https://github.com/your-username/fisherbackflows.git
cd fisherbackflows

# Copy and configure environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your actual values

# Create required directories
mkdir -p logs backups ssl
sudo chown -R 1001:1001 logs backups
```

### Step 3: SSL Certificate Setup
```bash
# Using Certbot (Let's Encrypt) - Recommended
sudo apt install -y certbot
sudo certbot certonly --standalone -d fisherbackflows.com -d www.fisherbackflows.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/fisherbackflows.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/fisherbackflows.com/privkey.pem ./ssl/
sudo chown -R 1001:1001 ssl/

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Step 4: Database Setup (Supabase)
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy URL and API keys to `.env.production`

2. **Run Database Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login and link project
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Push schema
   supabase db push
   ```

3. **Set Up Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
   ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
   
   -- Create security policies (see SETUP_GUIDE.md for complete policies)
   ```

### Step 5: Configure External Services

#### Stripe Setup
1. Create Stripe account and get API keys
2. Set up webhook endpoint: `https://fisherbackflows.com/api/webhooks/stripe`
3. Configure webhook events: `payment_intent.succeeded`, `invoice.payment_succeeded`

#### Gmail Setup
1. Enable 2-factor authentication on Gmail
2. Generate app password for SMTP
3. Add credentials to `.env.production`

#### Google Calendar (Optional)
1. Create Google Cloud project
2. Enable Calendar API
3. Create OAuth 2.0 credentials
4. Add to `.env.production`

### Step 6: Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Step 7: Nginx Configuration
Create `/etc/nginx/sites-available/fisherbackflows`:
```nginx
server {
    listen 80;
    server_name fisherbackflows.com www.fisherbackflows.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name fisherbackflows.com www.fisherbackflows.com;

    ssl_certificate /path/to/ssl/fullchain.pem;
    ssl_certificate_key /path/to/ssl/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fisherbackflows /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Production Optimizations

### 1. Performance Tuning
```bash
# System limits
echo "fs.file-max = 65536" >> /etc/sysctl.conf
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
sysctl -p

# Docker resource limits
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Monitoring Setup
```bash
# Access Grafana dashboard
open http://your-server:3001
# Login: admin / your-grafana-password

# Configure Prometheus data source
# Import Fisher Backflows dashboard (dashboard.json)
```

### 3. Backup Configuration
```bash
# Test backup system
docker-compose exec app npm run backup:test

# Set up automated backups
crontab -e
# Add: 0 2 * * * docker-compose exec app npm run backup:daily
```

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Fail2Ban Setup
```bash
# Install and configure Fail2Ban
sudo apt install -y fail2ban

# Create jail configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add custom filters for application
sudo cp fail2ban/fisher-backflows.conf /etc/fail2ban/jail.d/
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Log Monitoring
```bash
# Set up log rotation
sudo cp logrotate.conf /etc/logrotate.d/fisher-backflows

# Monitor security logs
sudo tail -f /var/log/auth.log
docker-compose logs -f app | grep -i security
```

## 📊 Monitoring & Maintenance

### Health Checks
- **Application**: `https://fisherbackflows.com/health`
- **Database**: Supabase dashboard
- **Services**: `docker-compose ps`
- **SSL**: `openssl s_client -connect fisherbackflows.com:443`

### Regular Maintenance Tasks
```bash
# Weekly system updates
sudo apt update && sudo apt upgrade -y
docker-compose pull
docker-compose up -d

# Monthly security audit
docker-compose exec app npm run security:audit

# Quarterly backup testing
docker-compose exec app npm run backup:restore-test
```

### Log Analysis
```bash
# View application logs
docker-compose logs -f app

# Monitor resource usage
docker stats

# Check disk space
df -h
du -sh logs/ backups/
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Verify environment variables
docker-compose config

# Restart specific service
docker-compose restart app
```

#### 2. Database Connection Issues
```bash
# Test Supabase connection
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://YOUR_PROJECT.supabase.co/rest/v1/customers

# Check network connectivity
docker-compose exec app ping supabase.co
```

#### 3. SSL Certificate Problems
```bash
# Verify certificate
openssl x509 -in ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Update certificates in containers
docker-compose restart nginx
```

#### 4. Performance Issues
```bash
# Check resource usage
docker stats
htop

# Analyze slow queries
docker-compose logs app | grep "slow"

# Clear application cache
docker-compose exec app npm run cache:clear
```

### Emergency Procedures

#### 1. Service Outage
```bash
# Quick restart
docker-compose restart

# Rollback deployment
git checkout previous-stable-tag
docker-compose up -d --build
```

#### 2. Database Issues
```bash
# Emergency backup
docker-compose exec app npm run backup:emergency

# Restore from backup
docker-compose exec app npm run backup:restore BACKUP_ID
```

## 📞 Support & Updates

### Getting Help
- **Documentation**: Check SETUP_GUIDE.md for detailed configuration
- **Logs**: Always include relevant logs when reporting issues
- **Health Status**: Share output of `/health` endpoint

### Updates & Maintenance
- **Security Updates**: Apply immediately
- **Feature Updates**: Test in staging environment first
- **Database Migrations**: Always backup before running

### Contact Information
- **Technical Support**: [Your Support Email]
- **Emergency Contact**: [Emergency Phone]
- **Documentation**: [Your Documentation URL]

---

## 🎉 Deployment Complete!

Your Fisher Backflows automation platform is now running in production with:

✅ **Enterprise Security**: SSL, rate limiting, authentication  
✅ **High Performance**: Caching, optimization, CDN  
✅ **Monitoring**: Health checks, metrics, alerts  
✅ **Backup & Recovery**: Automated backups, disaster recovery  
✅ **Scalability**: Container orchestration, load balancing  

Visit your platform at `https://fisherbackflows.com` and start automating your backflow testing business!