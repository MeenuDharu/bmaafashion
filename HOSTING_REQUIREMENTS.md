# SpireGrocer - Server Hosting Requirements

## Executive Summary

SpireGrocer is a full-stack e-commerce application built with React (frontend) and Express.js (backend), requiring a production-grade hosting environment with PostgreSQL database, file storage, and third-party service integrations.

---

## 1. Server Specifications

### Minimum Requirements

| Component     | Specification      | Justification                                                             |
| ------------- | ------------------ | ------------------------------------------------------------------------- |
| **CPU**       | 2 vCPUs (2.0 GHz+) | Handle concurrent requests, image processing (Sharp), and background jobs |
| **RAM**       | 4 GB               | Node.js runtime, PostgreSQL connections, session storage, caching         |
| **Storage**   | 50 GB SSD          | Application code, database, uploaded images, logs, backups                |
| **Bandwidth** | 1 TB/month         | Product images, API traffic, static assets                                |
| **Network**   | 100 Mbps+          | Fast content delivery for images and API responses                        |

### Recommended Requirements (Production)

| Component     | Specification      | Justification                                             |
| ------------- | ------------------ | --------------------------------------------------------- |
| **CPU**       | 4 vCPUs (2.4 GHz+) | Better performance under load, faster image processing    |
| **RAM**       | 8 GB               | Improved caching, handle traffic spikes, multiple workers |
| **Storage**   | 100 GB SSD         | Growth capacity for images, database, backups             |
| **Bandwidth** | 2 TB/month         | Accommodate traffic growth                                |
| **Network**   | 1 Gbps             | Optimal performance for concurrent users                  |

---

## 2. Operating System & Runtime

### Operating System

- **Recommended**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- **Alternative**: Debian 11/12, CentOS Stream 9, RHEL 9
- **Windows**: Windows Server 2022 (supported but not recommended)

### Node.js Runtime

- **Required Version**: Node.js 20.x LTS (minimum 20.16.11)
- **Package Manager**: npm 10.x or pnpm 8.x
- **Process Manager**: PM2 (recommended) or systemd

### Additional System Requirements

```bash
# Required system packages
- build-essential (for native modules)
- python3 (for node-gyp)
- libvips (for Sharp image processing)
- git (for deployment)
- curl/wget (for downloads)
```

---

## 3. Database Requirements

### PostgreSQL Database

| Specification   | Requirement                                          |
| --------------- | ---------------------------------------------------- |
| **Version**     | PostgreSQL 14.x, 15.x, or 16.x                       |
| **Storage**     | 20 GB minimum (50 GB recommended)                    |
| **Connections** | 100 concurrent connections minimum                   |
| **Extensions**  | `pg_trgm` (for text search), `uuid-ossp` (for UUIDs) |
| **Backup**      | Daily automated backups with 7-day retention         |
| **Performance** | Shared buffers: 1-2 GB, Effective cache: 4 GB        |

### Database Connection Pooling

- **Max Pool Size**: 20-50 connections
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 10 seconds

### Managed Database Options

- **AWS RDS** for PostgreSQL (recommended)
- **Google Cloud SQL** for PostgreSQL
- **Azure Database** for PostgreSQL
- **DigitalOcean Managed Databases**
- **Neon** (serverless PostgreSQL)
- **Supabase** (PostgreSQL with additional features)

---

## 4. File Storage Requirements

### Local Storage (if not using cloud storage)

- **Path**: `/var/www/spiregrocer/uploads` or similar
- **Capacity**: 30 GB minimum (for product images, user uploads)
- **Permissions**: Read/write for application user
- **Backup**: Daily backups to separate location

### Cloud Storage Options (Recommended)

#### AWS S3

- **Bucket**: Public read, private write
- **Region**: Same as application server
- **CDN**: CloudFront for faster delivery
- **Estimated Cost**: $5-20/month (based on 10-50 GB storage)

