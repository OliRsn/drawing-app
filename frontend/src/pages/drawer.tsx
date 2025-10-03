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
import { useClassrooms } from "@/hooks/useClassrooms";

// === Types ===
interface Student {
  id: number;
  name: string;
  weight: number;
  draw_count: number;
  probability?: number;
}

const SLOT_DURATION = 5000; // ms, matches SlotMachine
const STAGGER_DELAY = 1000; // ms

// === Component ===
export function DrawerPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { classrooms, isLoading: classroomsLoading } = useClassrooms();
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [slotMachineStudents, setSlotMachineStudents] = useState<Student[]>([]);
  
  const [drawnStudents, setDrawnStudents] = useState<(Student | null)[]>([null]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [spinId, setSpinId] = useState(0);
  const [displayMode, setDisplayMode] = useState<"probability" | "weight">("probability");
  const [sortBy, setSortBy] = useState<"name" | "value">("value");
  const [numSlotMachines, setNumSlotMachines] = useState(3);
  const [selectedToValidate, setSelectedToValidate] = useState<boolean[]>([]);
  const [isStudentSelectionOpen, setIsStudentSelectionOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // Effect to set initial classroom selection
  useEffect(() => {
    if (!selectedClassroomId && classrooms.length > 0) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  // Effect to fetch number of slot machines on mount
  useEffect(() => {
    if (isAuthenticated) {
      api.get(`/settings/numSlotMachines`).then(response => {
        const num = parseInt(response.data.value, 10);
        setNumSlotMachines(num);
        setDrawnStudents(Array(num).fill(null));
      }).catch(() => {
        setDrawnStudents(Array(3).fill(null)); // Default on error
      });
    }
  }, [isAuthenticated]);

  // Effect to fetch students when classroom changes
  useEffect(() => {
    if (selectedClassroomId && isAuthenticated) {
      setStudentsLoading(true);
      api.get(`/classrooms/${selectedClassroomId}/students/probabilities`)
        .then(response => {
          const fetchedStudents: Student[] = response.data;
          setStudents(fetchedStudents);
          setSelectedStudentIds(new Set(fetchedStudents.map(s => s.id)));
          setSlotMachineStudents(fetchedStudents);
          setDrawnStudents(Array(numSlotMachines).fill(null));
          setHasConfirmed(false);
          setSpinId(0);
        })
        .catch(error => console.error("Error fetching students:", error))
        .finally(() => setStudentsLoading(false));
    }
  }, [selectedClassroomId, numSlotMachines, isAuthenticated]);

  // Effect to manage validation checkboxes
  useEffect(() => {
    setSelectedToValidate(Array(drawnStudents.length).fill(true));
  }, [drawnStudents]);

  // Stop drawing animation timer
  useEffect(() => {
    if (isDrawing) {
      const totalAnimationTime = SLOT_DURATION + (drawnStudents.length - 1) * STAGGER_DELAY;
      const timer = setTimeout(() => setIsDrawing(false), totalAnimationTime);
      return () => clearTimeout(timer);
    }
  }, [isDrawing, drawnStudents.length]);

  async function handleDraw() {
    if (!selectedClassroomId) return;
    setHasConfirmed(false);
    setSlotMachineStudents(students.filter(s => selectedStudentIds.has(s.id)));
    try {
      const response = await api.post(`/classrooms/${selectedClassroomId}/draw`, {
        num_students: drawnStudents.length,
        student_ids: Array.from(selectedStudentIds),
      });
      setDrawnStudents(response.data);
      setSpinId(id => id + 1);
      setIsDrawing(true);
    } catch (error) {
      console.error("Error during draw:", error);
    }
  }

  async function handleConfirmDraw() {
    if (!drawnStudents.length || !drawnStudents[0] || !selectedClassroomId) return;
    setIsConfirming(true);
    const student_ids = drawnStudents.filter((_, index) => selectedToValidate[index]).map(s => s!.id);
    if (student_ids.length === 0) {
      setIsConfirming(false);
      return;
    }
    try {
      await api.post(`/classrooms/${selectedClassroomId}/confirm_draw`, { student_ids });
      setHasConfirmed(true);
      const response = await api.get(`/classrooms/${selectedClassroomId}/students/probabilities`);
      setStudents(response.data);
      setHistoryRefreshTrigger(Date.now());
    } catch (error) {
      console.error("Error confirming draw:", error);
    } finally {
      setIsConfirming(false);
    }
  }

  const addSlotMachine = () => setDrawnStudents(prev => [...prev, null]);
  const removeSlotMachine = () => {
    if (drawnStudents.length > 1) setDrawnStudents(prev => prev.slice(0, -1));
  };

  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const valueA = displayMode === "probability" ? a.probability || 0 : a.weight;
      const valueB = displayMode === "probability" ? b.probability || 0 : b.weight;
      return valueB - valueA;
    });
    if (displayMode === "probability") {
      const maxProb = Math.max(...sorted.map(s => s.probability || 0));
      return sorted.map(student => ({ ...student, scaledValue: maxProb > 0 ? ((student.probability || 0) / maxProb) * 75 : 0 }));
    }
    const maxWeight = Math.max(...sorted.map(s => s.weight), 0);
    return sorted.map(student => ({ ...student, scaledValue: maxWeight > 0 ? (student.weight / maxWeight) * 100 : 0 }));
  }, [students, sortBy, displayMode]);

  if (authLoading || classroomsLoading) {
    return <DefaultLayout><div className="flex justify-center items-center h-full"><Spinner size="lg" /></div></DefaultLayout>;
  }

  if (!isAuthenticated) {
    return <DefaultLayout><div className="flex justify-center items-center h-full"><Card><CardBody><p>Please log in to use the application.</p></CardBody></Card></div></DefaultLayout>;
  }

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center"><h1 className={title()}>Tirage au sort</h1></div>
        <div className="mb-6">
          <Select
            label="Sélectionner une classe"
            selectedKeys={selectedClassroomId ? [selectedClassroomId.toString()] : []}
            onSelectionChange={(keys) => setSelectedClassroomId(Number(Array.from(keys)[0]))}
          >
            {classrooms.map(c => <SelectItem key={c.id}>{c.name}</SelectItem>)}
          </Select>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center cursor-pointer" onClick={() => setIsStudentSelectionOpen(!isStudentSelectionOpen)}>
            <h2 className="text-xl font-semibold">Sélection des élèves</h2>
            {isStudentSelectionOpen ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </CardHeader>
          {isStudentSelectionOpen && (
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                  <Button
                    key={student.id}
                    variant="flat"
                    color={selectedStudentIds.has(student.id) ? "secondary" : "danger"}
                    onPress={() => {
                      const newIds = new Set(selectedStudentIds);
                      if (newIds.has(student.id)) newIds.delete(student.id); else newIds.add(student.id);
                      setSelectedStudentIds(newIds);
                    }}
                  >{student.name}</Button>
                ))}
              </div>
            </CardBody>
          )}
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tirage</h2>
            <div className="flex items-center gap-4">
              <ButtonGroup>
                <Button color="primary" onPress={addSlotMachine} disabled={isDrawing}><PlusIcon className="w-4 h-4" /></Button>
                <Button color="danger" onPress={removeSlotMachine} disabled={isDrawing || drawnStudents.length <= 1}><MinusIcon className="w-4 h-4" /></Button>
              </ButtonGroup>
              <Button color="primary" onPress={handleDraw} disabled={isDrawing}>Lancer le tirage</Button>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <AnimatePresence>
              {drawnStudents.map((student, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-4">
                    <SlotMachine students={slotMachineStudents} winner={student} animationDelay={index * STAGGER_DELAY} spinId={spinId} reelId={index} />
                    <Switch color="secondary" isSelected={selectedToValidate[index] ?? true} onValueChange={isSelected => {
                      const newSelected = [...selectedToValidate];
                      newSelected[index] = isSelected;
                      setSelectedToValidate(newSelected);
                    }} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex justify-between items-center gap-4 mt-4">
              <div className="flex-1" />
              <div className="flex-1 flex justify-center">{isDrawing && <Spinner size="lg" />}</div>
              <div className="flex-1 flex justify-end">
                {!isDrawing && drawnStudents[0] && (
                  <Button color={hasConfirmed ? "default" : "secondary"} variant={hasConfirmed ? "flat" : "solid"} onPress={handleConfirmDraw} disabled={isConfirming || hasConfirmed}>
                    {isConfirming ? <Spinner color="white" size="sm" /> : hasConfirmed ? <><CheckIcon className="w-4 h-4 mr-2" />Validé</> : "Valider le tirage"}
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{displayMode === "probability" ? "Probabilités de tirage" : "Poids des étudiants"}</h2>
            <div className="flex items-center gap-4">
              <ButtonGroup>
                <Button variant={sortBy === "value" ? "solid" : "light"} onPress={() => setSortBy("value")}>Trier par valeur</Button>
                <Button variant={sortBy === "name" ? "solid" : "light"} onPress={() => setSortBy("name")}>Trier par nom</Button>
              </ButtonGroup>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-slate-500" />
                <Switch isSelected={displayMode === "weight"} onValueChange={isSelected => setDisplayMode(isSelected ? "weight" : "probability")} />
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-4 gap-4">
              {studentsLoading ? <Spinner /> : sortedStudents.map(student => {
                const isProb = displayMode === "probability";
                const value = isProb ? student.probability || 0 : student.weight;
                const displayValue = isProb ? `${(value * 100).toFixed(1)}%` : `${(student.scaledValue || 0).toFixed(0)}%`;
                return <StudentCard key={student.id} name={student.name} value={student.scaledValue || 0} displayValue={displayValue} />;
              })}
            </div>
          </CardBody>
        </Card>

        {selectedClassroomId && <DrawingHistory classroomId={selectedClassroomId} refreshTrigger={historyRefreshTrigger} />}
      </section>
    </DefaultLayout>
  );
}
