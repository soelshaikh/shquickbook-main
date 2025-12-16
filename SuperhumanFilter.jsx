import React, { useState, useEffect, useRef } from 'react';

// Filter state machine
const FILTER_STATES = {
  FIELD: 'field',
  OPERATOR: 'operator', 
  VALUE: 'value',
  COMPLETE: 'complete'
};

// Field definitions
const FIELDS = [
  { key: 'type', label: 'Type', icon: '📋', operators: ['is', 'is not', 'is one of'], 
    values: ['Invoice', 'Bill', 'Payment', 'Deposit', 'Journal Entry'], allowCustom: false },
  { key: 'status', label: 'Status', icon: '⭐', operators: ['is', 'is not', 'is one of'],
    values: ['Paid', 'Unpaid', 'Overdue', 'Draft', 'Pending', 'Void'], allowCustom: false },
  { key: 'customer', label: 'Customer', icon: '👤', operators: ['is', 'is not', 'contains'],
    values: ['Adobe Inc.', 'Google LLC', 'Microsoft Corp', 'Apple Inc.', 'Amazon.com', 'Meta Platforms'], allowCustom: true },
  { key: 'vendor', label: 'Vendor', icon: '🏢', operators: ['is', 'is not', 'contains'],
    values: ['Adobe Inc.', 'Google LLC', 'Microsoft Corp', 'Apple Inc.', 'Amazon.com'], allowCustom: true },
  { key: 'amount', label: 'Amount', icon: '💰', operators: ['is', 'is greater than', 'is less than', 'is between'],
    values: [], allowCustom: true },
  { key: 'date', label: 'Date', icon: '📅', operators: ['is', 'is after', 'is before', 'is between'],
    values: ['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'This year', 'Last 30 days', 'Last 90 days'], allowCustom: true },
  { key: 'account', label: 'Account', icon: '🏦', operators: ['is', 'is one of'],
    values: ['4000 - Sales Revenue', '4100 - Consulting Revenue', '1200 - Accounts Receivable', '2000 - Accounts Payable'], allowCustom: false },
  { key: 'memo', label: 'Memo', icon: '📝', operators: ['contains', 'does not contain', 'is empty'],
    values: [], allowCustom: true },
  { key: 'syncStatus', label: 'Sync Status', icon: '🔄', operators: ['is'],
    values: ['Synced', 'Pending Sync', 'Sync Error'], allowCustom: false },
];

// Saved filters (like Superhuman's bundles)
const SAVED_FILTERS = [
  { id: 1, name: 'Unpaid Invoices', icon: '📄', filters: [
    { field: 'type', operator: 'is', value: 'Invoice' },
    { field: 'status', operator: 'is', value: 'Unpaid' }
  ]},
  { id: 2, name: 'This Month', icon: '📅', filters: [
    { field: 'date', operator: 'is', value: 'This month' }
  ]},
  { id: 3, name: 'Large Transactions', icon: '💰', filters: [
    { field: 'amount', operator: 'is greater than', value: '5000' }
  ]},
  { id: 4, name: 'Adobe - All', icon: '🏢', filters: [
    { field: 'customer', operator: 'is', value: 'Adobe Inc.' }
  ]},
  { id: 5, name: 'Overdue', icon: '⚠️', filters: [
    { field: 'status', operator: 'is', value: 'Overdue' }
  ]},
  { id: 6, name: 'Needs Sync', icon: '🔄', filters: [
    { field: 'syncStatus', operator: 'is', value: 'Pending Sync' }
  ]},
];

export default function SuperhumanFilter() {
  const [filters, setFilters] = useState([]);
  const [input, setInput] = useState('');
  const [currentState, setCurrentState] = useState(FILTER_STATES.FIELD);
  const [tempFilter, setTempFilter] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);
  const inputRef = useRef(null);

  // Generate suggestions based on state
  useEffect(() => {
    if (!input && !showSuggestions) return;

    const query = input.toLowerCase();
    let newSuggestions = [];

    switch (currentState) {
      case FILTER_STATES.FIELD:
        newSuggestions = FIELDS.filter(field => 
          field.label.toLowerCase().includes(query) ||
          field.key.toLowerCase().includes(query)
        ).map(field => ({
          type: 'field',
          value: field,
          display: field.label,
          icon: field.icon,
          subtitle: `Filter by ${field.label.toLowerCase()}`
        }));
        break;

      case FILTER_STATES.OPERATOR:
        const field = FIELDS.find(f => f.key === tempFilter.field);
        if (field) {
          newSuggestions = field.operators
            .filter(op => op.toLowerCase().includes(query))
            .map(op => ({
              type: 'operator',
              value: op,
              display: op,
              icon: '⚡',
              subtitle: field.label
            }));
        }
        break;

      case FILTER_STATES.VALUE:
        const currentField = FIELDS.find(f => f.key === tempFilter.field);
        if (currentField) {
          // For fields with predefined values
          if (currentField.values.length > 0) {
            newSuggestions = currentField.values
              .filter(val => val.toLowerCase().includes(query))
              .map(val => ({
                type: 'value',
                value: val,
                display: val,
                icon: '✓',
                subtitle: `${currentField.label} ${tempFilter.operator} ${val}`
              }));
          }
          
          // For fields that allow custom input - show custom value first if user is typing
          if (currentField.allowCustom && input) {
            let displayValue = input;
            let subtitle = `Use "${input}" (Press Enter)`;
            
            // Format based on field type
            if (currentField.key === 'amount') {
              const numValue = input.replace(/[^0-9.]/g, '');
              if (numValue) {
                displayValue = `$${parseFloat(numValue).toLocaleString()}`;
                subtitle = `Use $${parseFloat(numValue).toLocaleString()} (Press Enter)`;
              }
            } else if (currentField.key === 'date') {
              // Validate date format
              if (/^\d{4}-\d{2}-\d{2}$/.test(input) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
                displayValue = input;
                subtitle = `Use date: ${input} (Press Enter)`;
              } else {
                displayValue = input;
                subtitle = `Format: YYYY-MM-DD or MM/DD/YYYY`;
              }
            }
            
            newSuggestions.unshift({
              type: 'value',
              value: input,
              display: displayValue,
              icon: '⌨️',
              subtitle: subtitle,
              isCustom: true
            });
          }
          
          // Amount suggestions
          if (currentField.key === 'amount' && !input) {
            newSuggestions.push(
              { type: 'value', value: '100', display: '$100', icon: '💵', subtitle: 'or type custom amount' },
              { type: 'value', value: '500', display: '$500', icon: '💵', subtitle: 'or type custom amount' },
              { type: 'value', value: '1000', display: '$1,000', icon: '💵', subtitle: 'or type custom amount' },
              { type: 'value', value: '5000', display: '$5,000', icon: '💵', subtitle: 'or type custom amount' },
              { type: 'value', value: '10000', display: '$10,000', icon: '💵', subtitle: 'or type custom amount' },
            );
          }
          
          // Date format hints
          if (currentField.key === 'date' && !input) {
            newSuggestions.push(
              { type: 'value', value: '2024-02-15', display: '2024-02-15', icon: '📅', subtitle: 'Example: YYYY-MM-DD format' },
              { type: 'value', value: '02/15/2024', display: '02/15/2024', icon: '📅', subtitle: 'Example: MM/DD/YYYY format' },
            );
          }
        }
        break;
    }

    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [input, currentState, tempFilter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Global shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (filters.length > 0 && currentState === FILTER_STATES.FIELD) {
          executeSearch();
        }
        return;
      }

      if (!showSuggestions) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setShowSuggestions(true);
          inputRef.current?.focus();
        } else if (e.key === 'f' && document.activeElement !== inputRef.current) {
          e.preventDefault();
          setShowSuggestions(true);
          inputRef.current?.focus();
        } else if (e.key === 'Backspace' && document.activeElement === inputRef.current && !input && filters.length > 0) {
          // Delete last filter when backspace on empty input
          e.preventDefault();
          setFilters(filters.slice(0, -1));
          setIsExecuted(false);
        }
        return;
      }

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions.length > 0 && suggestions[selectedIndex]) {
            selectSuggestion(suggestions[selectedIndex]);
          } else if (currentState === FILTER_STATES.VALUE && input.trim()) {
            // No suggestions but user has typed custom value
            handleValueSubmit();
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (currentState === FILTER_STATES.FIELD && filters.length > 0) {
            setShowSuggestions(false);
            setInput('');
          } else {
            resetFilter();
          }
          break;
        case 'Backspace':
          if (!input) {
            e.preventDefault();
            if (currentState !== FILTER_STATES.FIELD) {
              // Step back in filter creation
              stepBack();
            } else if (filters.length > 0) {
              // Delete last filter
              setFilters(filters.slice(0, -1));
              setIsExecuted(false);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex, input, currentState, filters]);

  const selectSuggestion = (suggestion) => {
    switch (suggestion.type) {
      case 'field':
        setTempFilter({ field: suggestion.value.key, fieldLabel: suggestion.value.label });
        setCurrentState(FILTER_STATES.OPERATOR);
        setInput('');
        break;
      
      case 'operator':
        setTempFilter(prev => ({ ...prev, operator: suggestion.value }));
        setCurrentState(FILTER_STATES.VALUE);
        setInput('');
        break;
      
      case 'value':
        completeFilter(suggestion.value, suggestion.display);
        break;
    }
  };

  const completeFilter = (value, displayValue) => {
    const newFilter = {
      ...tempFilter,
      value: value,
      displayValue: displayValue || value
    };
    setFilters([...filters, newFilter]);
    setIsExecuted(false); // Mark as not executed since we added a new filter
    resetFilter();
  };

  const executeSearch = () => {
    setIsExecuted(true);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleValueSubmit = () => {
    if (currentState === FILTER_STATES.VALUE && input.trim()) {
      // User typed custom value and pressed Enter
      completeFilter(input.trim(), input.trim());
    }
  };

  const resetFilter = () => {
    setTempFilter({});
    setCurrentState(FILTER_STATES.FIELD);
    setInput('');
    setSelectedIndex(0);
  };

  const stepBack = () => {
    switch (currentState) {
      case FILTER_STATES.OPERATOR:
        setCurrentState(FILTER_STATES.FIELD);
        setTempFilter({});
        break;
      case FILTER_STATES.VALUE:
        setCurrentState(FILTER_STATES.OPERATOR);
        setTempFilter(prev => ({ field: prev.field, fieldLabel: prev.fieldLabel }));
        break;
    }
    setInput('');
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFilters([]);
    setIsExecuted(false);
    resetFilter();
  };

  const applySavedFilter = (savedFilter) => {
    setFilters(savedFilter.filters);
    setShowSavedFilters(false);
    setShowSuggestions(false);
    setIsExecuted(false);
  };

  const getFilterColor = (fieldKey) => {
    const colors = {
      type: 'bg-blue-100 text-blue-700 border-blue-200',
      status: 'bg-green-100 text-green-700 border-green-200',
      customer: 'bg-purple-100 text-purple-700 border-purple-200',
      vendor: 'bg-purple-100 text-purple-700 border-purple-200',
      amount: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      date: 'bg-amber-100 text-amber-700 border-amber-200',
      account: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      memo: 'bg-gray-100 text-gray-700 border-gray-200',
      syncStatus: 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[fieldKey] || colors.type;
  };

  const resultCount = Math.max(1, Math.floor(1000 / (filters.length + 1)));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', background: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#1a1a1a' }}>Your Ledger</div>
          <div style={{ padding: '0.375rem 0.75rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.875rem' }}>
            Acme Corp
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowSavedFilters(!showSavedFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <span>⭐</span>
            <span>Saved</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: '#f3f4f6', borderRadius: '999px', fontSize: '0.75rem', color: '#6b7280' }}>
            <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
            <span>Synced</span>
          </div>
        </div>
      </div>

      {/* Filter Input Bar */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#ffffff', border: '2px solid #e5e7eb', borderRadius: '8px', minHeight: '48px', flexWrap: 'wrap' }}>
            {/* Existing Filters */}
            {filters.map((filter, index) => (
              <div key={index} className={getFilterColor(filter.field)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500, border: '1px solid' }}>
                <span style={{ opacity: 0.7 }}>{filter.fieldLabel}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ opacity: 0.7 }}>{filter.operator}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ fontWeight: 600 }}>{filter.displayValue || filter.value}</span>
                <button
                  onClick={() => removeFilter(index)}
                  style={{ marginLeft: '0.25rem', padding: '0', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '1rem', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Current Building Filter */}
            {tempFilter.field && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.875rem', border: '1px dashed #d1d5db' }}>
                <span style={{ fontWeight: 500 }}>{tempFilter.fieldLabel}</span>
                {tempFilter.operator && (
                  <>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span style={{ opacity: 0.7 }}>{tempFilter.operator}</span>
                  </>
                )}
              </div>
            )}

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={
                currentState === FILTER_STATES.FIELD ? 'Type to filter... (Press F or ⌘K)' :
                currentState === FILTER_STATES.OPERATOR ? 'Choose operator...' :
                currentState === FILTER_STATES.VALUE 
                  ? (tempFilter.field === 'amount' ? 'Type amount (e.g., 1250) or choose preset...' 
                     : tempFilter.field === 'date' ? 'Type date (YYYY-MM-DD or MM/DD/YYYY) or choose preset...'
                     : tempFilter.field === 'memo' ? 'Type text to search...'
                     : tempFilter.field === 'customer' || tempFilter.field === 'vendor' ? 'Type name or choose from list...'
                     : 'Choose value or type custom...') 
                  : ''
              }
              style={{ 
                flex: 1,
                minWidth: '200px',
                border: 'none',
                outline: 'none',
                fontSize: '0.875rem',
                background: 'transparent',
                padding: '0.25rem'
              }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              {filters.length > 0 && !isExecuted && (
                <button
                  onClick={executeSearch}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    background: '#10b981', 
                    color: '#ffffff',
                    border: 'none', 
                    borderRadius: '6px', 
                    fontSize: '0.8125rem', 
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <span>Search</span>
                  <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>⌘↵</span>
                </button>
              )}
              {filters.length > 0 && isExecuted && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: '#16a34a',
                  fontWeight: 500
                }}>
                  <span>✓</span>
                  <span>Applied</span>
                </div>
              )}
              {filters.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{ padding: '0.375rem 0.75rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.8125rem', cursor: 'pointer', color: '#6b7280' }}
                >
                  Clear all
                </button>
              )}
              <div style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', fontSize: '0.6875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                ⌘K
              </div>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>
                  {currentState === FILTER_STATES.FIELD && 'Filter by'}
                  {currentState === FILTER_STATES.OPERATOR && 'Choose operator'}
                  {currentState === FILTER_STATES.VALUE && 'Select value'}
                </span>
                {currentState === FILTER_STATES.VALUE && tempFilter.field && FIELDS.find(f => f.key === tempFilter.field)?.allowCustom && (
                  <span style={{ color: '#10b981', textTransform: 'none' }}>
                    {tempFilter.field === 'date' && 'Type date format: YYYY-MM-DD or MM/DD/YYYY'}
                    {tempFilter.field === 'amount' && 'Type custom amount + Enter'}
                    {tempFilter.field === 'memo' && 'Type text + Enter'}
                    {(tempFilter.field === 'customer' || tempFilter.field === 'vendor') && 'Type custom name + Enter'}
                  </span>
                )}
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    background: selectedIndex === index ? (suggestion.isCustom ? '#f0fdf4' : '#f9fafb') : 'transparent',
                    borderLeft: selectedIndex === index ? `3px solid ${suggestion.isCustom ? '#10b981' : '#10b981'}` : '3px solid transparent',
                    transition: 'all 50ms'
                  }}
                >
                  <div style={{ fontSize: '1.25rem' }}>{suggestion.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: suggestion.isCustom ? 600 : 500, color: suggestion.isCustom ? '#10b981' : '#1a1a1a' }}>{suggestion.display}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>{suggestion.subtitle}</div>
                  </div>
                  {selectedIndex === index && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>↵</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Saved Filters Dropdown */}
          {showSavedFilters && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50 }}>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Saved Filters
              </div>
              {SAVED_FILTERS.map((saved) => (
                <div
                  key={saved.id}
                  onClick={() => applySavedFilter(saved)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    transition: 'background 50ms'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: '1.25rem' }}>{saved.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{saved.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                      {saved.filters.length} filter{saved.filters.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', fontWeight: 700, color: '#10b981', fontFamily: 'monospace', lineHeight: 1 }}>
            {resultCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '1.25rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {filters.length === 0 ? 'Total Transactions' : 'Matching Transactions'}
          </div>
        </div>

        {filters.length === 0 && (
          <div style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Press <kbd style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8125rem' }}>F</kbd> or <kbd style={{ padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8125rem' }}>⌘K</kbd> to start filtering
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {SAVED_FILTERS.slice(0, 4).map(saved => (
                <button
                  key={saved.id}
                  onClick={() => applySavedFilter(saved)}
                  style={{ padding: '0.5rem 1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '999px', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>{saved.icon}</span>
                  <span>{saved.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        {filters.length > 0 && (
          <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.75rem', color: '#6b7280' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {!isExecuted && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <kbd style={{ padding: '0.125rem 0.375rem', background: '#dcfce7', border: '1px solid #86efac', color: '#16a34a', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.6875rem', fontWeight: 600 }}>⌘Enter</kbd>
                    <span style={{ fontWeight: 500, color: '#16a34a' }}>Execute Search</span>
                  </div>
                  <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }}></div>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <kbd style={{ padding: '0.125rem 0.375rem', background: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.6875rem' }}>Backspace</kbd>
                <span>Delete filter</span>
              </div>
              <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <kbd style={{ padding: '0.125rem 0.375rem', background: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.6875rem' }}>F</kbd>
                <span>Add filter</span>
              </div>
              <div style={{ width: '1px', height: '12px', background: '#e5e7eb' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <kbd style={{ padding: '0.125rem 0.375rem', background: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.6875rem' }}>Esc</kbd>
                <span>Cancel</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
