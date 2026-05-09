/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export enum ProductType {
  NEW = 'new',
  USED = 'used',
  REPAIR = 'repair',
  ACCESSORY = 'accessory'
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string; // Auto-generated if not provided
  type: ProductType;
  category: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  imeiRequired: boolean;
  imeiList?: string[];
  supplierId?: string;
  supplierName?: string;
  description?: string;
  image?: string;
  vatRate: number; // Usually 5% for UAE
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  emirate?: string;
  trn?: string;
  categories: string[];
  bankDetails?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  emirate?: string;
  trn?: string; // Tax Registration Number for business customers
  totalSpent: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  type: ProductType;
  quantity: number;
  unitPrice: number;
  unitCost: number; // Cost at time of sale for profit calculation
  totalBeforeVat: number;
  vatAmount: number;
  totalWithVat: number;
  imeiRequired?: boolean;
  imei?: string[];
  repairDetails?: {
    issue: string;
    technician: string;
    expectedDate: string;
    status: 'received' | 'in-progress' | 'ready' | 'delivered';
  };
}

export enum SaleStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque'
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string; // For guest checkout
  items: SaleItem[];
  subtotal: number;
  vatTotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  receivedAmount: number;
  changeAmount: number;
  cashierId: string;
  cashierName: string;
  createdAt: string;
  promoCode?: string;
  notes?: string;
}

export enum AccountingType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum VoucherType {
  RECEIPT = 'receipt',
  PAYMENT = 'payment',
  JOURNAL = 'journal'
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: VoucherType;
  date: string;
  items: {
    account: string; // Ledger name
    description: string;
    debit: number;
    credit: number;
  }[];
  totalAmount: number;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitCost: number;
    vatAmount: number;
    total: number;
  }[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  date: string;
  paymentMethod: PaymentMethod;
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: AccountingType;
  category: string;
  amount: number;
  description: string;
  saleId?: string; // Linked sale if type is income
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string; // Receipt no, Voucher no
  attachment?: string;
}

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  todayProfit: number;
  totalInventoryValue: number;
  lowStockItems: number;
  customerCount: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  vatAmount?: number; // VAT collected on this expense (Input VAT)
  description: string;
  date: string;
  paymentMethod: string;
  reference?: string;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  companyName: string;
  trn: string;
  phone: string;
  email: string;
  address: string;
  logoBase64?: string;
  website?: string;
  termsAndConditions?: string;
  footerNote?: string;
  promoPrefix?: string;
  updatedAt: string;
}

export enum RepairStatus {
  RECEIVED = 'received',
  DIAGNOSING = 'diagnosing',
  WAITING_PARTS = 'waiting_parts',
  REPAIRING = 'repairing',
  TESTING = 'testing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface Repair {
  id: string;
  jobId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceModel: string;
  imei?: string;
  issue: string;
  assignedTechnician?: string;
  estimatedCost: number;
  advancePayment: number;
  balanceDue: number;
  status: RepairStatus;
  receivedDate: string;
  expectedDate?: string;
  completedDate?: string;
  deliveredDate?: string;
  notes?: string;
  partsUsed?: {
    name: string;
    cost: number;
    price: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export enum PromoType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface PromoVoucher {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  minPurchase: number;
  expiryDate: string;
  isActive: boolean;
  usageCount?: number;
  usageLimit?: number;
  createdAt: string;
}
