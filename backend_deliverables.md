# WMS v2.0 Backend Deliverables

## 1. PostgreSQL Schema (Phase 1)

```sql
-- Enums
CREATE TYPE product_type_enum AS ENUM ('RESALE', 'RAW_MATERIAL', 'CONSUMABLE', 'ASSET');
CREATE TYPE movement_type_enum AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'CONSUMPTION');

-- 1. Departments (Cost Centers)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cost_center_code VARCHAR(50) UNIQUE NOT NULL,
    budget_cap DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Warehouses & Locations
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location_address TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES warehouses(id),
    zone VARCHAR(50),
    aisle VARCHAR(50),
    rack VARCHAR(50),
    bin_code VARCHAR(100) NOT NULL UNIQUE, -- Generated unique string
    CONSTRAINT fk_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- 3. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type product_type_enum NOT NULL DEFAULT 'RESALE',
    min_reorder_level INTEGER DEFAULT 0,
    is_serialized BOOLEAN DEFAULT FALSE,
    is_batch_tracked BOOLEAN DEFAULT FALSE,
    expense_account_code VARCHAR(100), -- Linked to General Ledger for CONSUMABLES
    current_wac_cost DECIMAL(15, 4) DEFAULT 0.0000, -- Weighted Average Cost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory (Current State)
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES warehouses(id),
    location_id UUID REFERENCES locations(id),
    product_id UUID REFERENCES products(id),
    quantity_on_hand DECIMAL(15, 4) DEFAULT 0,
    quantity_reserved DECIMAL(15, 4) DEFAULT 0,
    CONSTRAINT unique_stock_loc UNIQUE (warehouse_id, location_id, product_id)
);

-- 5. Batches (Expiry Tracking)
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE,
    quantity DECIMAL(15, 4) DEFAULT 0
);

-- 6. Stock Movements (The Ledger)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type movement_type_enum NOT NULL,
    product_id UUID REFERENCES products(id),
    warehouse_from_id UUID REFERENCES warehouses(id),
    warehouse_to_id UUID REFERENCES warehouses(id),
    department_id UUID REFERENCES departments(id), -- For Internal Consumption
    quantity DECIMAL(15, 4) NOT NULL,
    unit_cost DECIMAL(15, 4) NOT NULL, -- Cost at time of movement
    reference_doc_id VARCHAR(100), -- PO#, SO#, or REQ#
    user_id UUID NOT NULL -- Link to Users table
);
```

## 2. Backend Logic: Internal Consumption Service (Phase 2)

**Conceptual Logic (Python/Pseudocode)**

```python
def process_internal_consumption(req_data, user):
    """
    Handles the issuing of CONSUMABLE items to a department.
    """
    db.begin_transaction()
    
    try:
        product = db.get_product(req_data.product_id)
        dept = db.get_department(req_data.department_id)
        
        # 1. Validation
        if product.type == 'RESALE':
             raise Error("Cannot issue RESALE items for internal consumption.")
             
        stock = db.get_inventory(product.id, req_data.warehouse_id)
        if stock.quantity_on_hand < req_data.quantity:
             raise Error("Insufficient Stock.")

        # 2. Financial Calculation (WAC)
        total_cost = req_data.quantity * product.current_wac_cost
        
        # 3. Budget Check (Optional strict enforcement)
        current_spend = db.get_monthly_spend(dept.id)
        if (current_spend + total_cost) > dept.budget_cap:
             # Log warning or block depending on config
             pass 

        # 4. Create Movement Ledger
        movement = StockMovement(
            type='CONSUMPTION',
            product_id=product.id,
            warehouse_from_id=req_data.warehouse_id,
            department_id=dept.id,
            quantity=req_data.quantity,
            unit_cost=product.current_wac_cost,
            reference_doc_id=req_data.req_number,
            user_id=user.id
        )
        db.save(movement)

        # 5. Update Stock Levels
        stock.quantity_on_hand -= req_data.quantity
        db.save(stock)

        db.commit()
        return {"status": "success", "cost_allocated": total_cost}

    except Exception as e:
        db.rollback()
        raise e
```

## 3. SQL Query: Monthly Consumption per Department

```sql
SELECT 
    d.name AS department_name,
    d.cost_center_code,
    TO_CHAR(m.transaction_date, 'YYYY-MM') AS month_year,
    SUM(m.quantity * m.unit_cost) AS total_consumption_cost
FROM 
    stock_movements m
JOIN 
    departments d ON m.department_id = d.id
WHERE 
    m.type = 'CONSUMPTION'
    AND m.transaction_date >= DATE_TRUNC('year', CURRENT_DATE) -- Current Year
GROUP BY 
    d.name, d.cost_center_code, TO_CHAR(m.transaction_date, 'YYYY-MM')
ORDER BY 
    month_year DESC, total_consumption_cost DESC;
```
