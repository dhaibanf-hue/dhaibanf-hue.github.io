-- ================================================
-- Nexus WMS - Financial Accounting Module
-- SQL Schema Definition
-- ================================================

-- ================================================
-- 1. VENDOR TABLES (إدارة الموردين)
-- ================================================

CREATE TABLE Vendors (
    vendor_id VARCHAR(50) PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms ENUM('CASH', 'CREDIT', 'HYBRID_SALES_LINKED') NOT NULL DEFAULT 'CREDIT',
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(15, 2),
    
    -- For HYBRID_SALES_LINKED payment terms
    cash_percentage DECIMAL(5, 2),  -- e.g., 30.00 for 30%
    commission_per_unit DECIMAL(10, 2),  -- e.g., 5.00 SAR per unit sold
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_vendor_name (vendor_name),
    INDEX idx_payment_terms (payment_terms),
    INDEX idx_balance (current_balance)
);

-- ================================================
-- 2. CLIENT TABLES (إدارة العملاء)
-- ================================================

CREATE TABLE Clients (
    client_id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    gps_location VARCHAR(255),  -- Can store "lat,lng" or full address
    category VARCHAR(50),  -- e.g., 'Retail', 'Wholesale', 'Distributor'
    collection_period_days INT NOT NULL DEFAULT 30,  -- Payment due period
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_client_name (client_name),
    INDEX idx_category (category),
    INDEX idx_balance (current_balance),
    INDEX idx_active (is_active)
);

-- ================================================
-- 3. FINANCIAL LEDGER (دفتر استاذ المالي)
-- ================================================

CREATE TABLE Financial_Ledger (
    transaction_id VARCHAR(50) PRIMARY KEY,
    entity_type ENUM('VENDOR', 'CLIENT') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_type ENUM('INVOICE', 'PAYMENT', 'RETURN', 'CREDIT_NOTE', 'DEBIT_NOTE') NOT NULL,
    
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    
    reference_doc_id VARCHAR(50),  -- Link to Stock_Movements or other docs
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_type (transaction_type),
    INDEX idx_due_date (due_date),
    INDEX idx_unpaid (entity_type, due_date, paid_date),
    
    -- Foreign keys (if using relational DB)
    FOREIGN KEY (reference_doc_id) REFERENCES Stock_Movements(movement_id) ON DELETE SET NULL
);

-- ================================================
-- 4. ENHANCED STOCK MOVEMENTS (حركات المخزون)
-- ================================================

CREATE TABLE Stock_Movements (
    movement_id VARCHAR(50) PRIMARY KEY,
    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    movement_type ENUM('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'CONSUMPTION') NOT NULL,
    
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    
    warehouse_from_id VARCHAR(50),
    warehouse_to_id VARCHAR(50),
    department_id VARCHAR(50),
    
    quantity DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2),  -- Cost per unit (for IN movements)
    total_amount DECIMAL(15, 2),  -- Total financial value
    
    -- Financial Links
    vendor_id VARCHAR(50),  -- For IN movements
    client_id VARCHAR(50),  -- For OUT movements
    
    reference_doc_id VARCHAR(50),  -- PO, SO, etc.
    user VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product (product_id),
    INDEX idx_date (movement_date),
    INDEX idx_type (movement_type),
    INDEX idx_vendor (vendor_id),
    INDEX idx_client (client_id),
    
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES Clients(client_id) ON DELETE SET NULL
);

-- ================================================
-- 5. COLLECTION ALERTS VIEW (عرض تنبيهات التحصيل)
-- ================================================

CREATE OR REPLACE VIEW Collection_Alerts AS
SELECT 
    fl.transaction_id AS alert_id,
    fl.entity_id AS client_id,
    fl.entity_name AS client_name,
    fl.reference_doc_id AS invoice_id,
    fl.transaction_date AS invoice_date,
    fl.due_date,
    fl.amount,
    DATEDIFF(CURRENT_DATE, fl.due_date) AS days_overdue,
    c.current_balance,
    c.credit_limit,
    c.phone,
    c.gps_location
FROM 
    Financial_Ledger fl
    JOIN Clients c ON fl.entity_id = c.client_id
