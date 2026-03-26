export const DEPARTMENTS = [
  { value: 'operations', label: 'Operations' },
  { value: 'farm_execution', label: 'Farm Execution' },
  { value: 'farm_agronomy', label: 'Farm Agronomy' },
  { value: 'hr_admin', label: 'HR & Admin' },
  { value: 'field_sales', label: 'Field Sales' },
  { value: 'inhouse_sales', label: 'Inhouse Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'computer_engineering', label: 'Computer Engineering' },
  { value: 'research_development', label: 'R&D' },
];

export const DEPT_LABELS = Object.fromEntries(DEPARTMENTS.map(d => [d.value, d.label]));

export const CATEGORIES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'intern', label: 'Intern' },
];
