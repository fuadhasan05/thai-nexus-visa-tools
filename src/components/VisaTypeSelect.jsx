import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Centralized visa options configuration
export const VISA_OPTIONS = [
  {
    group: 'Visa Exemption',
    items: [
      { value: 'visa-exemption', label: 'Visa Exemption (30/45/60/90 days on arrival)' },
      { value: '30-day-extension', label: '30-Day Extension of Visa Exemption' }
    ]
  },
  {
    group: 'Retirement Visas',
    items: [
      { value: 'retirement-o-first-time', label: 'Non-O Retirement (First Time - 90 Days Inside Thailand)' },
      { value: 'retirement-extension', label: 'Retirement Extension (1-Year Annual Extension)' },
      { value: 'retirement-oa', label: 'Retirement Visa Non-O-A (Apply Abroad)' },
      { value: 'retirement-ox', label: 'Non-O-X Long-Stay (5-10 Year)' },
      { value: 'ltr-wealthy', label: 'LTR Visa (Wealthy Pensioner - 10 Year)' }
    ]
  },
  {
    group: 'Work Visas',
    items: [
      { value: 'business', label: 'Business Visa Non-B + Work Permit' },
      { value: 'smart-visa', label: 'SMART Visa' },
      { value: 'ltr-professional', label: 'LTR Visa (Work-From-Thailand Professional)' }
    ]
  },
  {
    group: 'Digital Nomad',
    items: [
      { value: 'dtv', label: 'Destination Thailand Visa (DTV)' }
    ]
  },
  {
    group: 'Education',
    items: [
      { value: 'education', label: 'Education Visa (Non-ED)' }
    ]
  },
  {
    group: 'Family Visas',
    items: [
      { value: 'marriage', label: 'Marriage Visa (Non-O)' },
      { value: 'dependent', label: 'Dependent Visa (Non-O)' },
      { value: 'thai-child', label: 'Thai Child Visa (Non-O)' }
    ]
  },
  {
    group: 'Tourist',
    items: [
      { value: 'tourist', label: 'Tourist Visa (TR)' },
      { value: 'medical', label: 'Medical Treatment Visa (MT)' }
    ]
  },
  {
    group: 'Investment & Premium',
    items: [
      { value: 'investment', label: 'Investment Visa (Non-IB/IM)' },
      { value: 'elite', label: 'Thailand Elite/Privilege Visa' }
    ]
  },
  {
    group: 'Other',
    items: [
      { value: 'volunteer', label: 'Volunteer Visa (Non-O)' },
      { value: 'transit', label: 'Transit Visa (TS)' }
    ]
  },
  {
    group: 'Permits & Reports',
    items: [
      { value: 're-entry', label: 'Re-Entry Permit' },
      { value: '90-day-report', label: '90-Day Report (TM.47)' }
    ]
  }
];

// Visa options WITHOUT permits & reports (for planning tools)
export const VISA_OPTIONS_PLANNING = VISA_OPTIONS.filter(group => group.group !== 'Permits & Reports');

// Flat list for simple dropdowns (no groups) - all options
export const VISA_OPTIONS_FLAT = VISA_OPTIONS.flatMap(group => group.items);

// Flat list WITHOUT permits & reports
export const VISA_OPTIONS_FLAT_PLANNING = VISA_OPTIONS_PLANNING.flatMap(group => group.items);

export default function VisaTypeSelect({ 
  value, 
  onValueChange, 
  placeholder = "Choose a visa type", 
  className = "",
  excludePermitsReports = false // New prop to exclude permits & reports
}) {
  const optionsToUse = excludePermitsReports ? VISA_OPTIONS_PLANNING : VISA_OPTIONS;
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`h-12 text-lg ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[500px] bg-white text-black border border-gray-300">
        {optionsToUse.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <div className="h-px bg-gray-200 my-2" />}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.group}
            </div>
            {group.items.map((item) => (
              <SelectItem key={item.value} value={item.value} className="pl-6">
                {item.label}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}