WHERE 
    fl.entity_type = 'CLIENT'
    AND fl.transaction_type = 'INVOICE'
    AND fl.paid_date IS NULL
    AND fl.due_date < CURRENT_DATE
ORDER BY 
    days_overdue DESC;

-- ================================================
-- 6. AGING REPORT VIEW (عرض تحليل أعمار الديون)
-- ================================================

CREATE OR REPLACE VIEW Aging_Report AS
SELECT 
    fl.entity_id AS client_id,
    c.client_name,
    c.category,
    c.phone,
    SUM(CASE 
        WHEN DATEDIFF(CURRENT_DATE, fl.due_date) BETWEEN 0 AND 30 
        THEN fl.amount ELSE 0 
    END) AS aging_0_30,
    SUM(CASE 
        WHEN DATEDIFF(CURRENT_DATE, fl.due_date) BETWEEN 31 AND 60 
        THEN fl.amount ELSE 0 
    END) AS aging_31_60,
    SUM(CASE 
        WHEN DATEDIFF(CURRENT_DATE, fl.due_date) > 60 
        THEN fl.amount ELSE 0 
    END) AS aging_61_plus,
    SUM(fl.amount) AS total_overdue,
    c.current_balance,
    c.credit_limit
FROM 
    Financial_Ledger fl
    JOIN Clients c ON fl.entity_id = c.client_id
WHERE 
    fl.entity_type = 'CLIENT'
    AND fl.transaction_type = 'INVOICE'
    AND fl.paid_date IS NULL
    AND fl.due_date < CURRENT_DATE
GROUP BY 
    fl.entity_id, c.client_name, c.category, c.phone, c.current_balance, c.credit_limit
ORDER BY 
    total_overdue DESC;

-- ================================================
-- 7. FINANCIAL SUMMARY VIEW (عرض ملخص مالي)
-- ================================================

CREATE OR REPLACE VIEW Financial_Summary AS
SELECT 
    (SELECT COALESCE(SUM(current_balance), 0) FROM Vendors) AS total_payables,
    (SELECT COALESCE(SUM(current_balance), 0) FROM Clients) AS total_receivables,
    (SELECT COALESCE(SUM(current_balance), 0) FROM Clients) - 
    (SELECT COALESCE(SUM(current_balance), 0) FROM Vendors) AS net_position,
    (SELECT COUNT(*) FROM Financial_Ledger 
     WHERE entity_type = 'CLIENT' 
     AND transaction_type = 'INVOICE' 
     AND paid_date IS NULL 
     AND due_date < CURRENT_DATE) AS overdue_invoices_count,
    (SELECT COALESCE(SUM(amount), 0) FROM Financial_Ledger 
     WHERE entity_type = 'CLIENT' 
     AND transaction_type = 'INVOICE' 
     AND paid_date IS NULL 
     AND due_date < CURRENT_DATE) AS overdue_amount;

-- ================================================
-- 8. STORED PROCEDURES
-- ================================================