#### Alternatives

- **Google Cloud Storage** (with Cloud CDN)
- **Azure Blob Storage** (with Azure CDN)
- **DigitalOcean Spaces** (built-in CDN)
- **Cloudflare R2** (zero egress fees)

### Image Processing

- **Library**: Sharp (already included)
- **Formats**: JPEG, PNG, WebP, AVIF
- **Max Upload Size**: 10 MB per file
- **Processing**: Automatic resizing, optimization, format conversion

---

## 5. Third-Party Service Requirements

### Payment Gateway - Razorpay

| Requirement      | Details                                       |
| ---------------- | --------------------------------------------- |
| **Account Type** | Business account with KYC verification        |
| **Mode**         | Live/Production mode                          |
| **API Keys**     | Key ID and Key Secret (live credentials)      |
| **Webhook**      | Configure webhook endpoint for payment status |
| **Compliance**   | GST registration, business verification       |
| **Settlement**   | Bank account for fund settlement              |

**Estimated Costs**: 2% + ₹0 per transaction (standard pricing)

### Email Service - SendGrid

| Requirement               | Details                                                |
| ------------------------- | ------------------------------------------------------ |
| **Plan**                  | Essentials plan minimum (40,000 emails/month)          |
| **API Key**               | Full access API key with Mail Send permission          |
| **Domain Verification**   | SPF, DKIM, DMARC records configured                    |
| **Sender Authentication** | Verified sender email or domain                        |
| **Templates**             | Order confirmation, shipping, delivery, password reset |
| **IP Reputation**         | Dedicated IP (optional, for high volume)               |

**Estimated Costs**: $19.95/month (Essentials) or $89.95/month (Pro)

### SMS Service - Twilio

| Requirement           | Details                                    |
| --------------------- | ------------------------------------------ |
| **Account**           | Upgraded account (not trial)               |
| **Phone Number**      | India-compatible number (+91)              |
| **Messaging Service** | Configured for transactional SMS           |
| **Compliance**        | A2P registration, DLT registration (India) |
| **Templates**         | Order updates, OTP, delivery notifications |

**Estimated Costs**: $1/month per number + $0.0079 per SMS (India)

### WhatsApp Business API - Twilio

| Requirement      | Details                                |
| ---------------- | -------------------------------------- |
| **Account**      | WhatsApp Business API access           |
| **Verification** | Facebook Business Manager verification |
| **Templates**    | Pre-approved message templates         |
| **Number**       | WhatsApp-enabled Twilio number         |
| **Compliance**   | WhatsApp Business Policy compliance    |

**Estimated Costs**: $0.005-0.009 per message (India)

### Optional Services

#### CDN (Content Delivery Network)

- **Cloudflare** (Free tier available)
- **AWS CloudFront**
- **Fastly**
- **BunnyCDN** (cost-effective)

#### Monitoring & Error Tracking

- **Sentry** (error tracking) - Free tier: 5K errors/month
- **New Relic** (APM) - Free tier available
- **Datadog** (monitoring) - Free tier: 5 hosts
- **UptimeRobot** (uptime monitoring) - Free tier: 50 monitors

---

## 6. Environment Variables

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
DOMAIN=https://yourdomain.com

# Security
SESSION_SECRET=<64-character-random-string>
JWT_SECRET=<64-character-random-string>

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Payment Gateway
RAZORPAY_KEY_ID=<live-key-id>
RAZORPAY_KEY_SECRET=<live-key-secret>

# Email Service
SENDGRID_API_KEY=<production-api-key>
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
CONTACT_FORM_RECIPIENT_EMAIL=contact@yourdomain.com

# SMS Service (Optional)
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX

# WhatsApp Service (Optional)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# SMTP (Alternative to SendGrid)
SMTP_EMAIL=<email@gmail.com>
SMTP_PASSWORD=<app-specific-password>
```

### Generating Secure Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 48

# Generate JWT_SECRET
openssl rand -base64 48
```

