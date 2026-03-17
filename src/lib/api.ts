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

export const scheduleRoom = async (scheduleData) => {
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

export const evaluateRoomUsage = async () => {
    const res = await fetch(`${API_BASE_URL}/reports/cursor-evaluation`);
    if (!res.ok) throw new Error('Failed to evaluate room usage');
    return res.json();
};
