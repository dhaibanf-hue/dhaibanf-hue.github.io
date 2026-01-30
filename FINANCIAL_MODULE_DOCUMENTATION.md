# Nexus WMS - Financial Accounting Module Documentation

## نظرة عامة (Overview)

تم توسيع نظام إدارة المستودعات (Nexus WMS) ليشمل وحدة محاسبة مالية كاملة تتكامل مع حركة المخزون وتوفر:
- إدارة الحسابات الدائنة (Accounts Payable) للموردين
- إدارة الحسابات المدينة (Accounts Receivable) للعملاء  
- تقارير مالية شاملة (Aging Reports, SOA, Collection Alerts)

---

## 1. VENDOR & PURCHASING MODULE (إدارة الموردين والمشتريات)

### Vendor Entity Structure

```typescript
interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: PaymentTerms; // CASH | CREDIT | HYBRID_SALES_LINKED
  currentBalance: number; // المبلغ المترصد للمورد
  creditLimit?: number;
  cashPercentage?: number; // للنظام المختلط (HYBRID)
  commissionPerUnit?: number; // عمولة لكل وحدة مباعة
}
```

### Payment Terms Logic

#### 1. CASH (نقدي فوري)
- الدفع الفوري عند الاستلام
- لا يتم إضافة مبلغ للرصيد المترصد
- يتم تسجيل دفعة نقدية مباشرة

```typescript
if (vendor.paymentTerms === PaymentTerms.CASH) {
  cashPayment = totalAmount;
  vendorBalance += 0; // No credit balance
}
```

#### 2. CREDIT (آجل)
- المبلغ الكامل يضاف لرصيد المورد
- يتم التسديد لاحقاً بناءً على الاتفاق

```typescript
if (vendor.paymentTerms === PaymentTerms.CREDIT) {
  vendorBalance += totalAmount;
}
```

#### 3. HYBRID_SALES_LINKED (مختلط مربوط بالمبيعات)
- نسبة مئوية نقدية فورية (`cashPercentage`)
- الباقي مربوط بحجم المبيعات (`commissionPerUnit`)
- مثال: 30% نقدي + 5 ر.س عمولة لكل وحدة مباعة

```typescript
if (vendor.paymentTerms === PaymentTerms.HYBRID_SALES_LINKED) {
  const cashAmount = totalAmount * (vendor.cashPercentage / 100);
  const creditAmount = totalAmount - cashAmount;
  const salesCommission = unitsSold * vendor.commissionPerUnit;
  
  vendorBalance += (creditAmount - salesCommission);
}
```

### Vendor Ledger (دفتر استاذ المورد)

كل عملية استلام (INBOUND) تُنشئ قيد مالي:

```typescript
const vendorTransaction: FinancialTransaction = {
  id: `fin-${Date.now()}`,
  entityType: EntityType.VENDOR,
  entityId: vendor.id,
  entityName: vendor.name,
  transactionDate: new Date().toISOString(),
  type: TransactionType.INVOICE,
  amount: totalPurchaseAmount,
  balanceAfter: newVendorBalance,
  referenceDocId: stockMovementId,
  notes: `Purchase: ${productName} - Qty: ${quantity}`
};
```

---

## 2. CLIENT & DISTRIBUTION MODULE (إدارة العملاء والتوزيع)

### Client Entity Structure

```typescript
interface Client {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  gpsLocation: string; // إحداثيات GPS أو عنوان
  category: string; // Retail, Wholesale, Distributor
  collectionPeriodDays: number; // فترة التحصيل (مثال: 15, 30 يوم)
  currentBalance: number; // المبلغ المترصد على العميل
  creditLimit: number; // الحد الائتماني
  isActive: boolean;
}
```

### Distribution Logic (نظام الكونسنمنت)

#### Consignment-Style Tracking
- يتم توريد البضاعة للعميل
- الدفع يتم بناءً على **تقارير المبيعات** التي يقدمها العميل
- الدفع لكل وحدة مباعة (Pay-per-Sale)

```typescript
// عند إنشاء فاتورة للعميل
const dueDate = new Date();
dueDate.setDate(dueDate.getDate() + client.collectionPeriodDays);

const clientInvoice: FinancialTransaction = {
  entityType: EntityType.CLIENT,
  type: TransactionType.INVOICE,
  amount: totalSalesAmount,
  dueDate: dueDate.toISOString(),
  notes: `Sales Dispatch - Collection Period: ${client.collectionPeriodDays} days`
};
```

### Collection Alerts (تنبيهات التحصيل)

#### Overdue Detection
```typescript
const today = new Date();
const overdueInvoices = financialTransactions.filter(t => 
  t.entityType === EntityType.CLIENT &&
  t.type === TransactionType.INVOICE &&
  t.dueDate &&
  !t.paidDate &&
  new Date(t.dueDate) < today
);
```

#### Alert Structure
```typescript
interface CollectionAlert {
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  daysOverdue: number; // عدد الأيام المتأخرة
  currentBalance: number;
}
```

