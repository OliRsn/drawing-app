import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Student {
  id: number;
  name: string;
  weight: number;
  draw_count: number;
}

interface Classroom {
  id: number;
  name: string;
  students: Student[];
}

export const useClassroom = (classroomId: number | null) => {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchClassroom = useCallback(async () => {
    if (!classroomId) {
      setClassroom(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/classrooms/${classroomId}`);
      setClassroom(response.data);
    } catch (err) {
      setError(err);
      console.error(`Error fetching classroom ${classroomId}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchClassroom();
  }, [fetchClassroom]);

  return { classroom, setClassroom, isLoading, error, refetch: fetchClassroom };
};