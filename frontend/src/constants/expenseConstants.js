export const EXPENSE_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' }
];

export const EXPENSE_ROUTES = {
  EXPENSE_MANAGEMENT: '/expense-management',
  EXPENSE_LIST: '/expenses',
  EXPENSE_FORM: '/expense-form'
};

export const EXPENSE_LABELS = {
  TITLE: 'Expense Management',
  LIST_TITLE: 'Expenses',
  FORM_TITLE: 'Add Expense',
  FILTER_LABEL: 'Filter by category:',
  NO_EXPENSES: 'No expenses found.',
  NO_CATEGORY_EXPENSES: 'No expenses found in {category} category.',
  CONFIRM_DELETE: 'Are you sure you want to delete this expense?',
  DELETE_FAILED: 'Failed to delete expense:',
  LOADING: 'Loading expenses...'
};