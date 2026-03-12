# Flowise Integration Deployment & Operations Checklist

Complete this checklist before deploying to production.

## Pre-Deployment

### Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all required credentials (Flowise, MinIO, AI SDK)
- [ ] Verify all variable names match exactly (case-sensitive)
- [ ] Test environment validation: `npm run dev`
- [ ] Confirm `.env.local` is in `.gitignore`

### Service Connectivity
- [ ] Test Flowise connection: `curl $FLOWISE_API_URL/chatflow -H "Authorization: Bearer $FLOWISE_API_KEY"`
- [ ] MinIO accessible: `telnet $MINIO_ENDPOINT $MINIO_PORT`
- [ ] MinIO buckets created: `mc ls minio/`
- [ ] Context7 MCP reachable: `curl $CONTEXT7_MCP_URL`
- [ ] At least one AI SDK key configured

### Health Check
- [ ] Run health check: `curl http://localhost:3000/api/health`
- [ ] All services report `available: true`
- [ ] Response time under 10 seconds

## Testing

### Local Testing
- [ ] Upload file to MinIO via chat interface
- [ ] Switch to Flowise Chatflow in model selector
- [ ] Send chat message to Flowise backend
- [ ] Verify response includes source documents (if applicable)
- [ ] Test fallback: disable Flowise, verify AI SDK responds
- [ ] Test coder mode: verify Context7 docs in system prompt
- [ ] List storage files via `/api/storage?action=list`

### API Testing
```bash
# Test storage upload
curl -X POST http://localhost:3000/api/storage?action=upload \
  -F "file=@test.pdf" \
  -F "bucket=chat-documents"

# Test Flowise prediction
curl -X POST http://localhost:3000/api/flowise?action=predict \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test Context7 documentation
curl "http://localhost:3000/api/context7?action=docs&libraries=nodejs,react"

# Test health check
curl http://localhost:3000/api/health
```

### Error Handling
- [ ] Test behavior when Flowise is unavailable
- [ ] Test behavior when MinIO is unavailable
- [ ] Test behavior with invalid API keys
- [ ] Test behavior with missing environment variables
- [ ] Verify graceful fallbacks work as expected

## Production Deployment

### Vercel Configuration
- [ ] Add all environment variables to Vercel project settings
- [ ] Use secure, rotated credentials (not local development values)
- [ ] Set `ENABLE_PRODUCTION_LOGGING=true` for detailed logs
- [ ] Test preview deployment first

### MinIO Production Setup
- [ ] Deploy MinIO on production infrastructure
- [ ] Enable SSL/TLS certificates
- [ ] Set `MINIO_USE_SSL=true` in environment
- [ ] Configure firewall to restrict MinIO access
- [ ] Set up backup/disaster recovery
- [ ] Enable object lifecycle policies (auto-delete after X days)
- [ ] Configure access logging and monitoring

### Flowise Production Instance
- [ ] Confirm production Flowise URL in environment
- [ ] Test Flowise API key has appropriate permissions
- [ ] Verify Flowise instance has sufficient resources
- [ ] Set up Flowise monitoring and alerting
- [ ] Review Flowise logs before deploying chat app

### Security Hardening
- [ ] Rotate all API keys from development values
- [ ] Enable API rate limiting (recommend 100 req/min per session)
- [ ] Implement CORS restrictions for MinIO
- [ ] Enable request authentication tokens
- [ ] Set up audit logging for all operations
- [ ] Review and enforce HTTPS everywhere
- [ ] Configure security headers in Next.js

## Post-Deployment

### Verification
- [ ] Test production endpoint: `curl https://your-domain.com/api/health`
- [ ] All services report healthy
- [ ] File upload works end-to-end
- [ ] Flowise predictions work correctly
- [ ] Context7 documentation loads
- [ ] No error messages in logs

### Monitoring Setup
- [ ] Configure logging to Vercel or third-party service
- [ ] Set up alerts for:
  - Service downtime (Flowise, MinIO, Context7)
  - API error rates > 5%
  - Response times > 10s
  - Failed file uploads > 2%
- [ ] Create dashboard for:
  - Active chat sessions
  - Average response time
  - File upload volume
  - API usage by endpoint

### Backup & Disaster Recovery
- [ ] Enable MinIO replication to backup storage
- [ ] Set up automated MinIO backups
- [ ] Document recovery procedures
- [ ] Test recovery procedure quarterly
- [ ] Store credentials securely (Vercel Secrets)
- [ ] Document credential rotation process

## Ongoing Maintenance

### Weekly
- [ ] Check error logs for anomalies
- [ ] Review API performance metrics
- [ ] Verify all services are responding

### Monthly
- [ ] Review and rotate access credentials
- [ ] Check MinIO storage usage
- [ ] Clean up old cached Context7 entries
- [ ] Review and update dependencies

### Quarterly
- [ ] Security audit of all integrations
- [ ] Performance optimization review
- [ ] Disaster recovery test
- [ ] Update documentation with latest learnings

## Troubleshooting Reference

### Flowise Connection Issues
```bash
# Verify connectivity
curl -v -H "Authorization: Bearer $FLOWISE_API_KEY" \
  "$FLOWISE_API_URL/chatflow"

# Check environment variables
echo "API URL: $FLOWISE_API_URL"
echo "Chatflow ID: $FLOWISE_CHATFLOW_ID"
```

### MinIO Connection Issues
```bash
# Test connection
mc alias set minio http://$MINIO_ENDPOINT:$MINIO_PORT \
  $MINIO_ACCESS_KEY $MINIO_SECRET_KEY
mc ls minio/

# Check bucket policies
mc policy get minio/chat-documents
```

### Context7 Issues
```bash
# Check cache status
curl "http://localhost:3000/api/context7?action=cache-stats"

# Clear cache if needed
curl -X POST http://localhost:3000/api/context7?action=invalidate-cache
```

### Service Health
```bash
# Full health check
curl http://localhost:3000/api/health | jq .

# Individual service checks
curl "http://localhost:3000/api/flowise?action=health"
curl "http://localhost:3000/api/context7?action=version&library=nodejs"
```

## Sign-Off

- [ ] Implementation complete
- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team trained on operations
- [ ] Ready for production deployment

**Deployed by:** ________________  
**Date:** ________________  
**Notes:** ________________________________________________________________

---

For detailed setup instructions, see [FLOWISE_SETUP_GUIDE.md](./FLOWISE_SETUP_GUIDE.md)
For API documentation, see the generated API routes in `/app/api/`
For configuration reference, see [.env.example](./.env.example)