---

## 3. FINANCIAL SCHEMA (الهيكل المالي)

### Database Tables

#### Vendors Table
```sql
CREATE TABLE Vendors (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  contact_person VARCHAR,
  phone VARCHAR,
  address TEXT,
  tax_id VARCHAR,
  payment_terms ENUM('CASH', 'CREDIT', 'HYBRID_SALES_LINKED'),
  current_balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2),
  cash_percentage DECIMAL(5,2), -- For HYBRID
  commission_per_unit DECIMAL(10,2) -- For HYBRID
);
```

#### Clients Table
```sql
CREATE TABLE Clients (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  contact_person VARCHAR,
  phone VARCHAR,
  gps_location VARCHAR,
  category VARCHAR,
  collection_period_days INT NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### Financial_Ledger Table
```sql
CREATE TABLE Financial_Ledger (
  id VARCHAR PRIMARY KEY,
  entity_type ENUM('VENDOR', 'CLIENT'),
  entity_id VARCHAR NOT NULL,
  entity_name VARCHAR,
  transaction_date DATETIME NOT NULL,
  type ENUM('INVOICE', 'PAYMENT', 'RETURN', 'CREDIT_NOTE', 'DEBIT_NOTE'),
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  reference_doc_id VARCHAR, -- Link to Stock Movement
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  
  FOREIGN KEY (reference_doc_id) REFERENCES Stock_Movements(id)
);
```

### Enhanced Stock Movement
```typescript
interface StockMovement {
  // ... existing fields
  vendorId?: string; // Link to vendor for IN movements
  clientId?: string; // Link to client for OUT movements
  unitCost?: number; // Cost per unit
  totalAmount?: number; // Total transaction amount
}
```

---

## 4. REPORTING ENGINE (محرك التقارير)

### Statement of Account (SOA) - كشف حساب

```typescript
function generateSOA(
  entityType: EntityType,
  entityId: string,
  dateFrom?: string,
  dateTo?: string
): FinancialTransaction[] {
  return financialTransactions
    .filter(t => 
      t.entityType === entityType &&
      t.entityId === entityId &&
      (!dateFrom || t.transactionDate >= dateFrom) &&
      (!dateTo || t.transactionDate <= dateTo)
    )
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
}
```

### Aging Report (تحليل أعمار الديون)

```typescript
interface AgingReport {
  '0-30': number;   // ديون 0-30 يوم
  '31-60': number;  // ديون 31-60 يوم
  '61+': number;    // ديون أكثر من 60 يوم
}

