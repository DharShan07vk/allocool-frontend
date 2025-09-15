import axios from 'axios';

// API base configuration
const BASE_URL = 'http://127.0.0.1:8000/';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds global timeout
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
  allocationStart: (config: AllocationConfig) => api.post('/api/allocation/start', config, { timeout: 5000 }), // Quick start
  allocationStatus: () => api.get('/api/allocation/status', { timeout: 3000 }), // Faster status checks
  allocationLiveMatches: () => api.get('/api/allocation/live-matches', { timeout: 3000 }), // Faster live matches
  
  // Results
  allocationsLatest: () => api.get('/api/allocations/latest'),
  downloadAllocations: () => api.get('/api/download/allocations', { responseType: 'blob' }),
};

// Types
export interface DashboardStats {
  total_students: number;
  total_internships: number;
  total_capacity: number;
  placement_potential: string;
  category_distribution: Record<string, number>;
  tier_distribution: Record<string, number>;
  top_preferred_companies: Record<string, number>;
  top_skills: Record<string, number>;
  work_mode_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
}

export interface Student {
  id: string;
  name: string;
  category: string;
  gpa: number;
  location: string;
  skills: string[];
  preferences: string[];
  email?: string;
  education?: string;
  past_internships?: number;
}

export interface Internship {
  id: string;
  company: string;
  position: string;
  location: string;
  capacity: number;
  requirements: string[];
  tier?: string;
  title?: string;
  skills_required?: string;
  work_mode?: string;
  stipend?: number;
  duration_months?: number;
  company_tier?: string;
}

export interface AllocationConfig {
  rural_quota: number;
  reserved_quota: number;
  female_quota: number;
  top_k_similarity: number;
  optimization_time: number;
}

export interface AllocationStatus {
  running: boolean;
  progress: number;
  stage: string;
  message: string;
  result?: any;
  start_time?: number;
  estimated_time?: number;
  allocated_count?: number;
  total_students?: number;
  current_matches?: any;
  stage_details?: any;
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