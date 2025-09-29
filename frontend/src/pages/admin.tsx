import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import api from "@/lib/api";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import GlobalSettings from "@/components/GlobalSettings";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useClassroom } from "@/hooks/useClassroom";

// === Types ===
interface Student {
  id: number;
  name: string;
  weight: number;
  draw_count: number;
}

// === Component ===
export default function AdminPage() {
  const { classrooms, isLoading: isLoadingClassrooms, refetch: fetchClassrooms } = useClassrooms();
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  const { classroom: selectedClassroom, refetch: fetchStudents } = useClassroom(selectedClassroomId);
  
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  async function handleCreateClassroom() {
    if (!newClassName) return;
    try {
      await api.post(`/classrooms/`, { name: newClassName });
      setNewClassName("");
      fetchClassrooms();
    } catch (error) {
      console.error("Error creating classroom:", error);
    }
  }

  async function handleDeleteClassroom(classroomId: number) {
    try {
      await api.delete(`/classrooms/${classroomId}`);
      fetchClassrooms();
      if (selectedClassroomId === classroomId) {
        setSelectedClassroomId(null);
      }
    } catch (error) {
      console.error("Error deleting classroom:", error);
    }
  }

  async function handleCreateStudent() {
    if (!newStudentName || !selectedClassroom) return;
    try {
      await api.post(`/classrooms/${selectedClassroom.id}/students/`, { name: newStudentName, weight: 1, draw_count: 0 });
      setNewStudentName("");
      fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
    }
  }

  async function handleUpdateStudent(student: Student) {
    if (!selectedClassroom) return;
    try {
      await api.put(`/students/${student.id}`, { name: student.name, weight: student.weight, draw_count: student.draw_count });
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  }

  async function handleDeleteStudent(studentId: number) {
    if (!selectedClassroom) return;
    try {
      await api.delete(`/students/${studentId}`);
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  }

  async function handleResetWeights() {
    if (!selectedClassroom) return;
    try {
      await api.post(`/classrooms/${selectedClassroom.id}/reset-weights`);
      fetchStudents();
    } catch (error) {
      console.error("Error resetting weights:", error);
    }
  }

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center">
          <h1 className={title()}>Admin Panel</h1>
        </div>

        {isLoadingClassrooms ? (
          <div className="flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-6">
              <GlobalSettings />
              <Card>
                <CardHeader><h2 className="text-xl font-semibold">Classes</h2></CardHeader>
                <CardBody>
                  <div className="flex flex-col gap-4">
                    {classrooms.map((classroom) => (
                      <div key={classroom.id} className="flex justify-between items-center">
                        <span>{classroom.name}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="light" onPress={() => setSelectedClassroomId(classroom.id)}>
                            Gérer
                          </Button>
                          <Button size="sm" color="danger" variant="light" onPress={() => handleDeleteClassroom(classroom.id)}>
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <Input placeholder="Nouvelle classe" value={newClassName} onValueChange={setNewClassName} />
                      <Button onPress={handleCreateClassroom}>Créer</Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader><h2 className="text-xl font-semibold">Étudiants</h2></CardHeader>
              <CardBody>
                {selectedClassroom ? (
                  <div className="flex flex-col gap-4">
                    <Table aria-label="Table des étudiants">
                      <TableHeader>
                        <TableColumn>Nom</TableColumn>
                        <TableColumn>Poids</TableColumn>
                        <TableColumn>Tirages</TableColumn>
                        <TableColumn>Actions</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {selectedClassroom.students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              {editingStudent && editingStudent.id === student.id ? (
                                <Input value={editingStudent.name} onValueChange={(name) => setEditingStudent({ ...editingStudent, name })} />
                              ) : ( student.name )}
                            </TableCell>
                            <TableCell>
                              {editingStudent && editingStudent.id === student.id ? (
                                <Input
                                  type="number" min="0" max="1" step="0.01"
                                  value={editingStudent.weight.toString()}
                                  onValueChange={(weight) => {
                                    let newWeight = parseFloat(weight);
                                    if (isNaN(newWeight)) newWeight = 0;
                                    if (newWeight > 1) newWeight = 1;
                                    else if (newWeight < 0) newWeight = 0;
                                    setEditingStudent({ ...editingStudent, weight: newWeight });
                                  }}
                                />
                              ) : ( student.weight )}
                            </TableCell>
                            <TableCell>
                              {editingStudent && editingStudent.id === student.id ? (
                                <Input type="number" value={editingStudent.draw_count.toString()} onValueChange={(draw_count) => setEditingStudent({ ...editingStudent, draw_count: parseInt(draw_count) })} />
                              ) : ( student.draw_count )}
                            </TableCell>
                            <TableCell>
                              {editingStudent && editingStudent.id === student.id ? (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onPress={() => handleUpdateStudent(editingStudent)}>Sauvegarder</Button>
                                  <Button size="sm" variant="light" onPress={() => setEditingStudent(null)}>Annuler</Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="light" onPress={() => setEditingStudent(student)}>Modifier</Button>
                                  <Button size="sm" color="danger" variant="light" onPress={() => handleDeleteStudent(student.id)}>Supprimer</Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                            <Input placeholder="Nouvel étudiant" value={newStudentName} onValueChange={setNewStudentName} />
                            <Button onPress={handleCreateStudent}>Ajouter</Button>
                        </div>
                        <Button color="warning" variant="light" onPress={() => setIsResetModalOpen(true)}>Réinitialiser</Button>
                    </div>
                  </div>
                ) : ( <p>Sélectionner une classe pour gérer les étudiants.</p> )}
              </CardBody>
            </Card>
          </div>
        )}
      </section>

      <Modal isOpen={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Confirmation de réinitialisation</ModalHeader>
              <ModalBody><p>Êtes-vous sûr de vouloir réinitialiser les poids et le nombre de tirages de tous les étudiants de cette classe? Cette action est irréversible.</p></ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>Annuler</Button>
                <Button color="danger" onPress={() => { handleResetWeights(); onClose(); }}>Confirmer</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}