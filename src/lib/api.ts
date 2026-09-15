// Base URL for API calls. Routes through Vite proxy to Express backend.
const API_BASE_URL = '/api';

export function getAuthToken(): string | null {
    return localStorage.getItem('clus_token');
}

export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint.startsWith('/api') ? endpoint : `${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('clus_token');
        localStorage.removeItem('clus_user');
    }

    return res;
}

// ==========================================
// Authentication
// ==========================================

export const loginUser = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
};

// ==========================================
// Staff User Management (Coordinator only)
// ==========================================

export interface StaffUser {
    id: number;
    name: string;
    email: string;
    role: 'coordinator' | 'viewer';
    created_at: string;
}

export const fetchUsers = async (): Promise<StaffUser[]> => {
    const res = await authFetch('/users');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch staff users');
    return data;
};

export const provisionUser = async (userData: { name: string; email: string; password: string; role: 'coordinator' | 'viewer' }) => {
    const res = await authFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to provision staff user');
    return data;
};

// ==========================================
// Department Management
// ==========================================

export interface Department {
    dept_id: number;
    dept_name: string;
    total_courses?: number;
    total_batches?: number;
}

export interface DepartmentImpact {
    dept_id: number;
    courses_count: number;
    batches_count: number;
    schedules_count: number;
}

export const fetchDepartments = async (): Promise<Department[]> => {
    const res = await authFetch('/departments');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch departments');
    }
    return res.json();
};

export const createDepartment = async (data: { dept_id: number; dept_name: string }) => {
    const res = await authFetch('/departments', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create department');
    return result;
};

export const deleteDepartment = async (deptId: number) => {
    const res = await authFetch(`/departments/${deptId}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete department');
    return result;
};

export const fetchDepartmentImpact = async (deptId: number): Promise<DepartmentImpact> => {
    const res = await authFetch(`/departments/${deptId}/impact`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch department impact');
    }
    return res.json();
};

// ==========================================
// Course Management
// ==========================================

export interface Course {
    course_id: number;
    course_name: string;
    course_code: string;
    dept_id: number;
    dept_name?: string;
    scheduled_slots?: number;
}

export interface CourseImpact {
    course_id: number;
    schedules_count: number;
}

export const fetchCourses = async (): Promise<Course[]> => {
    const res = await authFetch('/courses');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch courses');
    }
    return res.json();
};

export const createCourse = async (data: { course_id: number; course_code: string; course_name: string; dept_id: number }) => {
    const res = await authFetch('/courses', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create course');
    return result;
};

export const deleteCourse = async (courseId: number) => {
    const res = await authFetch(`/courses/${courseId}`, {
        method: 'DELETE'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete course');
    return result;
};

export const fetchCourseImpact = async (courseId: number): Promise<CourseImpact> => {
    const res = await authFetch(`/courses/${courseId}/impact`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch course impact');
    }
    return res.json();
};

// ==========================================
// Cascade Impact Analysis for Rooms and Batches
// ==========================================

export const fetchRoomImpact = async (roomNumber: string): Promise<{ room_number: string; schedules_count: number }> => {
    const res = await authFetch(`/rooms/${roomNumber}/impact`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch room impact');
    }
    return res.json();
};

export const fetchBatchImpact = async (batchId: number | string): Promise<{ batch_id: number; schedules_count: number }> => {
    const res = await authFetch(`/batches/${batchId}/impact`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch batch impact');
    }
    return res.json();
};

// ==========================================
// Basic CRUD Methods
// ==========================================

export const fetchRooms = async () => {
    const res = await authFetch('/rooms');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch rooms');
    }
    return res.json();
};

export const fetchSchedules = async () => {
    const res = await authFetch('/schedules');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch schedules');
    }
    return res.json();
};

export const fetchBatches = async () => {
    const res = await authFetch('/batches');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch batches');
    }
    return res.json();
};

export const fetchTimeSlots = async () => {
    const res = await authFetch('/timeslots');
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch time slots');
    }
    return res.json();
};

interface SchedulePayload {
    course_id: string;
    batch_id: string;
    room_number: string;
    slot_id: string;
}

export const scheduleRoom = async (scheduleData: SchedulePayload) => {
    const res = await authFetch('/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to schedule room');
    return data;
};

