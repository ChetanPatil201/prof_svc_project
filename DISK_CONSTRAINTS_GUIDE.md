# Disk Constraints Technical Guide

## Overview
The disk constraint system allows users to specify rules about which Azure disk types should be avoided or preferred during migration assessments. This guide covers the technical implementation, usage, and troubleshooting.

## Architecture

### Core Components

#### 1. Constraint Application Engine
- **File**: `src/lib/utils.ts`
- **Main Function**: `applyDiskConstraints()`
- **Purpose**: Applies disk constraints to individual disk objects

#### 2. Data Consistency Manager
- **File**: `src/lib/utils.ts`
- **Main Function**: `getConstrainedDiskData()`
- **Purpose**: Ensures constraints are applied consistently across all data

#### 3. Testing Framework
- **File**: `src/lib/utils.ts`
- **Main Function**: `testDiskConstraintApplication()`
- **Purpose**: Validates constraint application and provides debugging

### Data Flow

```
Original Assessment Data
         ↓
   [Contains Premium Disks]
         ↓
Constraint Application Engine
         ↓
   [Filter Premium Disks]
         ↓
Standard SSD Conversion
         ↓
   [Replace with Standard SSD]
         ↓
Consistent Data Distribution
         ↓
   [All Report Sections]
```

## Implementation Details

### Constraint Detection Logic

#### Premium V2 Detection
```typescript
const isPremiumV2 = mappedDiskTypeLower.includes('premium ssd v2') || 
                    mappedDiskTypeLower.includes('premium v2') ||
                    mappedDiskTypeLower.includes('premiumssd v2') ||
                    mappedDiskTypeLower.includes('premiumssdv2');
```

#### Regular Premium Detection
```typescript
const isPremium = (mappedDiskTypeLower.includes('premium ssd') || 
                  mappedDiskTypeLower.includes('premium') ||
                  mappedDiskTypeLower.includes('premium managed') ||
                  mappedDiskTypeLower.includes('premium disk') ||
                  originalDiskType.includes('premium managed') ||
                  originalDiskType.includes('premium disk')) &&
                 !mappedDiskTypeLower.includes('v2') &&
                 !originalDiskType.includes('v2');
```

### Constraint Patterns

#### Premium Disk Patterns
```typescript
const premiumPatterns = [
  'dont select premium', 'no premium', 'avoid premium', 'exclude premium',
  'premium disk', 'premium ssd', 'dont select premium disk', 'no premium disk'
];
```

#### Premium V2 Patterns
```typescript
const premiumV2Patterns = [
  'premium v2', 'premiumv2', 'dont select premium v2', 'no premium v2',
  'avoid premium v2', 'exclude premium v2', 'premium ssd v2'
];
```

#### Ultra Disk Patterns
```typescript
const ultraPatterns = [
  'ultra', 'no ultra', 'avoid ultra', 'exclude ultra', 'ultra disk'
];
```

## Supported Constraints

### Premium Disk Constraints
| Constraint Text | Description | Effect |
|----------------|-------------|---------|
| `"Dont choose premium disks"` | Filter Premium SSD disks | Converts to Standard SSD |
| `"Dont choose premium v2 disks"` | Filter Premium SSD V2 disks | Converts to Standard SSD |
| `"Dont choose premium disks or premium v2 disks"` | Filter both types | Converts to Standard SSD |
| `"Dont select any type of premium disk"` | Comprehensive filtering | Converts to Standard SSD |

### Ultra Disk Constraints
| Constraint Text | Description | Effect |
|----------------|-------------|---------|
| `"Dont choose ultra disks"` | Filter Ultra disks | Converts to Premium SSD |
| `"Avoid ultra"` | Alternative syntax | Converts to Premium SSD |

### Standard Disk Preferences
| Constraint Text | Description | Effect |
|----------------|-------------|---------|
| `"Prefer standard ssd"` | Prioritize Standard SSD | No conversion needed |
| `"Use standard hdd"` | Prefer Standard HDD | No conversion needed |

## API Integration

### Generate Report API
```typescript
// src/app/api/generate-report/route.ts
import { getConstrainedDiskData, testDiskConstraintApplication } from '@/lib/utils';

export async function POST(req: NextRequest) {
  // Test disk constraint application
  await testDiskConstraintApplication(data);

  // Apply disk constraints to original data for consistency
  if (data.rulesAndConstraints && data.payAsYouGoData?.disks && data.targetRegion) {
    data.payAsYouGoData.disks = await getConstrainedDiskData(data);
  }
}
```

### Cost Comparison Table
```typescript
// src/lib/utils.ts
export async function generateCostComparisonTable(data: AssessmentReportData) {
  if (data.rulesAndConstraints) {
    // Apply constraints to original disk data for consistency
    if (data.payAsYouGoData?.disks && data.targetRegion) {
      for (let i = 0; i < data.payAsYouGoData.disks.length; i++) {
        data.payAsYouGoData.disks[i] = await applyDiskConstraints(
          data.payAsYouGoData.disks[i], 
          data.rulesAndConstraints, 
          data.targetRegion
        );
      }
    }
  }
}
```

