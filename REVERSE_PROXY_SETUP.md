# Reverse Proxy Setup Guide

This guide will help you set up a reverse proxy (Nginx or Apache) for the Honey Badger AI Gifts application.

## Why Use a Reverse Proxy?

- **SSL/TLS termination** - Handle HTTPS encryption
- **Static file serving** - Serve CSS, JS, images faster
- **Load balancing** - Distribute traffic across multiple Node.js instances
- **Security** - Add security headers, rate limiting, DDoS protection
- **Caching** - Cache responses for better performance
- **Domain management** - Route multiple domains/apps on one server

---

## Option 1: Nginx (Recommended)

### Why Nginx?
- Better performance for Node.js reverse proxying
- Lower memory usage
- Simpler configuration
- Industry standard for Node.js apps

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
```

**macOS:**
```bash
brew install nginx
```

### Configuration Steps

1. **Copy the Nginx configuration:**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/honeybadger
```

2. **Edit the configuration:**
```bash
sudo nano /etc/nginx/sites-available/honeybadger
```

Replace the following:
- `your-domain.com` → Your actual domain
- `/var/www/honeybadger/` → Path to your app directory

3. **Create symbolic link to enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/honeybadger /etc/nginx/sites-enabled/
```

4. **Test Nginx configuration:**
```bash
sudo nginx -t
```

5. **Remove default site (optional):**
```bash
sudo rm /etc/nginx/sites-enabled/default
```

6. **Restart Nginx:**
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx  # Enable on boot
```

### Setup Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/honeybadger

