import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { endpoints, Internship } from '@/lib/api';
import { Search, Download, Filter, Building2, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export function Internships() {
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const { data: internships = [], isLoading, error } = useQuery({
    queryKey: ['internships-enhanced'],
    queryFn: async () => {
      const response = await endpoints.internshipsEnhanced();
      const rawInternships = response.data.internships || [];
      
      // Transform the data to ensure requirements are arrays
      return rawInternships.map((internship: any) => ({
        ...internship,
        position: internship.title || internship.position || 'Unknown Position',
        tier: internship.company_tier || internship.tier || 'Unknown Tier',
        requirements: typeof internship.skills_required === 'string'
          ? internship.skills_required.split(',').map((r: string) => r.trim()).filter(Boolean)
          : Array.isArray(internship.skills_required) ? internship.skills_required
          : typeof internship.requirements === 'string'
          ? internship.requirements.split(',').map((r: string) => r.trim()).filter(Boolean)
          : Array.isArray(internship.requirements) ? internship.requirements : []
      })) as Internship[];
    },
  });

  const filteredInternships = internships.filter((internship) => {
    const matchesSearch = internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !companyFilter || internship.company === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const companies = [...new Set(internships.map(i => i.company))];

  const handleExportCSV = () => {
    if (filteredInternships.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Company', 'Position', 'Location', 'Capacity', 'Tier', 'Requirements'].join(','),
      ...filteredInternships.map(internship => [
        internship.company,
        internship.position,
        internship.location,
        internship.capacity,
        internship.tier || 'Unknown',
        Array.isArray(internship.requirements) ? internship.requirements.join('; ') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'internships.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Internships data exported successfully');
  };

  const getTierColor = (tier: string | undefined | null) => {
    if (!tier) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    
    switch (tier.toLowerCase()) {
      case 'tier 1': 
      case 'tier 1 - tech giants':
      case 'tier 1 - indian it':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'tier 2':
      case 'tier 2 - startups': 
      case 'tier 2 - finance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'tier 3':
      case 'tier 3 - consulting':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Internships</h3>
              <p className="text-sm">Unable to fetch internships data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Internships</h2>
          <p className="text-muted-foreground">
            Browse available internship opportunities ({filteredInternships.length} positions)
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Companies</option>
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internships Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInternships.map((internship) => (
            <Card key={internship.id} className="card-elevated">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{internship.company}</h3>
                    <p className="text-sm text-muted-foreground">{internship.position}</p>
                  </div>
                  <Badge className={getTierColor(internship.tier)}>
                    {internship.tier || 'Unknown Tier'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{internship.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{internship.capacity} positions available</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(internship.requirements) && internship.requirements.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {Array.isArray(internship.requirements) && internship.requirements.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{internship.requirements.length - 3} more
                      </Badge>
                    )}
                    {!Array.isArray(internship.requirements) && (
                      <Badge variant="outline" className="text-xs">
                        No requirements listed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredInternships.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Internships Found</h3>
              <p className="text-sm">Try adjusting your search criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}