function calculateAging(transactions: FinancialTransaction[]): AgingReport {
  const today = new Date();
  const aging = { '0-30': 0, '31-60': 0, '61+': 0 };
  
  transactions
    .filter(t => t.type === 'INVOICE' && t.dueDate && !t.paidDate)
    .forEach(t => {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysOverdue <= 30) aging['0-30'] += t.amount;
      else if (daysOverdue <= 60) aging['31-60'] += t.amount;
      else aging['61+'] += t.amount;
    });
    
  return aging;
}
```

### Financial Summary Dashboard

```typescript
interface FinancialSummary {
  totalPayables: number;      // إجمالي المستحقات للموردين
  totalReceivables: number;   // إجمالي المقبوضات من العملاء
  netPosition: number;        // صافي الوضع المالي (Receivables - Payables)
  overdueCount: number;       // عدد الفواتير المتأخرة
  overdueAmount: number;      // مبلغ التحصيلات المتأخرة
}
```

---

## 5. BUSINESS LOGIC & VALIDATION

### Credit Limit Check (فحص الحد الائتماني)

```typescript
function validateClientOrder(client: Client, orderAmount: number): {
  approved: boolean;
  reason?: string;
} {
  const newBalance = client.currentBalance + orderAmount;
  
  if (newBalance > client.creditLimit) {
    return {
      approved: false,
      reason: `Exceeds credit limit: ${client.creditLimit.toFixed(2)} SAR`
    };
  }
  
  return { approved: true };
}
```

### Overdue Check (فحص التأخير)

```typescript
function checkOverdueStatus(
  client: Client,
  transactions: FinancialTransaction[]
): { hasOverdue: boolean; overdueAmount: number } {
  const today = new Date();
  let overdueAmount = 0;
  
  const hasOverdue = transactions.some(t => {
    if (
      t.entityId === client.id &&
      t.type === 'INVOICE' &&
      t.dueDate &&
      !t.paidDate &&
      new Date(t.dueDate) < today
    ) {
      overdueAmount += t.amount;
      return true;
    }
    return false;
  });
  
  return { hasOverdue, overdueAmount };
}
```

### Sales Dispatch with Manager Approval

```typescript
async function processSalesOrder(
  client: Client,
  orderDetails: OrderDetails
): Promise<{ status: string; message: string }> {
  // 1. Check credit limit
  const creditCheck = validateClientOrder(client, orderDetails.totalAmount);
  if (!creditCheck.approved) {
    return {
      status: 'REQUIRES_APPROVAL',
      message: `Credit limit exceeded. Manager approval required.`
    };
  }
  
  // 2. Check overdue
  const overdueCheck = checkOverdueStatus(client, financialTransactions);
  if (overdueCheck.hasOverdue) {
    return {
      status: 'REQUIRES_APPROVAL',
      message: `Client has overdue payments: ${overdueCheck.overdueAmount.toFixed(2)} SAR`
    };
  }
  
  // 3. Process order
  return { status: 'APPROVED', message: 'Order processed successfully' };
}
```

---

## 6. INTEGRATION WORKFLOW

### Inbound Flow (استلام بضاعة)

```
1. User receives goods from vendor
2. System creates Stock Movement (IN)
3. System creates Vendor Invoice in Financial Ledger
4. System updates Vendor Balance based on Payment Terms
5. If CASH → Record immediate payment
6. If HYBRID → Split payment (cash + credit)
7. Update Inventory quantities
```

### Outbound Flow (صرف بضاعة)

```
1. User dispatches goods to client
2. System creates Stock Movement (OUT)
3. System checks client credit limit
4. System checks for overdue payments
5. If validation passes → Create Client Invoice
6. Calculate due date (current date + collectionPeriodDays)
7. Update Client Balance
8. Create Collection Alert if needed
9. Update Inventory quantities
```

---

## 7. LocalStorage Schema

```typescript
const STORAGE_KEYS = {
  VENDORS: 'nexus_vendors',
  CLIENTS: 'nexus_clients',
  FINANCIAL_TRANSACTIONS: 'nexus_financial_transactions',
  INVENTORY: 'nexus_inventory',
  MOVEMENTS: 'nexus_movements',
  // ... other keys
};
```

---

## 8. API ENDPOINTS (للتطوير المستقبلي)

### Vendor APIs
```
GET    /api/vendors                    - List all vendors
POST   /api/vendors                    - Create vendor
GET    /api/vendors/:id                - Get vendor details
PUT    /api/vendors/:id                - Update vendor
GET    /api/vendors/:id/transactions   - Get vendor SOA
POST   /api/vendors/:id/payment        - Record payment to vendor
```

### Client APIs
```
GET    /api/clients                    - List all clients
POST   /api/clients                    - Create client
GET    /api/clients/:id                - Get client details
PUT    /api/clients/:id                - Update client
GET    /api/clients/:id/transactions   - Get client SOA
POST   /api/clients/:id/payment        - Record payment from client
GET    /api/clients/overdue            - Get overdue clients
```

### Financial APIs
```
GET    /api/financial/summary          - Get financial dashboard
GET    /api/financial/aging-report     - Get aging analysis
GET    /api/financial/soa              - Generate statement of account
POST   /api/financial/transaction      - Create manual transaction
```

---

## 9. USAGE EXAMPLES

### Adding a New Vendor

```typescript
const newVendor: Vendor = {
  id: `vendor-${Date.now()}`,
  name: "شركة التوريدات المتحدة",
  contactPerson: "أحمد محمد",
  phone: "+966501234567",
  address: "الرياض، شارع الملك فهد",
  taxId: "300012345600003",
  paymentTerms: PaymentTerms.HYBRID_SALES_LINKED,
  currentBalance: 0,
  creditLimit: 100000,
  cashPercentage: 30,  // 30% نقدي فوري
  commissionPerUnit: 5 // 5 ر.س لكل وحدة مباعة
};
```

### Processing Vendor Invoice

```typescript
// عند استلام بضاعة
const totalCost = unitCost * quantity;
const { invoice, newBalance, cashPayment } = createVendorInvoice(
  vendor,
  stockMovement,
  unitCost,
  quantity
);

// Update vendor balance
vendor.currentBalance = newBalance;

// Save financial transaction
financialTransactions.push(invoice);

if (cashPayment) {
  console.log(`Cash payment required: ${cashPayment.toFixed(2)} SAR`);
}
```

---

## 10. REPORTS AVAILABLE

1. **Total Payables Report** - إجمالي المستحقات للموردين
2. **Total Receivables Report** - إجمالي المقبوضات من العملاء
3. **Collection Alerts** - تنبيهات التحصيل المتأخر
4. **Aging Report** - تحليل أعمار الديون (0-30, 31-60, 61+)
5. **Statement of Account (SOA)** - كشف حساب تفصيلي لأي مورد/عميل
6. **Net Financial Position** - صافي الوضع المالي للشركة

---

## التطوير المستقبلي (Future Enhancements)

1. ربط مع أنظمة محاسبية خارجية (QuickBooks, SAP, etc.)
2. تقارير ضريبية آلية
3. تذكيرات آلية للعملاء عبر SMS/Email
4. لوحة تحكم تنبؤية (Predictive Analytics) لتوقع التدفقات النقدية
5. دعم عملات متعددة
6. دفع إلكتروني متكامل

---

**تم إعداد الوثيقة بواسطة Nexus WMS Development Team**
