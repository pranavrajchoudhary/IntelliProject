import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

const SearchableSelect = ({
  options = [],
  selectedValues = [],
  onSelectionChange,
  placeholder = "Search and select...",
  isMultiple = false,
  displayKey = "name",
  valueKey = "_id",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option[displayKey].toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle selection
  const handleSelect = (option) => {
    if (isMultiple) {
      const isSelected = selectedValues.some(val => val === option[valueKey]);
      let newSelection;
      
      if (isSelected) {
        newSelection = selectedValues.filter(val => val !== option[valueKey]);
      } else {
        newSelection = [...selectedValues, option[valueKey]];
      }
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(option[valueKey]);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Remove selected item (for multiple selection)
  const removeSelected = (valueToRemove, e) => {
    e.stopPropagation();
    const newSelection = selectedValues.filter(val => val !== valueToRemove);
    onSelectionChange(newSelection);
  };

  // Get selected option names for display
  const getSelectedDisplay = () => {
    if (!isMultiple) {
      const selected = options.find(opt => opt[valueKey] === selectedValues);
      return selected ? selected[displayKey] : '';
    }
    return selectedValues.map(val => {
      const option = options.find(opt => opt[valueKey] === val);
      return option ? option[displayKey] : '';
    }).filter(Boolean);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedDisplay = getSelectedDisplay();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between min-h-[42px]"
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {isMultiple && selectedValues.length > 0 ? (
            selectedDisplay.map((name, index) => (
              <span
                key={selectedValues[index]}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md"
              >
                {name}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-purple-900"
                  onClick={(e) => removeSelected(selectedValues[index], e)}
                />
              </span>
            ))
          ) : (
            <span className={selectedDisplay ? 'text-gray-900' : 'text-gray-500'}>
              {selectedDisplay || placeholder}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = isMultiple 
                  ? selectedValues.includes(option[valueKey])
                  : selectedValues === option[valueKey];
                
                return (
                  <button
                    key={option[valueKey]}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center justify-between ${
                      isSelected ? 'bg-purple-100 text-purple-900' : 'text-gray-900'
                    }`}
                  >
                    <span>{option[displayKey]}</span>
                    {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                {searchTerm ? 'No matches found' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
