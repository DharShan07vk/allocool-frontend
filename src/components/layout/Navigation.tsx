import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Settings, 
  TrendingUp,
  Brain
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'internships', label: 'Internships', icon: Building2 },
  { id: 'allocation', label: 'Allocation', icon: Brain },
  { id: 'results', label: 'Results', icon: TrendingUp },
];

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="border-b bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 py-4 px-2 border-b-2 transition-all duration-200 whitespace-nowrap",
                  isActive 
                    ? "border-primary text-primary font-medium" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}