import { Select, SelectItem } from "@heroui/select";
import { useState, useMemo, useEffect } from "react";
import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, MinusIcon, ChartBarIcon, AdjustmentsHorizontalIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { Switch } from "@heroui/switch";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { SlotMachine } from "@/components/SlotMachine";

import { DrawingHistory } from "@/components/DrawingHistory";
import { StudentCard } from "@/components/StudentCard";

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

// === Component ===
export function DrawerPage() {
  const { isAuthenticated, loading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [slotMachineStudents, setSlotMachineStudents] = useState<Student[]>([]);
  
  const [drawnStudents, setDrawnStudents] = useState<(Student | null)[]>([null]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [spinId, setSpinId] = useState(0);
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
    if (isAuthenticated) {
      const fetchInitialData = async () => {
        try {
          // Fetch classrooms
          const classroomsResponse = await api.get(`/classrooms/`);
          const sortedClassrooms = classroomsResponse.data.sort((a: Classroom, b: Classroom) => a.name.localeCompare(b.name));
          setClassrooms(sortedClassrooms);
          if (sortedClassrooms.length > 0) {
            setSelectedClassroom(sortedClassrooms[0]);
          }

          // Fetch number of slot machines
          try {
            const numSlotMachinesResponse = await api.get(`/settings/numSlotMachines`);
            const num = parseInt(numSlotMachinesResponse.data.value, 10);
            setNumSlotMachines(num);
            setDrawnStudents(Array(num).fill(null));
          } catch (error) {
            // Setting not found, use default
            setDrawnStudents(Array(3).fill(null));
          }

        } catch (error) {
          console.error("Error fetching initial data:", error);
        }
      };

      fetchInitialData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedClassroom && isAuthenticated) {
      const fetchStudents = async () => {
        try {
          const response = await api.get(
            `/classrooms/${selectedClassroom.id}/students/probabilities`
          );
          const fetchedStudents: Student[] = response.data;
          setStudents(fetchedStudents);
          setSelectedStudentIds(new Set(fetchedStudents.map(s => s.id)));
          setSlotMachineStudents(fetchedStudents);
          setDrawnStudents(Array(numSlotMachines).fill(null));
          setHasConfirmed(false);
          setSpinId(0); // Reset spin animation trigger
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };

      fetchStudents();
    }
  }, [selectedClassroom, numSlotMachines, isAuthenticated]);



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
      const response = await api.post(
        `/classrooms/${selectedClassroom.id}/draw`,
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
    if (!drawnStudents.length || !drawnStudents[0] || !selectedClassroom) return;

    setIsConfirming(true);
    const student_ids = drawnStudents
      .filter((_, index) => selectedToValidate[index])
      .map((s) => s!.id);

    if (student_ids.length === 0) {
      setIsConfirming(false);
      return;
    }

    try {
      await api.post(`/classrooms/${selectedClassroom.id}/confirm_draw`, { student_ids });
      setHasConfirmed(true);

      // Refetch students to update probabilities
      if (selectedClassroom) {
        const response = await api.get(
          `/classrooms/${selectedClassroom.id}/students/probabilities`
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

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" />
        </div>
      </DefaultLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full">
          <Card>
            <CardBody>
              <p>Please log in to use the application.</p>
            </CardBody>
          </Card>
        </div>
      </DefaultLayout>
    );
  }

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
              const key = Array.from(keys)[0] as string;
              const classroom = classrooms.find((c) => c.id === parseInt(key));
              setSelectedClassroom(classroom || null);
            }}
          >
            {classrooms.map((classroom) => (
              <SelectItem key={classroom.id}>
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
            <div className="flex items-center gap-4">
              <ButtonGroup>
                <Button
                  color="primary"
                  onPress={addSlotMachine}
                  disabled={isDrawing}
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
                <Button
                  color="danger"
                  onPress={removeSlotMachine}
                  disabled={isDrawing || drawnStudents.length <= 1}
                >
                  <MinusIcon className="w-4 h-4" />
                </Button>
              </ButtonGroup>
              <Button color="primary" onPress={handleDraw} disabled={isDrawing}>
                Lancer le tirage
              </Button>
            </div>
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
                {isDrawing && (
                  <Spinner size="lg" />
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