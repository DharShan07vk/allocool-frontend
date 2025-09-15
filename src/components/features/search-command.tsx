import { useState } from 'react';
import { Search, Users, Building2, Brain, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchCommandProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const searchItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'System overview and statistics' },
  { id: 'students', label: 'Students', icon: Users, description: 'Manage student profiles and data' },
  { id: 'internships', label: 'Internships', icon: Building2, description: 'View available internship positions' },
  { id: 'allocation', label: 'Allocation Engine', icon: Brain, description: 'Configure and run allocation algorithm' },
  { id: 'results', label: 'Results', icon: TrendingUp, description: 'View allocation results and analytics' },
];

const quickActions = [
  { label: 'Start New Allocation', action: 'allocation', badge: 'Action' },
  { label: 'Export Student Data', action: 'students', badge: 'Export' },
  { label: 'View Latest Results', action: 'results', badge: 'View' },
  { label: 'System Health Check', action: 'dashboard', badge: 'Status' },
];

export function SearchCommand({ activeTab, setActiveTab }: SearchCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Global shortcut
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="relative w-64 justify-start text-muted-foreground"
      >
        <Search className="h-4 w-4 mr-2" />
        <span>Search commands...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 max-w-md">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-sm">Quick Navigation</DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pages and actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto pb-4">
            {filteredItems.length > 0 && (
              <div className="px-4 mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Pages
                </h3>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-2 rounded-md text-left transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredActions.length > 0 && (
              <div className="px-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Quick Actions
                </h3>
                <div className="space-y-1">
                  {filteredActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(action.action)}
                      className="w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-muted transition-colors"
                    >
                      <span className="text-sm">{action.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredItems.length === 0 && filteredActions.length === 0 && searchTerm && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}