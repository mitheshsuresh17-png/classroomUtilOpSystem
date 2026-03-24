// Base URL for the Express API server
const API_BASE_URL = 'http://localhost:5000/api';

export const fetchRooms = async () => {
    const res = await fetch(`${API_BASE_URL}/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
};

export const fetchSchedules = async () => {
    const res = await fetch(`${API_BASE_URL}/schedules`);
    if (!res.ok) throw new Error('Failed to fetch schedules');
    return res.json();
};

export const fetchCourses = async () => {
    const res = await fetch(`${API_BASE_URL}/courses`);
    if (!res.ok) throw new Error('Failed to fetch courses');
    return res.json();
};

export const fetchBatches = async () => {
    const res = await fetch(`${API_BASE_URL}/batches`);
    if (!res.ok) throw new Error('Failed to fetch batches');
    return res.json();
};

export const fetchTimeSlots = async () => {
    const res = await fetch(`${API_BASE_URL}/timeslots`);
    if (!res.ok) throw new Error('Failed to fetch time slots');
    return res.json();
};

interface SchedulePayload {
    course_id: string;
    batch_id: string;
    room_id: string;
    slot_id: string;
}

export const scheduleRoom = async (scheduleData: SchedulePayload) => {
    const res = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to schedule room');
    return data;
};

// Advanced Query Endpoints

export const fetchUtilizationReport = async () => {
    const res = await fetch(`${API_BASE_URL}/reports/utilization`);
    if (!res.ok) throw new Error('Failed to fetch utilization');
    return res.json();
};

export const fetchFreeRooms = async () => {
    const res = await fetch(`${API_BASE_URL}/reports/free-rooms`);
    if (!res.ok) throw new Error('Failed to fetch free rooms');
    return res.json();
};

export const fetchEmptySlots = async () => {
    const res = await fetch(`${API_BASE_URL}/reports/empty-slots`);
    if (!res.ok) throw new Error('Failed to fetch empty slots');
    return res.json();
};

export const evaluateRoomUsage = async () => {
    const res = await fetch(`${API_BASE_URL}/reports/cursor-evaluation`);
    if (!res.ok) throw new Error('Failed to evaluate room usage');
    return res.json();
};

// ==========================================
// Advanced Analytics Fetch Methods
// ==========================================

export const fetchDepartmentCourseLoad = async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/department-course-load`);
    if (!res.ok) throw new Error('Failed to fetch department course load');
    return res.json();
};



export const fetchUnscheduledCourses = async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/unscheduled-courses`);
    if (!res.ok) throw new Error('Failed to fetch unscheduled courses');
    return res.json();
};

export const fetchRoomSaturation = async (minSaturation: number = 0.90) => {
    const res = await fetch(`${API_BASE_URL}/analytics/room-saturation?min_saturation=${minSaturation}`);
    if (!res.ok) throw new Error('Failed to fetch room saturation');
    return res.json();
};

export const fetchInfrastructureAverages = async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/infrastructure-averages`);
    if (!res.ok) throw new Error('Failed to fetch infrastructure averages');
    return res.json();
};

export const fetchTriggerTroubleshooting = async (batchId: string = '201', roomNumber: string = 'UB102') => {
    const res = await fetch(`${API_BASE_URL}/analytics/trigger-troubleshooting?batch_id=${batchId}&room_number=${roomNumber}`);
    if (!res.ok) throw new Error('Failed to fetch trigger troubleshooting');
    return res.json();
};

export const fetchInfrastructureSorting = async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/infrastructure-sorting`);
    if (!res.ok) throw new Error('Failed to fetch infrastructure sorting');
    return res.json();
};

export const fetchTrappedCapacity = async () => {
    const res = await fetch(`${API_BASE_URL}/analytics/trapped-capacity`);
    if (!res.ok) throw new Error('Failed to fetch trapped capacity');
    return res.json();
};