---

## 7. SSL/TLS Certificate

### Requirements

- **Certificate Type**: TLS 1.2 or TLS 1.3
- **Encryption**: 256-bit encryption minimum
- **Validity**: Auto-renewal before expiration

### Options

#### Free Options

- **Let's Encrypt** (recommended)
  - Free, automated, 90-day certificates
  - Auto-renewal with Certbot
  - Wildcard certificates supported

#### Paid Options

- **Sectigo** (formerly Comodo) - $50-200/year
- **DigiCert** - $200-500/year
- **GlobalSign** - $250-600/year

### Implementation

```bash
# Using Certbot (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 8. Web Server / Reverse Proxy

### Nginx (Recommended)

**Configuration Requirements:**

- Reverse proxy to Node.js application (port 5000)
- SSL/TLS termination
- Static file serving (built frontend)
- Gzip compression
- Request rate limiting
- WebSocket support (for real-time features)

**Sample Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Client max body size (for file uploads)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Alternative: Apache

- mod_proxy for reverse proxy
- mod_ssl for SSL/TLS
- mod_rewrite for URL rewriting

---

## 9. Hosting Provider Recommendations

### Cloud Platforms (Recommended)

#### 1. **DigitalOcean** ⭐ Best Value

- **Droplet**: $24/month (4 GB RAM, 2 vCPUs, 80 GB SSD)
- **Managed Database**: $15/month (PostgreSQL)
- **Spaces (Storage)**: $5/month (250 GB)
- **Total**: ~$44/month
- **Pros**: Simple, affordable, good documentation
- **Cons**: Limited advanced features

#### 2. **AWS (Amazon Web Services)** ⭐ Most Scalable

- **EC2 Instance**: t3.medium (~$30/month)
- **RDS PostgreSQL**: db.t3.micro (~$15/month)
- **S3 + CloudFront**: ~$10/month
- **Total**: ~$55/month
- **Pros**: Highly scalable, extensive services
- **Cons**: Complex pricing, steeper learning curve

#### 3. **Google Cloud Platform**

- **Compute Engine**: e2-medium (~$25/month)
- **Cloud SQL**: db-f1-micro (~$10/month)
- **Cloud Storage**: ~$5/month
- **Total**: ~$40/month
- **Pros**: Good performance, free tier credits
- **Cons**: Complex console

#### 4. **Azure**

- **Virtual Machine**: B2s (~$30/month)
- **Azure Database**: Basic tier (~$15/month)
- **Blob Storage**: ~$5/month
- **Total**: ~$50/month
- **Pros**: Enterprise features, Microsoft integration
- **Cons**: Complex pricing

#### 5. **Linode (Akamai)** ⭐ Developer Friendly

- **Linode**: 4 GB plan ($24/month)
- **Managed Database**: $15/month
- **Object Storage**: $5/month
- **Total**: ~$44/month
- **Pros**: Simple, predictable pricing
- **Cons**: Fewer regions than AWS

### Platform-as-a-Service (PaaS)

#### 1. **Render** ⭐ Easiest Deployment

- **Web Service**: $25/month (2 GB RAM)
- **PostgreSQL**: $7/month (1 GB)
- **Total**: ~$32/month
- **Pros**: Zero DevOps, auto-deploy from Git
- **Cons**: Less control, limited customization

#### 2. **Railway**

- **Usage-based**: ~$20-40/month
- **Pros**: Simple, modern interface
- **Cons**: Variable pricing

#### 3. **Fly.io**

- **Usage-based**: ~$25-50/month
- **Pros**: Global edge deployment
- **Cons**: Complex pricing model

#### 4. **Heroku**

- **Dyno**: $25/month (Basic)
- **PostgreSQL**: $9/month (Mini)
- **Total**: ~$34/month
- **Pros**: Mature platform, many add-ons
- **Cons**: More expensive, slower than competitors

### VPS Providers (Budget Options)

#### 1. **Hetzner** ⭐ Best Price/Performance

- **CX31**: €8.46/month (~$9/month) - 4 GB RAM, 2 vCPUs
- **Pros**: Excellent value, fast servers
- **Cons**: Limited regions, EU-focused

#### 2. **Vultr**

- **4 GB Plan**: $18/month
- **Pros**: Many regions, good performance
- **Cons**: No managed database

#### 3. **Contabo**

- **VPS M**: €6.99/month (~$7.50/month) - 8 GB RAM
- **Pros**: Very cheap, high specs
- **Cons**: Overselling concerns, slower support

---

## 10. Deployment Architecture

### Single Server Setup (Small Scale)

```
┌─────────────────────────────────────┐
│         Load Balancer/CDN           │
│         (Cloudflare/Nginx)          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Single VPS/Droplet             │
│  ┌──────────────────────────────┐   │
│  │  Nginx (Reverse Proxy)       │   │
│  └────────┬─────────────────────┘   │
│           │                          │
│  ┌────────▼─────────────────────┐   │
│  │  Node.js App (PM2)           │   │
│  │  - Express Server            │   │
│  │  - React Frontend (built)    │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  PostgreSQL Database         │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  File Storage (/uploads)     │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

