import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface SearchDropdownProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  onSelect: (item: T) => void;
  placeholder?: string;
  renderItem: (item: T) => React.ReactNode;
}

export function SearchDropdown<T>({
  items,
  searchFields,
  onSelect,
  placeholder = 'Buscar...',
  renderItem,
}: SearchDropdownProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredResults = useMemo(() => {
    if (!searchTerm) return [];
    
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      })
    );
  }, [items, searchTerm, searchFields]);

  const handleSelect = (item: T) => {
    onSelect(item);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="pl-10"
        />
      </div>
      
      {isOpen && filteredResults.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
          {filteredResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full p-3 hover:bg-accent text-left border-b last:border-b-0 transition-colors"
            >
              {renderItem(result)}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
