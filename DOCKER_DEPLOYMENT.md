# Docker Deployment Guide

## Overview
This guide covers deploying the Professional Services Assessment Tool using Docker containers.

## Disk Constraint System

### Overview
The system includes a comprehensive disk constraint management system that allows users to specify rules about which disk types should be avoided or preferred during Azure migration assessments.

### Key Features
- **Premium Disk Filtering**: Automatically filters out Premium SSD and Premium SSD V2 disks based on constraints
- **Standard SSD Fallback**: Converts premium disks to Standard SSD when constraints are applied
- **Consistent Application**: Ensures constraints are applied consistently across all report sections
- **Debug Logging**: Comprehensive logging to track constraint application

### Constraint Types Supported

#### Premium Disk Constraints
- `"Dont choose premium disks"` - Filters out all Premium SSD disks
- `"Dont choose premium v2 disks"` - Filters out Premium SSD V2 disks
- `"Dont choose premium disks or premium v2 disks"` - Filters out both types
- `"Dont select any type of premium disk"` - Comprehensive premium disk filtering

#### Ultra Disk Constraints
- `"Dont choose ultra disks"` - Filters out Ultra disks
- `"Avoid ultra"` - Alternative syntax for ultra disk filtering

#### Standard Disk Preferences
- `"Prefer standard ssd"` - Prioritizes Standard SSD disks
- `"Use standard hdd"` - Prefers Standard HDD disks

### Implementation Details

#### Core Functions
1. **`applyDiskConstraints()`** - Main constraint application function
2. **`getConstrainedDiskData()`** - Ensures consistent constraint application
3. **`testDiskConstraintApplication()`** - Validates constraint application

#### Constraint Detection Logic
```typescript
// Premium V2 Detection
const isPremiumV2 = mappedDiskTypeLower.includes('premium ssd v2') || 
                    mappedDiskTypeLower.includes('premium v2');

// Regular Premium Detection
const isPremium = (mappedDiskTypeLower.includes('premium ssd') || 
                  mappedDiskTypeLower.includes('premium')) &&
                 !mappedDiskTypeLower.includes('v2');
```

#### Data Flow
1. **Original Assessment Data** → Contains premium disk recommendations
2. **Constraint Application** → Filters out prohibited disk types
3. **Standard SSD Conversion** → Replaces premium disks with Standard SSD
4. **Consistent Application** → Applied across all report sections

### Debug Logging
The system provides comprehensive logging to track constraint application:

```
🧪 [Disk Test] Testing disk constraint application
🧪 [Disk Test] Testing 7 disks with constraints: Dont choose premium disks or premium v2 disks
🧪 [Disk Test] Original premium disks: 3
🔄 [Disk Consistency] Applying constraints to all disk data
🔄 [Disk Constraints] Filtering out Premium SSD V2 disk: scsi0:0
🔄 [Disk Consistency] Constraint applied to scsi0:0: Premium SSD V2 managed disks → Standard SSD
✅ [Disk Consistency] Applied constraints to 2 out of 7 disks
🧪 [Disk Test] Constrained premium disks: 1
✅ [Disk Test] Constraints successfully reduced premium disk count
```

### Recent Fixes

#### Issue: Inconsistent Constraint Application
**Problem**: Only 2 out of 7 premium disks were being filtered out when using combined constraints.

**Root Cause**: The constraint detection logic had a problematic condition:
```typescript
// BROKEN CODE
if ((hasPremiumConstraint || hasCombinedConstraint || hasAnyPremiumConstraint) && 
    !constraints.includes('v2') && isPremium) {
```

The `!constraints.includes('v2')` condition prevented regular premium disk constraints from being applied when the constraint text contained "v2".

**Solution**: Removed the problematic condition:
```typescript
// FIXED CODE
if ((hasPremiumConstraint || hasCombinedConstraint || hasAnyPremiumConstraint) && isPremium) {
```

