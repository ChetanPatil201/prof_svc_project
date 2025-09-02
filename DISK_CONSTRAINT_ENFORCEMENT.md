# Disk Constraint Enforcement

## Issue Description
The AI was still recommending Premium SSD V2 disks despite the constraint "Dont select premium v2 disk and premium disk", indicating that the rules and constraints weren't being properly enforced for disk recommendations.

## Root Cause Analysis
The disk cost breakdown in the assessment report was using the **original Azure Migrate assessment data** (which includes Premium disk recommendations), while the GenAI recommendations correctly followed the rules and constraints. The disk breakdown section was not applying the same constraint filtering that the GenAI analysis does.

## Solution Implemented

### 1. Enhanced AssessmentReportData Interface
Added `rulesAndConstraints` field to the `AssessmentReportData` interface to pass constraint information to the report generation process.

### 2. Modified AssessmentReportForm
Updated the form to include `rulesAndConstraints` in the assessment data object that gets passed to the report generation.

### 3. Enhanced Disk Breakdown Generation
Created `applyDiskConstraints()` function in `utils.ts` that:
- Filters disk recommendations based on specified constraints
- Replaces Premium V2 disks with Standard SSD
- Replaces Premium SSD disks with Standard SSD  
- Replaces Ultra Disks with Premium SSD
- Adjusts cost estimates accordingly
- Provides detailed logging for debugging

### 4. Comprehensive Constraint Patterns
The system now recognizes multiple constraint patterns:
- **Premium V2**: `premium v2`, `premiumv2`, `dont select premium v2`, `no premium v2`, etc.
- **Premium**: `dont select premium`, `no premium`, `avoid premium`, `exclude premium`, etc.
- **Ultra**: `ultra`, `no ultra`, `avoid ultra`, `exclude ultra`, etc.

### 5. Enhanced Reporting
- Added constraint change tracking
- Updated disk breakdown descriptions to indicate when constraints were applied
- Added detailed logging for debugging constraint application

## Technical Implementation

### Key Functions Modified:
1. `generateDiskBreakdownData()` in `utils.ts` - Now applies constraints to disk recommendations
2. `applyDiskConstraints()` - New function to filter disk types based on constraints
3. `AssessmentReportForm.tsx` - Now passes `rulesAndConstraints` to assessment data
4. `generate-report/route.ts` - Enhanced logging for constraint application

### Constraint Application Logic:
```typescript
// Example: If user specifies "dont select premium v2 disk"
// Original: Premium SSD V2 → Filtered: Standard SSD
// Cost adjustment: ~40% reduction (0.6x multiplier)
```

## Testing the Fix

### Test Cases:
1. **Premium V2 Constraint**: 
   - Input: "dont select premium v2 disk"
   - Expected: Premium SSD V2 disks → Standard SSD
   
2. **Premium Constraint**:
   - Input: "dont select premium disk" 
   - Expected: Premium SSD disks → Standard SSD
   
3. **Ultra Disk Constraint**:
   - Input: "no ultra disk"
   - Expected: Ultra Disks → Premium SSD

### Verification:
- Check console logs for constraint application messages
- Verify disk breakdown table shows filtered disk types
- Confirm cost estimates are adjusted accordingly
- Ensure GenAI recommendations and disk breakdown are consistent

## Result
The disk cost breakdown in the assessment report now properly respects the rules and constraints specified by the user, ensuring consistency between GenAI recommendations and the final report output. 