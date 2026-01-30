# Nexus WMS - Financial Module Integration Roadmap

## ✅ Completed Tasks

- [x] Create TypeScript type definitions for financial entities
- [x] Build VendorModal component
- [x] Build ClientModal component
- [x] Build FinancialDashboard component
- [x] Update Sidebar with financial menu items
- [x] Create financial helper functions
- [x] Create API service layer
- [x] Write SQL database schema
- [x] Write comprehensive documentation
- [x] Create usage examples
- [x] Fix warehouse persistence in InboundModal

---

## 🔄 In Progress

### High Priority - App.tsx Integration

- [ ] **Add State Management**
  ```typescript
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  ```

- [ ] **Add LocalStorage Keys**
  ```typescript
  const STORAGE_KEYS = {
    // ... existing keys
    VENDORS: 'nexus_vendors',
    CLIENTS: 'nexus_clients',
    FINANCIAL_TRANSACTIONS: 'nexus_financial_transactions'
  };
  ```

- [ ] **Add Load/Save Effects**
  ```typescript
  // Load on mount
  useEffect(() => {
    loadData('nexus_vendors', setVendors);
    loadData('nexus_clients', setClients);
    loadData('nexus_financial_transactions', setFinancialTransactions);
  }, []);
  
  // Save on change
  useEffect(() => { 
    localStorage.setItem('nexus_vendors', JSON.stringify(vendors)); 
  }, [vendors]);
  // ... similar for clients and transactions
  ```

- [ ] **Add Handler Functions**
  ```typescript
  const handleAddVendor = () => setShowVendorModal(true);
  const handleVendorSubmit = (vendorData) => {
    const newVendor: Vendor = {
      ...vendorData,
      id: `VEN-${Date.now()}`,
      currentBalance: 0
    };
    setVendors(prev => [...prev, newVendor]);
    setShowVendorModal(false);
  };
  
  // Similar for clients
  const handleAddClient = () => setShowClientModal(true);
  const handleClientSubmit = (clientData) => { /* ... */ };
  ```

---

## 🎯 Next Steps - Inbound Modal Enhancement

- [ ] **Update InboundModal.tsx**
  
  **Step 1**: Add vendor selection prop
  ```typescript
  interface InboundModalProps {
    // ... existing props
    vendors: Vendor[];
  }
  ```
  
  **Step 2**: Add vendor state
  ```typescript
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  ```
  
  **Step 3**: Add vendor dropdown
  ```tsx
  <select 
    value={selectedVendor}
    onChange={e => setSelectedVendor(e.target.value)}
    required
  >
    <option value="">اختر المورد...</option>
    {vendors.map(v => (
      <option key={v.id} value={v.id}>{v.name}</option>
    ))}
  </select>
  ```
  
  **Step 4**: Update submit handler
  ```typescript
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      selectedProduct, 
      selectedWarehouse,
      selectedVendor, // NEW
      quantity, 
      unitCost, 
      poNumber 
    });
    onClose();
  };
  ```

- [ ] **Update App.tsx handleInboundSubmit**
  ```typescript
  const handleInboundSubmit = (data: any) => {
    const vendor = vendors.find(v => v.id === data.selectedVendor);
    const prod = products.find(p => p.id === data.selectedProduct);
    
    // Create stock movement
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString(),
      type: MovementType.IN,
      productId: data.selectedProduct,
      productName: prod?.name || 'Unknown',
      quantity: data.quantity,
      referenceDocId: data.poNumber,
      user: 'Admin',
      warehouseToId: data.selectedWarehouse,
      vendorId: data.selectedVendor, // NEW
      unitCost: data.unitCost, // NEW
      totalAmount: data.quantity * data.unitCost // NEW
    };
    
    // Create vendor invoice
    if (vendor) {
      const { invoice, newBalance, cashPayment } = createVendorInvoice(
        vendor,
        newMovement,
        data.unitCost,
        data.quantity
      );
      
      // Update vendor balance
      setVendors(prev => prev.map(v => 
        v.id === vendor.id ? { ...v, currentBalance: newBalance } : v
      ));
      
      // Save financial transaction
      setFinancialTransactions(prev => [...prev, invoice]);
      
      // Alert if cash payment required
      if (cashPayment) {
        alert(`مطلوب دفع نقدي: ${cashPayment.toFixed(2)} ر.س`);
      }
    }
    
    // Update inventory (existing logic)
    setInventory(prev => {
      const idx = prev.findIndex(i => 
        i.productId === data.selectedProduct && 
        i.warehouseId === data.selectedWarehouse
      );
      
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { 
          ...updated[idx], 
          quantityOnHand: updated[idx].quantityOnHand + data.quantity 
        };
        return updated;
      }
      
      return [...prev, {
        id: `stk-${Date.now()}`,
        warehouseId: data.selectedWarehouse,
        locationId: 'GEN',
        productId: data.selectedProduct,
        productName: prod?.name || 'Unknown',
        productType: prod?.type || ProductType.RESALE,
        sku: prod?.sku || '',
        quantityOnHand: data.quantity,
        quantityReserved: 0
      }];
    });
    
    setMovements(prev => [newMovement, ...prev]);
    setShowInbound(false);
  };
  ```