#### Issue: Data Inconsistency Across Report Sections
**Problem**: Different report sections were using different disk data (original vs constrained).

**Solution**: 
1. Added `getConstrainedDiskData()` helper function
2. Modified `generateCostComparisonTable()` to apply constraints to original data
3. Updated generate-report API to ensure consistent constraint application

### Usage Examples

#### Basic Premium Disk Constraint
```typescript
const constraints = "Dont choose premium disks";
// Result: All Premium SSD disks converted to Standard SSD
```

#### Combined Premium and V2 Constraint
```typescript
const constraints = "Dont choose premium disks or premium v2 disks";
// Result: All Premium SSD and Premium SSD V2 disks converted to Standard SSD
```

#### Comprehensive Constraint
```typescript
const constraints = "Dont select any type of premium disk";
// Result: All premium disk types filtered out
```

### Testing
Use the built-in test function to validate constraint application:
```typescript
await testDiskConstraintApplication(assessmentData);
```

This will log:
- Original premium disk count
- Constrained premium disk count
- Whether constraints were successfully applied

## Docker Deployment

## 🚀 Quick Start

1. **Ensure you have a `.env.local` file** with your Azure OpenAI credentials:
```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo
```

2. **Run the application**:
```bash
./quick-start.sh
```

3. **Access your application** at: http://localhost:3000

## 📋 Essential Commands

```bash
# Start application
docker compose -f docker-compose.prod.yml up -d

# Stop application
docker compose -f docker-compose.prod.yml down

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up --build -d
```

## 🔧 Detailed Instructions

### **Environment Setup**
```bash
# Check if .env.local exists
ls -la .env.local

# If it doesn't exist, create it:
cat > .env.local << EOF
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-azure-openai-key-here
AZURE_OPENAI_DEPLOYMENT=gpt-35-turbo
EOF
```

### **Deployment Options**
```bash
# Option 1: Quick start (recommended)
./quick-start.sh

# Option 2: Manual deployment
docker compose -f docker-compose.prod.yml up --build -d
```

### **Verification**
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Test endpoints
curl http://localhost:3000
curl http://localhost:3000/api/test-endpoint
```

## 🧪 Testing Your Application

### **Basic Functionality**
- ✅ Main page loads (HTTP 200)
- ✅ API endpoints respond (HTTP 200)
- ✅ Environment variables loaded correctly

### **Application Features**
1. **Upload Assessment File**
   - Go to http://localhost:3000/dashboard/assessment-reports
   - Upload a CSV file with VM data
   - Verify data processing

2. **Generate Reports**
   - Click "Generate Assessment Report"
   - Test Azure OpenAI integration
   - Verify report generation

3. **VM Recommendations**
   - Check VM recommendations display
   - Verify pricing calculations

## 🔍 Troubleshooting

### **Container Won't Start**
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Restart with rebuild
docker compose -f docker-compose.prod.yml up --build -d
```

### **Environment Variables Not Working**
```bash
# Check if .env.local is being read
docker compose -f docker-compose.prod.yml config

# Verify environment variables in container
docker compose -f docker-compose.prod.yml exec app env | grep AZURE
```

### **Port Already in Use**
```bash
# Check what's using port 3000
lsof -i :3000

# Stop existing containers
docker compose -f docker-compose.prod.yml down
```

## 📁 Files Overview

- `Dockerfile` - Docker container configuration
- `docker-compose.prod.yml` - Production deployment configuration
- `quick-start.sh` - Automated deployment script
- `.dockerignore` - Files excluded from Docker build

## 🚀 Production Considerations

For production deployment, consider:
1. **Use a reverse proxy** (nginx) in front of your app
2. **Set up SSL/TLS** certificates
3. **Configure proper logging** aggregation
4. **Set up monitoring** (Prometheus, Grafana)
5. **Use secrets management** for sensitive data
6. **Implement auto-scaling** based on load 