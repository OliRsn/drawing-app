import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/react";
import axios from "axios";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

// === Types ===
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

const API_URL = import.meta.env.VITE_API_URL;

// === Component ===
export default function AdminPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  async function fetchClassrooms() {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/classrooms/`);
      setClassrooms(response.data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateClassroom() {
    if (!newClassName) return;

    try {
      await axios.post(`${API_URL}/classrooms/`, { name: newClassName });
      setNewClassName("");
      fetchClassrooms();
    } catch (error) {
      console.error("Error creating classroom:", error);
    }
  }

  async function fetchStudents(classroomId: number) {
    try {
      const response = await axios.get(`${API_URL}/classrooms/${classroomId}`);
      setSelectedClassroom(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }

  async function handleCreateStudent() {
    if (!newStudentName || !selectedClassroom) return;

    try {
      await axios.post(`${API_URL}/classrooms/${selectedClassroom.id}/students/`, { name: newStudentName, weight: 1, draw_count: 0 });
      setNewStudentName("");
      fetchStudents(selectedClassroom.id);
    } catch (error) {
      console.error("Error creating student:", error);
    }
  }

  async function handleUpdateStudent(student: Student) {
    if (!selectedClassroom) return;

    try {
      await axios.put(`${API_URL}/students/${student.id}`, { name: student.name, weight: student.weight, draw_count: student.draw_count });
      setEditingStudent(null);
      fetchStudents(selectedClassroom.id);
    } catch (error) {
      console.error("Error updating student:", error);
    }
  }

  async function handleDeleteStudent(studentId: number) {
    if (!selectedClassroom) return;

    try {
      await axios.delete(`${API_URL}/students/${studentId}`);
      fetchStudents(selectedClassroom.id);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  }

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center">
          <h1 className={title()}>Admin Panel</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classrooms Panel */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Classes</h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-4">
                  {classrooms.map((classroom) => (
                    <div key={classroom.id} className="flex justify-between items-center">
                      <span>{classroom.name}</span>
                      <Button size="sm" variant="light" onPress={() => fetchStudents(classroom.id)}>
                        Gérer
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Nouvelle classe"
                      value={newClassName}
                      onValueChange={setNewClassName}
                    />
                    <Button onPress={handleCreateClassroom}>Créer</Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Students Panel */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Étudiants</h2>
              </CardHeader>
              <CardBody>
                {selectedClassroom ? (
                  <div className="flex flex-col gap-4">
                    {selectedClassroom.students.map((student) => (
                      <div key={student.id} className="flex justify-between items-center">
                        {editingStudent && editingStudent.id === student.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingStudent.name}
                              onValueChange={(name) => setEditingStudent({ ...editingStudent, name })}
                            />
                            <Input
                              type="number"
                              value={editingStudent.weight.toString()}
                              onValueChange={(weight) => setEditingStudent({ ...editingStudent, weight: parseInt(weight) })}
                            />
                            <Input
                              type="number"
                              value={editingStudent.draw_count.toString()}
                              onValueChange={(draw_count) => setEditingStudent({ ...editingStudent, draw_count: parseInt(draw_count) })}
                            />
                            <Button size="sm" onPress={() => handleUpdateStudent(editingStudent)}>Sauvegarder</Button>
                            <Button size="sm" variant="light" onPress={() => setEditingStudent(null)}>Annuler</Button>
                          </div>
                        ) : (
                          <>
                            <span>{student.name}</span>
                            <div className="flex items-center gap-2">
                              <span>Poids: {student.weight}</span>
                              <span>Tirages: {student.draw_count}</span>
                              <Button size="sm" variant="light" onPress={() => setEditingStudent(student)}>Modifier</Button>
                              <Button size="sm" color="danger" variant="light" onPress={() => handleDeleteStudent(student.id)}>Supprimer</Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Nouvel étudiant"
                        value={newStudentName}
                        onValueChange={setNewStudentName}
                      />
                      <Button onPress={handleCreateStudent}>Ajouter</Button>
                    </div>
                  </div>
                ) : (
                  <p>Sélectionner une classe pour gérer les étudiants.</p>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </section>
    </DefaultLayout>
  );
}
