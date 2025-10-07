import { useState } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { TrashIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';
import { Classroom } from '@/types';

interface GroupManagerProps {
  classroom: Classroom;
  onUpdate: () => void;
}

export function GroupManager({ classroom, onUpdate }: GroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      await api.post(`/classrooms/${classroom.id}/groups`, { name: newGroupName });
      setNewGroupName('');
      onUpdate();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      await api.delete(`/groups/${groupId}`);
      onUpdate();
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="text-lg font-semibold">Gérer les groupes</h3>
      </CardHeader>
      <CardBody>
        <div className="flex flex-col gap-4">
          {classroom.groups.map(group => (
            <div key={group.id} className="flex justify-between items-center">
              <span>{group.name}</span>
              <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDeleteGroup(group.id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Nouveau groupe"
              value={newGroupName}
              onValueChange={setNewGroupName}
            />
            <Button onPress={handleCreateGroup}>Créer</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}