---

## 🎯 Outbound Modal Enhancement

- [ ] **Update OutboundModal.tsx**
  
  **Step 1**: Add client selection
  ```typescript
  interface OutboundModalProps {
    // ... existing props
    clients: Client[];
  }
  
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  ```
  
  **Step 2**: Add client dropdown
  ```tsx
  <select 
    value={selectedClient}
    onChange={e => setSelectedClient(e.target.value)}
    required
  >
    <option value="">اختر العميل...</option>
    {clients.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>
  ```
  
  **Step 3**: Add validation display
  ```tsx
  {selectedClient && (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
      <p className="text-sm">
        الحد الائتماني: {client.creditLimit.toFixed(2)} ر.س
      </p>
      <p className="text-sm">
        الرصيد الحالي: {client.currentBalance.toFixed(2)} ر.س
      </p>
      {checkCreditLimit(client, quantity * unitPrice) && (
        <p className="text-red-600 font-bold text-sm mt-2">
          ⚠️ تحذير: تجاوز الحد الائتماني - يتطلب موافقة المدير
        </p>
      )}
    </div>
  )}
  ```

- [ ] **Update App.tsx handleOutboundSubmit**
  ```typescript
  const handleOutboundSubmit = async (data: any) => {
    const client = clients.find(c => c.id === data.selectedClient);
    const invItem = inventory.find(i => i.id === data.selectedInventoryId);
    
    if (!client || !invItem) return;
    
    // Validate order
    const totalAmount = data.quantity * data.unitPrice;
    
    if (checkCreditLimit(client, totalAmount)) {
      const confirm = window.confirm(
        'هذا الطلب يتجاوز الحد الائتماني. هل تريد المتابعة (يتطلب موافقة مدير)?'
      );
      if (!confirm) return;
    }
    
    if (hasOverduePayments(client, financialTransactions)) {
      const confirm = window.confirm(
        'لدى العميل فواتير متأخرة. هل تريد المتابعة (يتطلب موافقة مدير)?'
      );
      if (!confirm) return;
    }
    
    // Create stock movement
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString(),
      type: MovementType.OUT,
      productId: invItem.productId,
      productName: invItem.productName,
      warehouseFromId: invItem.warehouseId,
      quantity: data.quantity,
      referenceDocId: data.soNumber,
      user: 'Admin',
      clientId: data.selectedClient, // NEW
      unitCost: data.unitPrice, // NEW
      totalAmount: totalAmount // NEW
    };
    
    // Create client invoice
    const { invoice, newBalance, dueDate } = createClientInvoice(
      client,
      newMovement,
      data.unitPrice,
      data.quantity
    );
    
    // Update client balance
    setClients(prev => prev.map(c => 
      c.id === client.id ? { ...c, currentBalance: newBalance } : c
    ));
    
    // Save financial transaction
    setFinancialTransactions(prev => [...prev, invoice]);
    
    // Update inventory (existing logic)
    setInventory(prev => prev.map(item => {
      if (item.id === data.selectedInventoryId) {
        return { ...item, quantityOnHand: item.quantityOnHand - data.quantity };
      }
      return item;
    }));
    
    setMovements(prev => [newMovement, ...prev]);
    setShowOutbound(false);
  };
  ```

---

## 🎯 Rendering Financial Pages