export const deleteSchedule = async (scheduleId: string) => {
    const res = await authFetch(`/schedules/${scheduleId}`, {
        method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete schedule');
    return data;
};

export const createRoom = async (roomData: any) => {
    const res = await authFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify(roomData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create room');
    return data;
};

export const createBatch = async (batchData: any) => {
    const res = await authFetch('/batches', {
        method: 'POST',
        body: JSON.stringify(batchData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create batch');
    return data;
};

export const deleteRoom = async (roomId: string) => {
    const res = await authFetch(`/rooms/${roomId}`, {
        method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete room');
    return data;
};

export const deleteBatch = async (batchId: string) => {
    const res = await authFetch(`/batches/${batchId}`, {
        method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete batch');
    return data;
};

// ==========================================
// Advanced Query Endpoints
// ==========================================

export const fetchUtilizationReport = async () => {
    const res = await authFetch('/reports/utilization');
    if (!res.ok) throw new Error('Failed to fetch utilization');
    return res.json();
};

export const fetchFreeRooms = async () => {
    const res = await authFetch('/reports/free-rooms');
    if (!res.ok) throw new Error('Failed to fetch free rooms');
    return res.json();
};

export const fetchEmptySlots = async () => {
    const res = await authFetch('/reports/empty-slots');
    if (!res.ok) throw new Error('Failed to fetch empty slots');
    return res.json();
};

export const evaluateRoomUsage = async () => {
    const res = await authFetch('/reports/cursor-evaluation');
    if (!res.ok) throw new Error('Failed to evaluate room usage');
    return res.json();
};

// ==========================================
// Advanced Analytics Fetch Methods
// ==========================================

export const fetchDepartmentCourseLoad = async () => {
    const res = await authFetch('/analytics/department-course-load');
    if (!res.ok) throw new Error('Failed to fetch department course load');
    return res.json();
};

export const fetchUnscheduledCourses = async () => {
    const res = await authFetch('/analytics/unscheduled-courses');
    if (!res.ok) throw new Error('Failed to fetch unscheduled courses');
    return res.json();
};

export const fetchRoomSaturation = async (minSaturation: number = 0.90) => {
    const res = await authFetch(`/analytics/room-saturation?min_saturation=${minSaturation}`);
    if (!res.ok) throw new Error('Failed to fetch room saturation');
    return res.json();
};

export const fetchInfrastructureAverages = async () => {
    const res = await authFetch('/analytics/infrastructure-averages');
    if (!res.ok) throw new Error('Failed to fetch infrastructure averages');
    return res.json();
};

export const fetchTriggerTroubleshooting = async (batchId: string = '201', roomNumber: string = 'UB102') => {
    const res = await authFetch(`/analytics/trigger-troubleshooting?batch_id=${batchId}&room_number=${roomNumber}`);
    if (!res.ok) throw new Error('Failed to fetch trigger troubleshooting');
    return res.json();
};

export const fetchInfrastructureSorting = async () => {
    const res = await authFetch('/analytics/infrastructure-sorting');
    if (!res.ok) throw new Error('Failed to fetch infrastructure sorting');
    return res.json();
};

export const fetchTrappedCapacity = async () => {
    const res = await authFetch('/analytics/trapped-capacity');
    if (!res.ok) throw new Error('Failed to fetch trapped capacity');
    return res.json();
};

// ==========================================
// Advanced Analytics Extensions
// ==========================================

export const fetchUnifiedUtilization = async () => {
    const res = await authFetch('/advanced-analytics/unified-utilization');
    if (!res.ok) throw new Error('Failed to fetch unified utilization');
    return res.json();
};

export const fetchWastedCapacity = async () => {
    const res = await authFetch('/advanced-analytics/wasted-capacity');
    if (!res.ok) throw new Error('Failed to fetch wasted capacity');
    return res.json();
};

export const fetchTemporalStress = async () => {
    const res = await authFetch('/advanced-analytics/temporal-stress');
    if (!res.ok) throw new Error('Failed to fetch temporal stress index');
    return res.json();
};

export const fetchUtilizationImbalance = async () => {
    const res = await authFetch('/advanced-analytics/imbalance');
    if (!res.ok) throw new Error('Failed to fetch utilization imbalance');
    return res.json();
};

export const fetchCapacityMismatch = async () => {
    const res = await authFetch('/advanced-analytics/mismatch');
    if (!res.ok) throw new Error('Failed to fetch capacity mismatch');
    return res.json();
};

export const fetchActionableSignals = async () => {
    const res = await authFetch('/advanced-analytics/signals');
    if (!res.ok) throw new Error('Failed to fetch actionable signals');
    return res.json();
};

export const fetchEfficiencyScore = async () => {
    const res = await authFetch('/advanced-analytics/efficiency-score');
    if (!res.ok) throw new Error('Failed to fetch system efficiency score');
    return res.json();
};

