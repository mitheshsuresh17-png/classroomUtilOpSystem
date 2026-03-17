export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      department: {
        Row: {
          dept_id: string
          dept_name: string
          created_at: string | null
        }
        Insert: {
          dept_id?: string
          dept_name: string
          created_at?: string | null
        }
        Update: {
          dept_id?: string
          dept_name?: string
          created_at?: string | null
        }
      }
      course: {
        Row: {
          course_id: string
          course_name: string
          course_code: string
          dept_id: string
          created_at: string | null
        }
        Insert: {
          course_id?: string
          course_name: string
          course_code: string
          dept_id: string
          created_at?: string | null
        }
        Update: {
          course_id?: string
          course_name?: string
          course_code?: string
          dept_id?: string
          created_at?: string | null
        }
      }
      batch: {
        Row: {
          batch_id: string
          year_of_study: number
          section: string
          student_count: number
          dept_id: string
          created_at: string | null
        }
        Insert: {
          batch_id?: string
          year_of_study: number
          section: string
          student_count: number
          dept_id: string
          created_at?: string | null
        }
        Update: {
          batch_id?: string
          year_of_study?: number
          section?: string
          student_count?: number
          dept_id?: string
          created_at?: string | null
        }
      }
      room: {
        Row: {
          room_id: string
          room_number: string
          room_type: 'Classroom' | 'Lab' | 'Lecture Hall'
          capacity: number
          created_at: string | null
        }
        Insert: {
          room_id?: string
          room_number: string
          room_type: 'Classroom' | 'Lab' | 'Lecture Hall'
          capacity: number
          created_at?: string | null
        }
        Update: {
          room_id?: string
          room_number?: string
          room_type?: 'Classroom' | 'Lab' | 'Lecture Hall'
          capacity?: number
          created_at?: string | null
        }
      }
      time_slot: {
        Row: {
          slot_id: string
          day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
          start_time: string
          end_time: string
          created_at: string | null
        }
        Insert: {
          slot_id?: string
          day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
          start_time: string
          end_time: string
          created_at?: string | null
        }
        Update: {
          slot_id?: string
          day?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
          start_time?: string
          end_time?: string
          created_at?: string | null
        }
      }
      course_schedule: {
        Row: {
          schedule_id: string
          course_id: string
          batch_id: string
          room_id: string
          slot_id: string
          created_at: string | null
        }
        Insert: {
          schedule_id?: string
          course_id: string
          batch_id: string
          room_id: string
          slot_id: string
          created_at?: string | null
        }
        Update: {
          schedule_id?: string
          course_id?: string
          batch_id?: string
          room_id?: string
          slot_id?: string
          created_at?: string | null
        }
      }
    }
    Views: {
      room_utilization_summary: {
        Row: {
          room_id: string | null
          room_number: string | null
          room_type: string | null
          capacity: number | null
          total_allocations: number | null
          utilization_percentage: number | null
        }
      }
      conflict_detection_view: {
        Row: {
          room_id: string | null
          room_number: string | null
          slot_id: string | null
          day: string | null
          start_time: string | null
          end_time: string | null
          conflict_count: number | null
          conflicting_courses: string | null
        }
      }
      free_rooms_view: {
        Row: {
          room_id: string | null
          room_number: string | null
          room_type: string | null
          capacity: number | null
        }
      }
      detailed_schedule_view: {
        Row: {
          schedule_id: string | null
          course_code: string | null
          course_name: string | null
          dept_name: string | null
          year_of_study: number | null
          section: string | null
          student_count: number | null
          room_number: string | null
          room_type: string | null
          capacity: number | null
          day: string | null
          start_time: string | null
          end_time: string | null
        }
      }
      time_slot_usage_view: {
        Row: {
          slot_id: string | null
          day: string | null
          start_time: string | null
          end_time: string | null
          times_used: number | null
          usage_category: string | null
        }
      }
    }
    Functions: {
      calculate_room_utilization: {
        Args: {
          p_room_id: string
        }
        Returns: number
      }
      get_free_rooms_for_slot: {
        Args: {
          p_slot_id: string
        }
        Returns: Array<{
          room_id: string
          room_number: string
          room_type: string
          capacity: number
        }>
      }
      get_room_capacity_match: {
        Args: {
          p_required_capacity: number
        }
        Returns: Array<{
          room_id: string
          room_number: string
          room_type: string
          capacity: number
          excess_capacity: number
        }>
      }
      check_scheduling_conflict: {
        Args: {
          p_room_id: string
          p_slot_id: string
        }
        Returns: boolean
      }
      allocate_room_with_conflict_check: {
        Args: {
          p_course_id: string
          p_batch_id: string
          p_room_id: string
          p_slot_id: string
        }
        Returns: string
      }
    }
  }
}