# Copy your application files
sudo cp -r /path/to/honey-badger-ai-gifts/* /var/www/honeybadger/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/honeybadger
# Or on CentOS/RHEL: sudo chown -R nginx:nginx /var/www/honeybadger
```

### Start Node.js App

You'll need to keep the Node.js app running. Use PM2 (recommended):

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app
cd /var/www/honeybadger
pm2 start server.js --name honeybadger

# Enable PM2 to start on boot
pm2 startup
pm2 save
```

### Verify Setup

1. Check Nginx status:
```bash
sudo systemctl status nginx
```

2. Check Node.js app:
```bash
pm2 status
pm2 logs honeybadger
```

3. Test in browser:
```
http://your-domain.com
```

---

## Option 2: Apache

### Why Apache?
- More familiar to some users
- .htaccess support
- Broader module ecosystem

### Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install apache2
```

**CentOS/RHEL:**
```bash
sudo yum install httpd
```

**macOS:**
```bash
brew install httpd
```

### Enable Required Modules

**Ubuntu/Debian:**
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl
```

**CentOS/RHEL:**
Edit `/etc/httpd/conf/httpd.conf` and uncomment LoadModule lines for:
- mod_proxy
- mod_proxy_http
- mod_headers
- mod_rewrite
- mod_ssl

### Configuration Steps

1. **Copy the Apache configuration:**

**Ubuntu/Debian:**
```bash
sudo cp apache.conf /etc/apache2/sites-available/honeybadger.conf
```

**CentOS/RHEL:**
```bash
sudo cp apache.conf /etc/httpd/conf.d/honeybadger.conf
```

2. **Edit the configuration:**
```bash
# Ubuntu/Debian:
sudo nano /etc/apache2/sites-available/honeybadger.conf

# CentOS/RHEL:
sudo nano /etc/httpd/conf.d/honeybadger.conf
```

Replace:
- `your-domain.com` → Your actual domain
- `/var/www/honeybadger` → Path to your app directory
- `${APACHE_LOG_DIR}` → `/var/log/apache2` (Ubuntu) or `/var/log/httpd` (CentOS)

3. **Enable the site (Ubuntu/Debian only):**
```bash
sudo a2ensite honeybadger
sudo a2dissite 000-default  # Disable default site (optional)
```

4. **Test Apache configuration:**
```bash
# Ubuntu/Debian:
sudo apache2ctl configtest

# CentOS/RHEL:
sudo apachectl configtest
```

5. **Restart Apache:**
```bash
# Ubuntu/Debian:
sudo systemctl restart apache2
sudo systemctl enable apache2

# CentOS/RHEL:
sudo systemctl restart httpd
sudo systemctl enable httpd
```

### Setup Application Directory

Same as Nginx - see above.

---

## SSL/HTTPS Setup with Let's Encrypt

### Install Certbot

**Ubuntu/Debian (Nginx):**
```bash
sudo apt install certbot python3-certbot-nginx
```

**Ubuntu/Debian (Apache):**
```bash
sudo apt install certbot python3-certbot-apache
```

### Get SSL Certificate

**For Nginx:**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**For Apache:**
```bash
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

Certbot will automatically:
- Obtain SSL certificates
- Update your configuration
- Set up auto-renewal

### Manual SSL Configuration

If you prefer manual setup, uncomment the SSL sections in `nginx.conf` or `apache.conf` and update certificate paths.

---

## Firewall Configuration

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 'Nginx Full'  # or 'Apache Full'
sudo ufw allow 22  # SSH
sudo ufw enable
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## Environment Variables

Make sure your `.env` file is configured:

```bash
cd /var/www/honeybadger
sudo nano .env
```

Update:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-production-secret-here
BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```

---

## Process Management with PM2

### Useful PM2 Commands

```bash
# Start app
pm2 start server.js --name honeybadger

# View logs
pm2 logs honeybadger

# Restart app
pm2 restart honeybadger

# Stop app
pm2 stop honeybadger

# Monitor
pm2 monit

# List all processes
pm2 list

# Save configuration
pm2 save

# Startup script
pm2 startup
```

### Update Application

```bash
# Pull latest changes
cd /var/www/honeybadger
git pull

# Install dependencies
npm install --production

# Restart app
pm2 restart honeybadger

# Reload Nginx/Apache if config changed
sudo systemctl reload nginx
# or
sudo systemctl reload apache2
```

---

## Monitoring & Logs

### Nginx Logs
```bash
# Access log
sudo tail -f /var/log/nginx/honeybadger-access.log

# Error log
sudo tail -f /var/log/nginx/honeybadger-error.log
```

### Apache Logs
```bash
# Ubuntu/Debian
sudo tail -f /var/log/apache2/honeybadger-access.log
sudo tail -f /var/log/apache2/honeybadger-error.log

# CentOS/RHEL
sudo tail -f /var/log/httpd/honeybadger-access.log
sudo tail -f /var/log/httpd/honeybadger-error.log
```

### Application Logs
```bash
pm2 logs honeybadger
```

---

## Troubleshooting

### Node.js app not accessible through proxy

1. Check if Node.js is running:
```bash
pm2 status
curl http://localhost:3000
```

2. Check proxy is running:
```bash
sudo systemctl status nginx
# or
sudo systemctl status apache2
```

3. Check firewall:
```bash
sudo ufw status
# or
sudo firewall-cmd --list-all
```

### 502 Bad Gateway Error

- Node.js app is not running
- Wrong port in proxy config
- SELinux blocking (CentOS/RHEL):
```bash
sudo setsebool -P httpd_can_network_connect 1
```

### Static files not loading

- Check file paths in proxy config
- Check file permissions:
```bash
sudo chown -R www-data:www-data /var/www/honeybadger
# or
sudo chown -R nginx:nginx /var/www/honeybadger
```

### Check Configuration

**Nginx:**
```bash
sudo nginx -t
```

**Apache:**
```bash
sudo apachectl configtest
```

---

## Performance Optimization

### Nginx Tuning

Add to `http` block in `/etc/nginx/nginx.conf`:

```nginx
# Worker processes
worker_processes auto;

# Connection limits
events {
    worker_connections 2048;
}

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json;

# File cache
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
```

### PM2 Cluster Mode

Run multiple Node.js instances:

```bash
pm2 start server.js -i max --name honeybadger
```

This will spawn one process per CPU core.

---

## Next Steps

1. Set up automated backups
2. Configure monitoring (New Relic, DataDog, etc.)
3. Set up log rotation
4. Configure rate limiting
5. Add fail2ban for security
6. Set up CI/CD pipeline

---

## Support

For issues:
- Nginx: https://nginx.org/en/docs/
- Apache: https://httpd.apache.org/docs/
- PM2: https://pm2.keymetrics.io/docs/
- Let's Encrypt: https://letsencrypt.org/docs/

For Honey Badger app issues: Open an issue on GitHub
