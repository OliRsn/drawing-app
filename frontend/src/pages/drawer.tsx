import { Select, SelectItem } from "@heroui/select";
import { useState, useMemo, useEffect } from "react";
import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, ChartBarIcon, AdjustmentsHorizontalIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { Switch } from "@heroui/switch";
import axios from "axios";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { SlotMachine } from "@/components/SlotMachine";

import { DrawingHistory } from "@/components/DrawingHistory";
import { StudentCard } from "@/components/StudentCard";
import { RadioGroup, Radio } from "@heroui/radio";

// === Types ===
interface Student {
  id: number;
  name: string;
  weight: number;
  draw_count: number;
  probability?: number;
}

interface Classroom {
  id: number;
  name: string;
  students: Student[];
}



const API_URL = import.meta.env.VITE_API_URL;

// === Component ===
export function DrawerPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [slotMachineStudents, setSlotMachineStudents] = useState<Student[]>([]);
  
  const [drawnStudents, setDrawnStudents] = useState<(Student | null)[]>([null]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [spinId, setSpinId] = useState(0);
  const [numToDraw, setNumToDraw] = useState(1);
  const [displayMode, setDisplayMode] = useState<"probability" | "weight">(
    "probability"
  );
  const [sortBy, setSortBy] = useState<"name" | "value">("value");
  const [numSlotMachines, setNumSlotMachines] = useState(3);
  const [selectedToValidate, setSelectedToValidate] = useState<boolean[]>([]);
  const [isStudentSelectionOpen, setIsStudentSelectionOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  useEffect(() => {
    setSelectedToValidate(Array(drawnStudents.length).fill(true));
  }, [drawnStudents]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch classrooms
        const classroomsResponse = await axios.get(`${API_URL}/classrooms/`);
        setClassrooms(classroomsResponse.data);
        if (classroomsResponse.data.length > 0) {
          setSelectedClassroom(classroomsResponse.data[0]);
        }

        // Fetch number of slot machines
        try {
          const numSlotMachinesResponse = await axios.get(`${API_URL}/settings/numSlotMachines`);
          const num = parseInt(numSlotMachinesResponse.data.value, 10);
          setNumSlotMachines(num);
          setDrawnStudents(Array(num).fill(null));
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            // Setting not found, use default
            setDrawnStudents(Array(3).fill(null));
          }
        }

      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassroom) {
      const fetchStudents = async () => {
        try {
          const response = await axios.get(
            `${API_URL}/classrooms/${selectedClassroom.id}/students/probabilities`
          );
          const fetchedStudents: Student[] = response.data;
          setStudents(fetchedStudents);
          setSelectedStudentIds(new Set(fetchedStudents.map(s => s.id)));
          setSlotMachineStudents(fetchedStudents);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };

      fetchStudents();
    }
  }, [selectedClassroom]);



  // Stop drawing after slots finish
  useEffect(() => {
    if (isDrawing) {
      const slotDuration = 5000; // ms, matches SlotMachine
      const stagger = 1000; // ms
      const totalAnimationTime =
        slotDuration + (drawnStudents.length - 1) * stagger;
      const timer = setTimeout(() => setIsDrawing(false), totalAnimationTime);
      return () => clearTimeout(timer);
    }
  }, [isDrawing, drawnStudents.length]);

  async function handleDraw() {
    if (!selectedClassroom) return;

    setHasConfirmed(false);
    const student_ids = Array.from(selectedStudentIds);
    setSlotMachineStudents(students.filter(s => selectedStudentIds.has(s.id)));
    try {
      const response = await axios.post(
        `${API_URL}/classrooms/${selectedClassroom.id}/draw`,
        {
          num_students: drawnStudents.length,
          student_ids: student_ids,
        }
      );
      const picked = response.data;

      

      // Trigger spin
      setDrawnStudents(picked);
      setSpinId((id) => id + 1);
      setIsDrawing(true);
    } catch (error) {
      console.error("Error during draw:", error);
    }
  }

  async function handleConfirmDraw() {
    if (!drawnStudents.length || !drawnStudents[0]) return;

    setIsConfirming(true);
    const student_ids = drawnStudents
      .filter((_, index) => selectedToValidate[index])
      .map((s) => s!.id);

    if (student_ids.length === 0) {
      setIsConfirming(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/students/draw_count`, { student_ids });
      setHasConfirmed(true);

      // Refetch students to update probabilities
      if (selectedClassroom) {
        const response = await axios.get(
          `${API_URL}/classrooms/${selectedClassroom.id}/students/probabilities`
        );
        setStudents(response.data);
        setHistoryRefreshTrigger(Date.now()); // Trigger history refresh
      }
    } catch (error) {
      console.error("Error confirming draw:", error);
    } finally {
      setIsConfirming(false);
    }
  }

  const addSlotMachine = () => {
    setDrawnStudents((prev) => [...prev, null]);
  };

  const removeSlotMachine = () => {
    if (drawnStudents.length > 1) {
      setDrawnStudents((prev) => prev.slice(0, -1));
    }
  };

  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      // Sort by value (descending)
      const valueA = displayMode === "probability" ? a.probability || 0 : a.weight;
      const valueB = displayMode === "probability" ? b.probability || 0 : b.weight;
      return valueB - valueA;
    });

    if (displayMode === "probability") {
      const maxProb = Math.max(...sorted.map(s => s.probability || 0));
      return sorted.map(student => ({
        ...student,
        scaledValue: maxProb > 0 ? ((student.probability || 0) / maxProb) * 75 : 0,
      }));
    }

    const maxWeight = Math.max(...sorted.map(s => s.weight), 0);
    return sorted.map(student => ({ ...student, scaledValue: maxWeight > 0 ? (student.weight / maxWeight) * 100 : 0 }));

  }, [students, sortBy, displayMode]);

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center">
          <h1 className={title()}>Tirage au sort</h1>
        </div>

        <div className="mb-6">
          <Select
            label="Sélectionner une classe"
            selectedKeys={selectedClassroom ? [selectedClassroom.id.toString()] : []}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];
              const classroom = classrooms.find((c) => c.id === parseInt(key));
              setSelectedClassroom(classroom || null);
            }}
          >
            {classrooms.map((classroom) => (
              <SelectItem key={classroom.id} value={classroom.id}>
                {classroom.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Student Selection */}
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center cursor-pointer" onClick={() => setIsStudentSelectionOpen(!isStudentSelectionOpen)}>
            <h2 className="text-xl font-semibold">Sélection des élèves</h2>
            {isStudentSelectionOpen ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </CardHeader>
          {isStudentSelectionOpen && (
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {[...students]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((student) => (
                    <Button
                      key={student.id}
                      variant={selectedStudentIds.has(student.id) ? "flat" : "flat"}
                      color={selectedStudentIds.has(student.id) ? "secondary" : "danger"}
                      onPress={() => {
                        const newSelectedStudentIds = new Set(selectedStudentIds);
                        if (newSelectedStudentIds.has(student.id)) {
                          newSelectedStudentIds.delete(student.id);
                        } else {
                          newSelectedStudentIds.add(student.id);
                        }
                        setSelectedStudentIds(newSelectedStudentIds);
                      }}
                    >
                      {student.name}
                    </Button>
                  ))}
              </div>
            </CardBody>
          )}
        </Card>

        {/* Draw panel */}
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tirage</h2>
            <Button color="primary" onPress={handleDraw} disabled={isDrawing}>
              Lancer le tirage
            </Button>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <AnimatePresence>
              {drawnStudents.map((student, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-4">
                    <SlotMachine
                      students={slotMachineStudents}
                      winner={student}
                      animationDelay={index * 1000}
                      spinId={spinId}
                    />
                    <Switch
                      color="secondary"
                      isSelected={selectedToValidate[index] ?? true}
                      onValueChange={(isSelected) => {
                        const newSelected = [...selectedToValidate];
                        newSelected[index] = isSelected;
                        setSelectedToValidate(newSelected);
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex justify-between items-center gap-4 mt-4">
              <div className="flex-1" />
              <div className="flex-1 flex justify-center">
                {isDrawing ? (
                  <Spinner size="lg" />
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      color="primary"
                      onPress={addSlotMachine}
                      disabled={isDrawing}
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Ajouter un étudiant
                    </Button>
                    <Button
                      variant="light"
                      color="danger"
                      onPress={removeSlotMachine}
                      disabled={isDrawing || drawnStudents.length <= 1}
                    >
                      Enlever un étudiant
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 flex justify-end">
                {!isDrawing && drawnStudents[0] && (
                  <Button
                    color={hasConfirmed ? "default" : "secondary"}
                    variant={hasConfirmed ? "flat" : "solid"}
                    onPress={handleConfirmDraw}
                    disabled={isConfirming || hasConfirmed}
                  >
                    {isConfirming ? (
                      <Spinner color="white" size="sm" />
                    ) : hasConfirmed ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Validé
                      </>
                    ) : (
                      "Valider le tirage"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Probabilities */}
        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {displayMode === "probability"
                ? "Probabilités de tirage"
                : "Poids des étudiants"}
            </h2>
            <div className="flex items-center gap-4">
              <ButtonGroup>
                <Button
                  variant={sortBy === "value" ? "solid" : "light"}
                  onPress={() => setSortBy("value")}
                >
                  Trier par valeur
                </Button>
                <Button
                  variant={sortBy === "name" ? "solid" : "light"}
                  onPress={() => setSortBy("name")}
                >
                  Trier par nom
                </Button>
              </ButtonGroup>

              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-slate-500" />
                <Switch
                  isSelected={displayMode === "weight"}
                  onValueChange={(isSelected) =>
                    setDisplayMode(isSelected ? "weight" : "probability")
                  }
                />
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-4 gap-4">
              {sortedStudents.map((student) => {
                const isProb = displayMode === "probability";
                const value = isProb ? student.probability || 0 : student.weight;
                const displayValue = isProb ? `${(value * 100).toFixed(1)}%` : `${student.scaledValue.toFixed(0)}%`;

                return (
                  <StudentCard
                    key={student.id}
                    name={student.name}
                    value={student.scaledValue}
                    displayValue={displayValue}
                  />
                );
              })}
            </div>
          </CardBody>
        </Card>

        {selectedClassroom && <DrawingHistory classroomId={selectedClassroom.id} refreshTrigger={historyRefreshTrigger} />}

      </section>
    </DefaultLayout>
  );
}