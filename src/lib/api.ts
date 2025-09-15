import axios from 'axios';

// API base configuration
const BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Health check
  health: () => api.get('/health'),
  
  // Dashboard
  dashboardStats: () => api.get('/api/dashboard/stats'),
  
  // Students
  studentsEnhanced: () => api.get('/api/students/enhanced'),
  
  // Internships
  internshipsEnhanced: () => api.get('/api/internships/enhanced'),
  
  // Allocation
  allocationStart: (config: AllocationConfig) => api.post('/api/allocation/start', config),
  allocationStatus: () => api.get('/api/allocation/status'),
  allocationLiveMatches: () => api.get('/api/allocation/live-matches'),
  
  // Results
  allocationsLatest: () => api.get('/api/allocations/latest'),
  downloadAllocations: () => api.get('/api/download/allocations', { responseType: 'blob' }),
};

// Types
export interface DashboardStats {
  total_students: number;
  total_internships: number;
  total_capacity: number;
  placement_potential: number;
  category_distribution: Record<string, number>;
  skill_demand: Record<string, number>;
  company_tiers: Record<string, number>;
}

export interface Student {
  id: string;
  name: string;
  category: string;
  gpa: number;
  location: string;
  skills: string[];
  preferences: string[];
}

export interface Internship {
  id: string;
  company: string;
  position: string;
  location: string;
  capacity: number;
  requirements: string[];
  tier: string;
}

export interface AllocationConfig {
  rural_quota: number;
  reserved_quota: number;
  female_quota: number;
  top_k_similarity: number;
  optimization_time: number;
}

export interface AllocationStatus {
  status: 'idle' | 'loading' | 'similarity' | 'prediction' | 'optimization' | 'completed' | 'error';
  progress: number;
  stage: string;
  message: string;
  estimated_time_remaining?: number;
}

export interface AllocationMatch {
  student_id: string;
  student_name: string;
  company: string;
  position: string;
  similarity_score: number;
  success_probability: number;
}

export interface AllocationResult {
  matches: AllocationMatch[];
  summary: {
    placement_rate: number;
    fairness_index: number;
    total_allocated: number;
    avg_similarity: number;
    avg_success_probability: number;
  };
}