**Suitable for**: 0-10,000 monthly visitors

### Scalable Setup (Medium-Large Scale)

```
┌─────────────────────────────────────┐
│              CDN                     │
│         (CloudFront/Cloudflare)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Load Balancer (ALB)           │
└──────┬───────────────────┬──────────┘
       │                   │
┌──────▼──────┐    ┌──────▼──────┐
│  App Server │    │  App Server │
│  (Node.js)  │    │  (Node.js)  │
└──────┬──────┘    └──────┬──────┘
       │                   │
       └───────┬───────────┘
               │
    ┌──────────▼──────────────┐
    │  Managed PostgreSQL     │
    │  (RDS/Cloud SQL)        │
    └─────────────────────────┘
               │
    ┌──────────▼──────────────┐
    │  Object Storage (S3)    │
    └─────────────────────────┘
```

**Suitable for**: 10,000+ monthly visitors

---

## 11. Performance Optimization

### Caching Strategy

- **Redis/Memcached**: Session storage, API response caching
- **CDN**: Static assets, images
- **Browser Caching**: Set appropriate cache headers
- **Database Query Caching**: Frequently accessed data

### Image Optimization

- **Format**: WebP for modern browsers, JPEG fallback
- **Compression**: 80-85% quality for product images
- **Lazy Loading**: Implement on product listings
- **Responsive Images**: Multiple sizes for different devices

### Code Optimization

- **Minification**: JavaScript, CSS minification
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Lazy load routes
- **Gzip/Brotli**: Compress text assets

---

## 12. Security Requirements

### Application Security

- ✅ HTTPS/TLS encryption (mandatory)
- ✅ Rate limiting (already implemented)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (using Drizzle ORM)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure session management
- ✅ Password hashing (bcrypt)
- ✅ JWT token authentication

### Server Security

- **Firewall**: UFW or iptables configured
- **SSH**: Key-based authentication only, disable password login
- **Fail2ban**: Prevent brute force attacks
- **Updates**: Automatic security updates enabled
- **Monitoring**: Log monitoring for suspicious activity

### Database Security

- **Access**: Restrict to application server only
- **Encryption**: Encryption at rest and in transit
- **Backups**: Encrypted backups
- **Credentials**: Strong passwords, rotated regularly

---

## 13. Backup & Disaster Recovery

### Database Backups

- **Frequency**: Daily automated backups
- **Retention**: 7 daily, 4 weekly, 3 monthly
- **Storage**: Off-site backup location
- **Testing**: Monthly restore testing

### File Backups