## Debugging and Logging

### Debug Logging Levels

#### 1. Disk Test Logging
```
🧪 [Disk Test] Testing disk constraint application
🧪 [Disk Test] Testing 7 disks with constraints: Dont choose premium disks or premium v2 disks
🧪 [Disk Test] Original premium disks: 3
🧪 [Disk Test] Constrained premium disks: 1
✅ [Disk Test] Constraints successfully reduced premium disk count
```

#### 2. Constraint Application Logging
```
🔄 [Disk Consistency] Applying constraints to all disk data
🔄 [Disk Constraints] Filtering out Premium SSD V2 disk: scsi0:0
🔄 [Disk Consistency] Constraint applied to scsi0:0: Premium SSD V2 managed disks → Standard SSD
✅ [Disk Consistency] Applied constraints to 2 out of 7 disks
```

#### 3. Debug Logging for Premium Disks
```
🔍 [Disk Debug] scsi0:0: Type="Premium SSD V2 managed disks", Mapped="premium ssd v2 managed disks"
🔍 [Disk Debug] IsPremium=false, IsPremiumV2=true
🔍 [Disk Debug] HasPremiumConstraint=true, HasPremiumV2Constraint=true, HasAnyPremiumConstraint=true
```

### Testing Function
```typescript
await testDiskConstraintApplication(assessmentData);
```

This function provides:
- Original premium disk count
- Constrained premium disk count
- Success/failure indication
- Detailed logging for troubleshooting

## Recent Fixes and Issues

### Issue 1: Inconsistent Constraint Application
**Problem**: Only 2 out of 7 premium disks were being filtered out.

**Root Cause**: 
```typescript
// BROKEN CODE
if ((hasPremiumConstraint || hasCombinedConstraint || hasAnyPremiumConstraint) && 
    !constraints.includes('v2') && isPremium) {
```

The `!constraints.includes('v2')` condition prevented regular premium disk constraints from being applied when the constraint text contained "v2".

**Solution**: 
```typescript
// FIXED CODE
if ((hasPremiumConstraint || hasCombinedConstraint || hasAnyPremiumConstraint) && isPremium) {
```

### Issue 2: Data Inconsistency Across Report Sections
**Problem**: Different report sections were using different disk data (original vs constrained).

**Solution**: 
1. Added `getConstrainedDiskData()` helper function
2. Modified `generateCostComparisonTable()` to apply constraints to original data
3. Updated generate-report API to ensure consistent constraint application

## Performance Considerations

### Caching
- Disk pricing is cached to avoid repeated API calls
- Constraint detection results are not cached (minimal performance impact)

### API Limits
- Azure Retail Prices API has rate limits
- Implemented retry logic with exponential backoff
- Fallback pricing used when API calls fail

### Memory Usage
- Constraint application is stateless
- No memory leaks from constraint processing
- Efficient disk object transformation

## Best Practices

### 1. Constraint Specification
- Use clear, specific constraint text
- Test constraints with sample data
- Monitor debug logs for constraint application

### 2. Error Handling
- Always check for constraint application success
- Use fallback pricing when API calls fail
- Log constraint application failures

### 3. Testing
- Use `testDiskConstraintApplication()` for validation
- Test with various constraint combinations
- Verify data consistency across report sections

## Troubleshooting

### Common Issues

#### 1. Constraints Not Applied
**Symptoms**: Premium disks still present in final report
**Debug Steps**:
1. Check constraint text syntax
2. Verify debug logs for constraint detection
3. Test with `testDiskConstraintApplication()`

#### 2. Inconsistent Data
**Symptoms**: Different sections show different disk types
**Debug Steps**:
1. Check if `getConstrainedDiskData()` is called
2. Verify constraint application in `generateCostComparisonTable()`
3. Monitor API logs for constraint application

#### 3. High API Costs
**Symptoms**: Excessive Azure Retail Prices API calls
**Debug Steps**:
1. Check pricing cache implementation
2. Verify retry logic settings
3. Monitor API rate limits

### Debug Commands
```bash
# Check constraint application logs
grep "Disk Debug" logs.txt

# Monitor constraint application
grep "Disk Consistency" logs.txt

# Verify test results
grep "Disk Test" logs.txt
```

## Future Enhancements

### Planned Features
1. **Advanced Constraint Syntax**: Support for complex constraint combinations
2. **Cost Optimization**: Automatic selection of most cost-effective compliant disks
3. **Performance Monitoring**: Metrics for constraint application performance
4. **User Interface**: Visual constraint builder in the assessment form

### Technical Debt
1. **Code Refactoring**: Consolidate constraint detection logic
2. **Type Safety**: Add TypeScript interfaces for constraint types
3. **Unit Tests**: Comprehensive test coverage for constraint functions
4. **Documentation**: API documentation for constraint functions 