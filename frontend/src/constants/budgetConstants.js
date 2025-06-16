import { BUDGET_TYPES, BUDGET_STATUS } from '../models/BudgetModels';

export const BUDGET_ROUTES = {
  BUDGET_MANAGEMENT: '/budget-management',
  FEE_REVENUE: '/budget/fee-revenue',
  CONTRIBUTION_REVENUE: '/budget/contribution-revenue',
  BUDGET_REPORTS: '/budget/reports',
  CONTRIBUTOR_STATUS: '/budget/contributors'
};

export const BUDGET_LABELS = {
  // Main navigation
  TITLE: 'Budget Management',
  FEE_REVENUE_TITLE: 'Fee Revenue',
  CONTRIBUTION_REVENUE_TITLE: 'Contribution Revenue', 
  EXPENSE_TITLE: 'Expenses',
  REPORTS_TITLE: 'Budget Reports',
  
  // Fee revenue
  ADD_FEE_REVENUE: 'Add Fee Revenue',
  FEE_TYPE_LABEL: 'Fee Type:',
  STUDENT_LABEL: 'Student:',
  
  // Contribution revenue
  ADD_CONTRIBUTION: 'Add Contribution',
  CONTRIBUTOR_LABEL: 'Contributor:',
  EXPECTED_AMOUNT_LABEL: 'Expected Amount:',
  PAYMENT_STATUS: 'Payment Status',
  
  // Common labels
  AMOUNT_LABEL: 'Amount:',
  DATE_LABEL: 'Date:',
  DESCRIPTION_LABEL: 'Description:',
  NOTES_LABEL: 'Notes:',
  STATUS_LABEL: 'Status:',
  
  // Actions
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  CANCEL: 'Cancel',
  SAVE: 'Save',
  
  // Status messages
  LOADING: 'Loading...',
  NO_ENTRIES: 'No entries found.',
  NO_CATEGORY_ENTRIES: 'No entries found in {category} category.',
  CREATION_SUCCESS: 'Entry created successfully',
  UPDATE_SUCCESS: 'Entry updated successfully',
  DELETE_SUCCESS: 'Entry deleted successfully',
  
  // Confirmations
  CONFIRM_DELETE: 'Are you sure you want to delete this entry?',
  
  // Error messages
  CREATION_FAILED: 'Failed to create entry:',
  UPDATE_FAILED: 'Failed to update entry:',
  DELETE_FAILED: 'Failed to delete entry:',
  FETCH_FAILED: 'Failed to fetch entries:',
  
  // Budget summary
  TOTAL_REVENUE: 'Total Revenue',
  FEE_REVENUE: 'Fee Revenue',
  CONTRIBUTION_REVENUE: 'Contribution Revenue',
  TOTAL_EXPENSES: 'Total Expenses',
  NET_BUDGET: 'Net Budget',
  REVENUE_BREAKDOWN: 'Revenue Breakdown',
  
  // Contributor status
  TOTAL_PAID: 'Total Paid',
  REMAINING_AMOUNT: 'Remaining Amount',
  OVERPAID_AMOUNT: 'Overpaid Amount',
  PAYMENT_COMPLETE: 'Payment Complete',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_OVERDUE: 'Payment Overdue',
  
  // Filters
  FILTER_BY_TYPE: 'Filter by type:',
  FILTER_BY_STATUS: 'Filter by status:',
  FILTER_BY_DATE: 'Filter by date range:',
  ALL_TYPES: 'All Types',
  ALL_STATUSES: 'All Statuses'
};

export const FEE_TYPES = [
  { value: 'late', label: 'Late Fee' },
  { value: 'absent', label: 'Absent Fee' },
  { value: 'penalty', label: 'Penalty Fee' },
  { value: 'makeup', label: 'Makeup Class Fee' },
  { value: 'other', label: 'Other Fee' }
];

export const BUDGET_TYPE_OPTIONS = [
  { value: 'all', label: BUDGET_LABELS.ALL_TYPES },
  { value: BUDGET_TYPES.FEE_REVENUE, label: BUDGET_LABELS.FEE_REVENUE },
  { value: BUDGET_TYPES.CONTRIBUTION_REVENUE, label: BUDGET_LABELS.CONTRIBUTION_REVENUE },
  { value: BUDGET_TYPES.EXPENSE, label: BUDGET_LABELS.EXPENSE_TITLE }
];

export const BUDGET_STATUS_OPTIONS = [
  { value: 'all', label: BUDGET_LABELS.ALL_STATUSES },
  { value: BUDGET_STATUS.ACTIVE, label: 'Active' },
  { value: BUDGET_STATUS.PENDING, label: 'Pending' },
  { value: BUDGET_STATUS.COMPLETED, label: 'Completed' },
  { value: BUDGET_STATUS.INACTIVE, label: 'Inactive' }
];

export const DEFAULT_CONTRIBUTION_AMOUNT = 70;

export const BUDGET_COLORS = {
  FEE_REVENUE: '#10B981', // Green
  CONTRIBUTION_REVENUE: '#3B82F6', // Blue  
  EXPENSE: '#EF4444', // Red
  NET_POSITIVE: '#10B981', // Green
  NET_NEGATIVE: '#EF4444', // Red
  PENDING: '#F59E0B', // Amber
  COMPLETED: '#10B981', // Green
  OVERDUE: '#EF4444' // Red
};

// Currency formatting helper
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

// Percentage formatting helper
export const formatPercentage = (value) => {
  return `${(value || 0).toFixed(1)}%`;
};

// Date range presets
export const DATE_RANGE_PRESETS = [
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'This Quarter', value: 'thisQuarter' },
  { label: 'Last Quarter', value: 'lastQuarter' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Last Year', value: 'lastYear' },
  { label: 'Custom Range', value: 'custom' }
];