- **Frequency**: Daily backups of uploaded files
- **Storage**: Cloud storage (S3, Spaces)
- **Versioning**: Enable versioning on cloud storage

### Application Backups

- **Code**: Git repository (GitHub, GitLab, Bitbucket)
- **Configuration**: Environment variables documented
- **Deployment Scripts**: Version controlled

### Recovery Time Objective (RTO)

- **Target**: 4 hours maximum downtime
- **Database Restore**: 1 hour
- **Application Redeploy**: 30 minutes
- **DNS Propagation**: 2-24 hours (if changing servers)

---

## 14. Monitoring & Logging

### Application Monitoring

- **Uptime**: UptimeRobot, Pingdom (check every 5 minutes)
- **Performance**: New Relic, Datadog (response times, throughput)
- **Errors**: Sentry (error tracking and alerting)
- **Logs**: Centralized logging (Papertrail, Loggly)

### Server Monitoring

- **CPU/RAM**: Monitor usage, alert at 80%
- **Disk Space**: Alert at 80% capacity
- **Network**: Monitor bandwidth usage
- **Process**: Ensure Node.js process is running

### Database Monitoring

- **Connections**: Monitor connection pool usage
- **Query Performance**: Slow query logging
- **Disk Space**: Monitor database size growth
- **Replication Lag**: If using replicas

### Alerts

- **Critical**: Server down, database unreachable
- **Warning**: High CPU/RAM, disk space low
- **Info**: Deployment completed, backup completed

---

## 15. Estimated Monthly Costs

### Budget Setup (~$50-70/month)

| Service            | Provider             | Cost           |
| ------------------ | -------------------- | -------------- |
| VPS Server (4GB)   | DigitalOcean/Linode  | $24            |
| Managed PostgreSQL | DigitalOcean         | $15            |
| Object Storage     | DigitalOcean Spaces  | $5             |
| Domain Name        | Namecheap            | $1             |
| SSL Certificate    | Let's Encrypt        | Free           |
| SendGrid (Email)   | SendGrid Essentials  | $20            |
| Twilio (SMS)       | Pay-as-you-go        | $5-10          |
| CDN                | Cloudflare           | Free           |
| Monitoring         | UptimeRobot + Sentry | Free           |
| **Total**          |                      | **~$70/month** |

### Production Setup (~$100-150/month)

| Service               | Provider                | Cost            |
| --------------------- | ----------------------- | --------------- |
| App Server (8GB)      | AWS EC2 t3.large        | $60             |
| Database              | AWS RDS PostgreSQL      | $30             |
| Storage + CDN         | S3 + CloudFront         | $15             |
| Domain Name           | Route 53                | $1              |
| SSL Certificate       | AWS Certificate Manager | Free            |
| SendGrid (Email)      | SendGrid Pro            | $90             |
| Twilio (SMS/WhatsApp) | Pay-as-you-go           | $20             |
| Monitoring            | New Relic               | $25             |
| Backups               | AWS Backup              | $10             |
| **Total**             |                         | **~$251/month** |

### Enterprise Setup (~$300-500/month)

- Load balanced multi-server setup
- High-availability database with replicas
- Advanced monitoring and alerting
- Dedicated support contracts
- Enhanced security features

---

## 16. Deployment Checklist

### Pre-Deployment

- [ ] Choose hosting provider
- [ ] Provision server (VPS/Cloud)
- [ ] Set up PostgreSQL database
- [ ] Configure domain and DNS
- [ ] Obtain SSL certificate
- [ ] Set up email service (SendGrid)
- [ ] Configure payment gateway (Razorpay)
- [ ] Set up SMS service (Twilio) - optional
- [ ] Configure environment variables
- [ ] Set up monitoring and alerts

### Deployment