-- Procedure: Record Vendor Payment
DELIMITER //
CREATE PROCEDURE Record_Vendor_Payment(
    IN p_vendor_id VARCHAR(50),
    IN p_amount DECIMAL(15,2),
    IN p_reference VARCHAR(50),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_current_balance DECIMAL(15,2);
    DECLARE v_new_balance DECIMAL(15,2);
    DECLARE v_vendor_name VARCHAR(255);
    
    -- Get current vendor info
    SELECT current_balance, vendor_name 
    INTO v_current_balance, v_vendor_name
    FROM Vendors 
    WHERE vendor_id = p_vendor_id;
    
    -- Calculate new balance
    SET v_new_balance = v_current_balance - p_amount;
    
    -- Insert payment transaction
    INSERT INTO Financial_Ledger (
        transaction_id, entity_type, entity_id, entity_name,
        transaction_date, transaction_type, amount, balance_after,
        reference_doc_id, paid_date, notes, created_by
    ) VALUES (
        CONCAT('PAY-', UUID()), 'VENDOR', p_vendor_id, v_vendor_name,
        NOW(), 'PAYMENT', p_amount, v_new_balance,
        p_reference, CURRENT_DATE, p_notes, USER()
    );
    
    -- Update vendor balance
    UPDATE Vendors 
    SET current_balance = v_new_balance,
        updated_at = NOW()
    WHERE vendor_id = p_vendor_id;
    
    SELECT 'Payment recorded successfully' AS message, v_new_balance AS new_balance;
END//
DELIMITER ;

-- Procedure: Record Client Payment
DELIMITER //
CREATE PROCEDURE Record_Client_Payment(
    IN p_client_id VARCHAR(50),
    IN p_amount DECIMAL(15,2),
    IN p_invoice_id VARCHAR(50),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_current_balance DECIMAL(15,2);
    DECLARE v_new_balance DECIMAL(15,2);
    DECLARE v_client_name VARCHAR(255);
    
    -- Get current client info
    SELECT current_balance, client_name 
    INTO v_current_balance, v_client_name
    FROM Clients 
    WHERE client_id = p_client_id;
    
    -- Calculate new balance
    SET v_new_balance = v_current_balance - p_amount;
    
    -- Insert payment transaction
    INSERT INTO Financial_Ledger (
        transaction_id, entity_type, entity_id, entity_name,
        transaction_date, transaction_type, amount, balance_after,
        reference_doc_id, paid_date, notes, created_by
    ) VALUES (
        CONCAT('RCV-', UUID()), 'CLIENT', p_client_id, v_client_name,
        NOW(), 'PAYMENT', p_amount, v_new_balance,
        p_invoice_id, CURRENT_DATE, p_notes, USER()
    );
    
    -- Mark invoice as paid
    UPDATE Financial_Ledger
    SET paid_date = CURRENT_DATE
    WHERE transaction_id = p_invoice_id;
    
    -- Update client balance
    UPDATE Clients 
    SET current_balance = v_new_balance,
        updated_at = NOW()
    WHERE client_id = p_client_id;
    
    SELECT 'Payment received successfully' AS message, v_new_balance AS new_balance;
END//
DELIMITER ;

-- ================================================
-- 9. SAMPLE DATA (للاختبار)
-- ================================================

-- Insert sample vendors
INSERT INTO Vendors (vendor_id, vendor_name, contact_person, phone, payment_terms, cash_percentage, commission_per_unit) VALUES
('VEN-001', 'شركة التوريدات المتحدة', 'أحمد محمد', '+966501234567', 'HYBRID_SALES_LINKED', 30.00, 5.00),
('VEN-002', 'مؤسسة الإمدادات الحديثة', 'خالد عبدالله', '+966502345678', 'CREDIT', NULL, NULL),
('VEN-003', 'شركة النقل السريع', 'محمد علي', '+966503456789', 'CASH', NULL, NULL);

-- Insert sample clients
INSERT INTO Clients (client_id, client_name, contact_person, phone, gps_location, category, collection_period_days, credit_limit) VALUES
('CLI-001', 'سوبر ماركت النخيل', 'فهد السعيد', '+966504567890', '24.7136,46.6753', 'Retail', 15, 50000.00),
('CLI-002', 'مجموعة الرياض التجارية', 'سعد المطيري', '+966505678901', '24.7500,46.7000', 'Wholesale', 30, 150000.00),
('CLI-003', 'متجر الوسطى', 'عبدالله الدوسري', '+966506789012', '24.7000,46.6500', 'Retail', 7, 25000.00);

-- ================================================
-- 10. USEFUL QUERIES
-- ================================================

-- Get vendor statement of account
SELECT 
    transaction_date,
    transaction_type,
    reference_doc_id,
    amount,
    balance_after,
    notes
FROM Financial_Ledger
WHERE entity_type = 'VENDOR' AND entity_id = 'VEN-001'
ORDER BY transaction_date DESC;

-- Get clients with overdue payments
SELECT * FROM Collection_Alerts;

-- Get aging report
SELECT * FROM Aging_Report;

-- Get financial summary
SELECT * FROM Financial_Summary;

-- Find clients exceeding credit limit
SELECT 
    client_id,
    client_name,
    current_balance,
    credit_limit,
    (current_balance - credit_limit) AS excess_amount
FROM Clients
WHERE current_balance > credit_limit
ORDER BY excess_amount DESC;

-- ================================================
-- End of Schema
-- ================================================
