import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Classroom, Student } from '@/types';

export const useClassroom = (classroomId: number | null, groupId: number | null = null) => {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchClassroomData = useCallback(async () => {
    if (!classroomId) {
      setClassroom(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const classroomPromise = api.get(`/classrooms/${classroomId}`);
      const studentsPromise = api.get(`/classrooms/${classroomId}/students`, {
        params: groupId ? { group_id: groupId } : {},
      });

      const [classroomResponse, studentsResponse] = await Promise.all([
        classroomPromise,
        studentsPromise,
      ]);

      const classroomData: Classroom = classroomResponse.data;
      const studentsData: Student[] = studentsResponse.data;

      // Replace students in classroom data with the potentially filtered list
      classroomData.students = studentsData;

      setClassroom(classroomData);

    } catch (err) {
      setError(err);
      console.error(`Error fetching classroom data for classroom ${classroomId}:`, err);
      setClassroom(null);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, groupId]);

  useEffect(() => {
    fetchClassroomData();
  }, [fetchClassroomData]);

  return { classroom, setClassroom, isLoading, error, refetch: fetchClassroomData };
};