- [ ] Install Node.js 20.x
- [ ] Install PostgreSQL client
- [ ] Install Nginx
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Build frontend (`npm run build`)
- [ ] Run database migrations (`npm run db:push`)
- [ ] Seed initial data (`npm run db:seed`)
- [ ] Configure Nginx reverse proxy
- [ ] Set up PM2 process manager
- [ ] Configure SSL/TLS
- [ ] Test application functionality

### Post-Deployment

- [ ] Verify all pages load correctly
- [ ] Test payment flow (test mode first)
- [ ] Test email notifications
- [ ] Test SMS notifications (if enabled)
- [ ] Verify admin dashboard access
- [ ] Set up automated backups
- [ ] Configure monitoring alerts
- [ ] Update DNS records
- [ ] Test from multiple devices/browsers
- [ ] Load testing (optional)
- [ ] Switch payment gateway to live mode
- [ ] Monitor logs for 24-48 hours

---

## 17. Maintenance Requirements

### Daily

- Monitor error logs
- Check uptime status
- Review payment transactions

### Weekly

- Review server resource usage
- Check backup completion
- Review security logs
- Update content/products

### Monthly

- Apply security updates
- Review and optimize database
- Analyze performance metrics
- Test backup restoration
- Review and optimize costs

### Quarterly

- Update dependencies
- Security audit
- Performance optimization
- Review and update documentation

---

## 18. Support & Documentation

### Technical Support Contacts

- **Hosting Provider**: Support ticket system
- **Razorpay**: https://razorpay.com/support/
- **SendGrid**: https://support.sendgrid.com/
- **Twilio**: https://support.twilio.com/

### Documentation Resources

- **Node.js**: https://nodejs.org/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **Nginx**: https://nginx.org/en/docs/

### Emergency Contacts

- System Administrator: [Your contact]
- Database Administrator: [Your contact]
- Development Team: [Your contact]

---

## 19. Compliance & Legal

### Data Protection

- **GDPR**: If serving EU customers
- **Privacy Policy**: Implemented ✅
- **Terms of Service**: Implemented ✅
- **Cookie Consent**: Implement if required

### India-Specific Compliance

- **GST Registration**: Required for e-commerce
- **Consumer Protection Act**: Compliance required
- **Return Policy**: Implemented ✅
- **Shipping Policy**: Implemented ✅
- **Payment Gateway**: RBI compliance (Razorpay handles this)

### PCI DSS Compliance

- Payment data handled by Razorpay (PCI DSS compliant)
- Do not store card details on your server
- Use HTTPS for all transactions

---

## 20. Recommended Hosting Provider

### 🏆 Top Recommendation: DigitalOcean

**Why DigitalOcean:**

1. **Simple Pricing**: Predictable, transparent costs
2. **Good Performance**: SSD storage, fast network
3. **Managed Database**: Easy PostgreSQL setup
4. **Spaces**: Built-in CDN for file storage
5. **Documentation**: Excellent tutorials and guides
6. **Support**: Good community and support
7. **Scalability**: Easy to upgrade resources

**Setup Cost**: ~$44/month

- Droplet (4 GB): $24/month
- Managed PostgreSQL: $15/month
- Spaces (250 GB): $5/month

**Getting Started:**

1. Sign up at https://www.digitalocean.com/
2. Create a Droplet (Ubuntu 22.04, 4 GB plan)
3. Create a Managed PostgreSQL database
4. Create a Space for file storage
5. Follow deployment guide

---

## Conclusion

SpireGrocer requires a modern hosting environment with:

- **Minimum**: 4 GB RAM, 2 vCPUs, 50 GB storage
- **Database**: PostgreSQL 14+ with managed backups
- **Services**: Razorpay, SendGrid, optional Twilio
- **Budget**: $50-150/month depending on scale
- **Recommended**: DigitalOcean or AWS for production

This application is production-ready and can scale from small businesses to enterprise-level traffic with appropriate infrastructure.

---

**Document Version**: 1.0  
**Last Updated**: September 25, 2026  
**Application**: SpireGrocer E-commerce Platform
