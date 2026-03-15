# IMEI Stock Management Fix - Task 13

## Problem
When selling products with the same IMEI (e.g., 100 zaryadka with 1 IMEI), selling a partial quantity (e.g., 20 units) was causing the product to disappear completely from the inventory instead of showing the remaining count (80).

## Root Causes Identified and Fixed

### 1. Backend IMEI Update Logic (sales.js)
**Issue**: The original code was using `bulkWrite` which could have race conditions, and lacked detailed logging.

**Fix**: 
- Changed to individual `updateOne` operations for each IMEI to ensure proper sequential updates
- Added comprehensive logging to track:
  - Product name and total IMEIs
  - IMEI value being searched for
  - Quantity to mark as used
  - Number of unused IMEIs found
  - Success/failure of each update

**Code Location**: `f-mobile-backend/routes/sales.js` (lines 70-110)

### 2. Product Update Logic (products.js)
**Issue**: When updating a product with more stock (using "+5" syntax), the code was recreating the entire `imeiList` with all entries marked as `used: false`, losing information about which IMEIs were already sold.

**Fix**:
- Fetch the existing product before updating
- When adding more stock to a product with the same IMEI:
  - Count how many IMEIs are already marked as used
  - Preserve the "used" status by marking the first N entries as used (where N = existing used count)
  - Add new unused entries for the additional stock

**Code Location**: `f-mobile-backend/routes/products.js` (lines 214-270)

## How It Works

### Scenario: 100 zaryadka with IMEI "12345"
1. **Initial State**: 
   - `imeiList` has 100 entries: `[{imei: "12345", used: false}, ...]`
   - Inventory shows: "Soni: 100 ta"

2. **Sell 20 units**:
   - Frontend sends: `{product: productId, quantity: 20, imei: "12345"}`
   - Backend finds first 20 unused IMEIs with value "12345"
   - Marks each as `used: true`
   - `imeiList` now has: 20 entries with `used: true`, 80 with `used: false`

3. **After Sale**:
   - Inventory filter: `imeiList.filter(item => !item.used).length` = 80
   - Product shows: "Soni: 80 ta"
   - Product remains visible in inventory

4. **Add 50 more units**:
   - Frontend sends: stock = "+50" (meaning 100 + 50 = 150)
   - Backend preserves the 20 used entries
   - Creates new `imeiList` with:
     - First 20 entries: `{imei: "12345", used: true}`
     - Next 130 entries: `{imei: "12345", used: false}`
   - Total: 150 entries, 20 used, 130 available

## Frontend Behavior
- Products with same IMEI are grouped into single card
- Shows available count: `imeiList.filter(item => !item.used).length`
- Quantity input allows selecting up to available count
- Real-time validation prevents exceeding available stock

## Testing Checklist
- [ ] Create product with 100 units, same IMEI
- [ ] Verify inventory shows 100 available
- [ ] Sell 20 units
- [ ] Verify inventory shows 80 available
- [ ] Sell 30 more units
- [ ] Verify inventory shows 50 available
- [ ] Add 50 more units (using "+50")
- [ ] Verify inventory shows 100 available (50 remaining + 50 new)
- [ ] Sell all 100 units
- [ ] Verify product disappears from inventory
