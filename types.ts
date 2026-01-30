// Enums for standardizing values
export enum MovementType {
  IN = 'IN', // Purchase Receipt
  OUT = 'OUT', // Sales Dispatch
  TRANSFER = 'TRANSFER', // Internal Transfer
  ADJUSTMENT = 'ADJUSTMENT', // Stock Take Correction
  CONSUMPTION = 'CONSUMPTION' // Internal Dept Usage
}

export enum ProductType {
  RESALE = 'RESALE',
  CONSUMABLE = 'CONSUMABLE',
  RAW_MATERIAL = 'RAW_MATERIAL',
  ASSET = 'ASSET'
}

export enum LocationType {
  ZONE = 'ZONE',
  RACK = 'RACK',
  BIN = 'BIN'
}

// Financial Enums
export enum PaymentTerms {
  CASH = 'CASH', // Immediate payment
  CREDIT = 'CREDIT', // Full amount to balance
  HYBRID_SALES_LINKED = 'HYBRID_SALES_LINKED' // Part cash, part commission
}

export enum TransactionType {
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  RETURN = 'RETURN',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE'
}

export enum EntityType {
  VENDOR = 'VENDOR',
  CLIENT = 'CLIENT'
}

// Entity Interfaces

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  costCenterCode: string;
  budgetCap: number;
}

export interface Location {
  id: string;
  warehouseId: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  binCode: string; // Generated unique string
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  type: ProductType; // New field for Mixed Inventory
  minReorderLevel: number;
  currentAvgCost: number; // WAC
  isSerialized: boolean;
  isBatchTracked: boolean;
  unit: string;
  expenseAccountCode?: string; // For consumables
}

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

export interface InventoryStock {
  id: string;
  warehouseId: string;
  locationId: string;
  productId: string;
  productName: string;
  productType: ProductType;
  sku: string;
  quantityOnHand: number;
  quantityReserved: number;
  batches?: Batch[];
}

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  productId: string;
  productName: string;
  warehouseFromId?: string;
  warehouseToId?: string;
  departmentId?: string; // Linked for CONSUMPTION
  quantity: number;
  referenceDocId: string;
  user: string;
  vendorId?: string; // Link to vendor for IN movements
  clientId?: string; // Link to client for OUT movements
  unitCost?: number; // Cost per unit
  totalAmount?: number; // Total transaction amount
}

// Financial Interfaces

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: PaymentTerms;
  currentBalance: number; // Amount we owe them
  creditLimit?: number;
  // Hybrid/Sales-linked config
  cashPercentage?: number; // For HYBRID (e.g., 30% cash)
  commissionPerUnit?: number; // For sales-linked payments
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  gpsLocation: string; // Lat/Long or address
  category: string; // e.g., Retail, Wholesale
  collectionPeriodDays: number; // e.g., 15, 30 days
  currentBalance: number; // Amount they owe us
  creditLimit: number;
  isActive: boolean;
}

export interface FinancialTransaction {
  id: string;
  entityType: EntityType;
  entityId: string; // Vendor or Client ID
  entityName: string;
  transactionDate: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceDocId: string; // Link to StockMovement or Invoice
  notes?: string;
  dueDate?: string; // For invoices
  paidDate?: string; // For payments
}

export interface CollectionAlert {
  id: string;
  clientId: string;
  clientName: string;
  invoiceId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  daysOverdue: number;
  currentBalance: number;
}

// UI State Management
export type MainMenu =
  | 'dashboard'
  | 'master_data'
  | 'vendors'
  | 'clients'
  | 'inbound'
  | 'outbound'
  | 'internal_req'
  | 'inventory'
  | 'financial'
  | 'reports'
  | 'admin';

export type SubMenu = string;

export interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}