import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  performSearch: (term: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize search term from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearchTerm = params.get('search') || '';
    if (urlSearchTerm && urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [location.search]);

  const performSearch = useCallback((term: string) => {
    if (term.trim()) {
      // Update search term
      setSearchTerm(term);
      
      // Navigate to defects page with search parameter
      navigate(`/defects?search=${encodeURIComponent(term.trim())}`);
    }
  }, [navigate]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    // If currently on defects page, remove search parameter
    if (location.pathname === '/defects') {
      navigate('/defects');
    }
  }, [location.pathname, navigate]);

  const value = {
    searchTerm,
    setSearchTerm,
    performSearch,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}; 