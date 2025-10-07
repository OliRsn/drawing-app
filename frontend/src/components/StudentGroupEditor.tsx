import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Button } from '@heroui/button';
import { Student, Group } from '@/types';
import api from '@/lib/api';
import React from 'react';

interface StudentGroupEditorProps {
  student: Student;
  allGroups: Group[];
  onUpdate: () => void;
}

export function StudentGroupEditor({ student, allGroups, onUpdate }: StudentGroupEditorProps) {
  const studentGroupIds = new Set(student.groups.map(g => g.id));

  const handleSelectionChange = async (groupId: number) => {
    const isCurrentlyMember = studentGroupIds.has(groupId);
    try {
      if (isCurrentlyMember) {
        await api.delete(`/groups/${groupId}/students/${student.id}`);
      } else {
        await api.post(`/groups/${groupId}/students/${student.id}`);
      }
      onUpdate();
    } catch (error) {
      console.error(`Error updating student's group membership:`, error);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="bordered" size="sm">
          {student.groups.length > 0 ? student.groups.map(g => g.name).join(', ') : 'Aucun groupe'}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Multiple selection"
        variant="flat"
        closeOnSelect={false}
        selectionMode="multiple"
        selectedKeys={Array.from(studentGroupIds).map(String)}
        onAction={(key: React.Key) => handleSelectionChange(Number(key))}
      >
        {allGroups.map(g => (
          <DropdownItem key={g.id}>{g.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}