- [ ] **Add Financial Menu Cases in renderContent()**
  ```typescript
  const renderContent = () => {
    const key = `${currentMenu}|${currentSubMenu}`;
    
    switch (key) {
      // ... existing cases
      
      case 'vendors|list':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">قائمة الموردين</h2>
              <button
                onClick={handleAddVendor}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                إضافة مورد جديد
              </button>
            </div>
            <GenericList
              title="الموردين"
              data={vendors}
              columns={[
                { header: 'الاسم', accessor: 'name' },
                { header: 'الهاتف', accessor: 'phone' },
                { header: 'شروط الدفع', accessor: 'paymentTerms' },
                { header: 'الرصيد الحالي', accessor: 'currentBalance', render: (v) => v.toFixed(2) + ' ر.س' }
              ]}
              onAdd={handleAddVendor}
            />
          </div>
        );
      
      case 'clients|list':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">قائمة العملاء</h2>
              <button
                onClick={handleAddClient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                إضافة عميل جديد
              </button>
            </div>
            <GenericList
              title="العملاء"
              data={clients}
              columns={[
                { header: 'الاسم', accessor: 'name' },
                { header: 'الهاتف', accessor: 'phone' },
                { header: 'الفئة', accessor: 'category' },
                { header: 'الرصيد الحالي', accessor: 'currentBalance', render: (v) => v.toFixed(2) + ' ر.س' },
                { header: 'الحد الائتماني', accessor: 'creditLimit', render: (v) => v.toFixed(2) + ' ر.س' }
              ]}
              onAdd={handleAddClient}
            />
          </div>
        );
      
      case 'financial|dashboard':
        return (
          <FinancialDashboard
            vendors={vendors}
            clients={clients}
            transactions={financialTransactions}
          />
        );
      
      default:
        return <div>Page not found</div>;
    }
  };
  ```

- [ ] **Add Modal Renderings**
  ```tsx
  return (
    <div className="flex h-screen">
      <Sidebar ... />
      
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
      
      {/* Existing Modals */}
      {showInbound && <InboundModal ... vendors={vendors} />}
      {showOutbound && <OutboundModal ... clients={clients} />}
      {showProductModal && <ProductModal ... />}
      {/* ... other modals */}
      
      {/* NEW Financial Modals */}
      {showVendorModal && (
        <VendorModal
          onClose={() => setShowVendorModal(false)}
          onSubmit={handleVendorSubmit}
        />
      )}
      
      {showClientModal && (
        <ClientModal
          onClose={() => setShowClientModal(false)}
          onSubmit={handleClientSubmit}
        />
      )}
    </div>
  );
  ```

---

## ⏳ Future Enhancements

### Phase 1: Payment Recording
- [ ] Create PaymentModal for vendor payments
- [ ] Create CollectionModal for client payments
- [ ] Add payment history view

### Phase 2: Advanced Reports
- [ ] PDF export for SOA
- [ ] Excel export for financial reports
- [ ] Email collection reminders
- [ ] SMS integration for overdue alerts

### Phase 3: Backend Migration
- [ ] Deploy SQL database
- [ ] Create REST API endpoints
- [ ] Replace localStorage with HTTP calls
- [ ] Add authentication & authorization

### Phase 4: Analytics
- [ ] Cash flow projection
- [ ] Profit margin analysis
- [ ] Vendor performance reports
- [ ] Client purchasing patterns

---

## 🐛 Known Issues / Considerations

- [ ] No edit functionality for vendors/clients yet (only add)
- [ ] No delete functionality (add soft delete flag)
- [ ] Manager approval workflow is currently a simple confirm()
- [ ] No multi-currency support yet
- [ ] No batch payment processing
- [ ] No automated email/SMS notifications

---

## 📋 Testing Checklist

- [ ] Add vendor with CASH payment terms → Verify no balance added
- [ ] Add vendor with CREDIT payment terms → Verify full balance added
- [ ] Add vendor with HYBRID → Verify split calculation
- [ ] Add client → Verify credit limit set correctly
- [ ] Inbound with vendor → Verify invoice created, balance updated
- [ ] Outbound with client → Verify credit limit check works
- [ ] Outbound with client → Verify overdue check works
- [ ] View financial dashboard → Verify all totals correct
- [ ] View collection alerts → Verify overdue calculation
- [ ] View aging report → Verify bucket distribution
- [ ] Generate SOA → Verify transaction history
- [ ] Record vendor payment → Verify balance decreases
- [ ] Record client payment → Verify invoice marked paid

---

## 🎯 Success Criteria

✅ **Vendors can be added** with all 3 payment terms  
✅ **Clients can be added** with collection periods and credit limits  
✅ **Inbound creates vendor invoice** automatically  
✅ **Outbound validates client** credit before dispatch  
✅ **Financial dashboard shows** accurate totals  
✅ **Collection alerts work** for overdue detection  
✅ **Aging report categorizes** debts correctly  
✅ **SOA generates** transaction history  
✅ **Data persists** across browser refreshes  

---

**Status**: Ready for integration testing  
**Estimated Time**: 4-6 hours for full integration  
**Next Action**: Start with App.tsx state management
