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

export const useClassrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchClassrooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/classrooms/`);
      const sortedClassrooms = response.data.sort((a: Classroom, b: Classroom) => a.name.localeCompare(b.name));
      setClassrooms(sortedClassrooms);
    } catch (err) {
      setError(err);
      console.error("Error fetching classrooms:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return { classrooms, isLoading, error, refetch: fetchClassrooms };
};