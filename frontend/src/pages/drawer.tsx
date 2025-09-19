import { Select, SelectItem } from "@heroui/select";
import { useState, useMemo, useEffect } from "react";
import { Button, ButtonGroup } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Spinner } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, ChartBarIcon, AdjustmentsHorizontalIcon, CheckIcon } from "@heroicons/react/24/solid";
import { Switch } from "@heroui/switch";
import axios from "axios";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { SlotMachine } from "@/components/SlotMachine";

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
export default function DrawerPage() {
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
          setStudents(response.data);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };

      fetchStudents();
    }
  }, [selectedClassroom]);

  useEffect(() => {
    setSlotMachineStudents(students);
  }, [students]);

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
    setSlotMachineStudents(students);
    try {
      const response = await axios.post(
        `${API_URL}/classrooms/${selectedClassroom.id}/draw`,
        {
          num_students: drawnStudents.length,
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
    const student_ids = drawnStudents.map((s) => s!.id);

    try {
      await axios.post(`${API_URL}/students/draw_count`, { student_ids });
      setHasConfirmed(true);

      // Refetch students to update probabilities
      if (selectedClassroom) {
        const response = await axios.get(
          `${API_URL}/classrooms/${selectedClassroom.id}/students/probabilities`
        );
        setStudents(response.data);
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

    if (displayMode === "weight") {
      const maxWeight = Math.max(...sorted.map(s => s.weight), 0);
      return sorted.map(student => ({ ...student, weight: (student.weight / maxWeight) * 100 }));
    }

    return sorted;
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
                  <SlotMachine
                    students={slotMachineStudents}
                    winner={student}
                    animationDelay={index * 1000}
                    spinId={spinId}
                  />
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
          <CardBody className="space-y-4">
            {sortedStudents.map((student) => {
              const value = displayMode === "probability" ? (student.probability || 0) * 100 : student.weight;
              const displayValue = displayMode === "probability" ? `${value.toFixed(1)}%` : `${student.weight.toFixed(0)}%`;

              return (
                <div key={student.id}>
                  <div className="flex justify-between mb-1">
                    <span>{student.name}</span>
                    <span className="text-sm text-slate-500">
                      {displayValue}
                    </span>
                  </div>
                  <Progress
                    value={value}
                    color="secondary"
                    className="h-2"
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>

        
      </section>
    </DefaultLayout>
  );
}