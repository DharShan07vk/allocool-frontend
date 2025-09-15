import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { endpoints, Student } from '@/lib/api';
import { Search, Download, Filter, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['students-enhanced'],
    queryFn: async () => {
      const response = await endpoints.studentsEnhanced();
      const rawStudents = response.data.students || [];
      
      // Transform the data to ensure skills and preferences are arrays
      return rawStudents.map((student: any) => ({
        ...student,
        skills: typeof student.skills === 'string' 
          ? student.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : Array.isArray(student.skills) ? student.skills : [],
        preferences: typeof student.preferred_companies === 'string'
          ? student.preferred_companies.split(',').map((p: string) => p.trim()).filter(Boolean)
          : Array.isArray(student.preferred_companies) ? student.preferred_companies
          : typeof student.preferences === 'string'
          ? student.preferences.split(',').map((p: string) => p.trim()).filter(Boolean)
          : Array.isArray(student.preferences) ? student.preferences : []
      })) as Student[];
    },
  });

  const filteredStudents = students.filter((student) => {
    const skillsArray = Array.isArray(student.skills) ? student.skills : [];
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skillsArray.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || student.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(students.map(s => s.category))];

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Name', 'Category', 'GPA', 'Location', 'Skills', 'Preferences'].join(','),
      ...filteredStudents.map(student => [
        student.name,
        student.category,
        student.gpa,
        student.location,
        Array.isArray(student.skills) ? student.skills.join('; ') : '',
        Array.isArray(student.preferences) ? student.preferences.join('; ') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Students data exported successfully');
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Students</h3>
              <p className="text-sm">Unable to fetch students data. Please try again.</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">
            Manage and view student data ({filteredStudents.length} students)
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
                  placeholder="Search by name or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
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
          {filteredStudents.map((student) => (
            <Card key={student.id} className="card-elevated">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{student.name}</h3>
                  <Badge variant="secondary">{student.category}</Badge>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>GPA:</span>
                    <span className="font-medium">{student.gpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="font-medium">{student.location}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(student.skills) && student.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {Array.isArray(student.skills) && student.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.skills.length - 3} more
                      </Badge>
                    )}
                    {!Array.isArray(student.skills) && (
                      <Badge variant="outline" className="text-xs">
                        No skills listed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preferences:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(student.preferences) && student.preferences.slice(0, 2).map((pref, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {pref}
                      </Badge>
                    ))}
                    {Array.isArray(student.preferences) && student.preferences.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.preferences.length - 2} more
                      </Badge>
                    )}
                    {!Array.isArray(student.preferences) && (
                      <Badge variant="outline" className="text-xs">
                        No preferences listed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-sm">Try adjusting your search criteria.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}