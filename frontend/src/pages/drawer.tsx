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
import { SlotMachine, SLOT_MACHINE_SPIN_DURATION } from "@/components/SlotMachine";
import { DrawingHistory } from "@/components/DrawingHistory";
import { StudentCard } from "@/components/StudentCard";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useClassroom } from "@/hooks/useClassroom";
import { Student } from "@/types";

const SLOT_DURATION = SLOT_MACHINE_SPIN_DURATION; // ms, matches SlotMachine
const STAGGER_DELAY = 1000; // ms

const areSetsEqual = (a: Set<number>, b: Set<number>) => {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
};

export default function DrawerPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { classrooms, isLoading: classroomsLoading } = useClassrooms();
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const { classroom, isLoading: studentsLoading, refetch: refetchClassroom } = useClassroom(selectedClassroomId, selectedGroupId);

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
  const [isCustomSelection, setIsCustomSelection] = useState(false);
  const hasActiveResults = useMemo(() => drawnStudents.some(student => student !== null), [drawnStudents]);

  useEffect(() => {
    if (!selectedClassroomId && classrooms.length > 0) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [classrooms, selectedClassroomId]);

  useEffect(() => {
    setSelectedGroupId(null);
  }, [selectedClassroomId]);

  useEffect(() => {
    setIsCustomSelection(false);
    setSelectedStudentIds(new Set());
  }, [selectedClassroomId, selectedGroupId]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get(`/settings/numSlotMachines`).then(response => {
        const num = parseInt(response.data.value, 10);
        setNumSlotMachines(num);
        setDrawnStudents(Array(num).fill(null));
      }).catch(() => {
        setDrawnStudents(Array(3).fill(null));
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!classroom?.students) {
      if (selectedStudentIds.size > 0) {
        setSelectedStudentIds(new Set());
      }
      if (isCustomSelection) {
        setIsCustomSelection(false);
      }
      return;
    }

    const availableIds = new Set(classroom.students.map(student => student.id));

    if (!isCustomSelection) {
      if (!areSetsEqual(selectedStudentIds, availableIds)) {
        setSelectedStudentIds(new Set(availableIds));
      }
      return;
    }

    if (selectedStudentIds.size === 0) {
      return;
    }

    const filteredIds = new Set<number>();
    selectedStudentIds.forEach(id => {
      if (availableIds.has(id)) {
        filteredIds.add(id);
      }
    });

    if (filteredIds.size === 0) {
      setSelectedStudentIds(new Set(availableIds));
      setIsCustomSelection(false);
      return;
    }

    const shouldBeCustom = filteredIds.size !== availableIds.size;
    if (isCustomSelection !== shouldBeCustom) {
      setIsCustomSelection(shouldBeCustom);
    }

    if (!areSetsEqual(selectedStudentIds, filteredIds)) {
      setSelectedStudentIds(filteredIds);
    }
  }, [classroom?.students, selectedStudentIds, isCustomSelection]);

  useEffect(() => {
    setSelectedToValidate(Array(drawnStudents.length).fill(true));
  }, [drawnStudents]);

  useEffect(() => {
    if (!classroom?.students) {
      setSlotMachineStudents([]);
      return;
    }
    if (hasActiveResults) {
      return;
    }
    if (selectedStudentIds.size === 0) {
      setSlotMachineStudents(isCustomSelection ? [] : classroom.students);
      return;
    }
    const selectedStudents = classroom.students.filter(student => selectedStudentIds.has(student.id));
    setSlotMachineStudents(selectedStudents);
  }, [classroom?.students, selectedStudentIds, isCustomSelection, hasActiveResults]);

  useEffect(() => {
    if (isDrawing) {
      const totalAnimationTime = SLOT_DURATION + (drawnStudents.length - 1) * STAGGER_DELAY;
      const timer = setTimeout(() => setIsDrawing(false), totalAnimationTime);
      return () => clearTimeout(timer);
    }
  }, [isDrawing, drawnStudents.length]);

  useEffect(() => {
    setDrawnStudents(Array(numSlotMachines).fill(null));
    setHasConfirmed(false);
    setSpinId(0);
  }, [selectedClassroomId, selectedGroupId, numSlotMachines]);

  async function handleDraw() {
    if (!selectedClassroomId || !classroom) return;
    const eligibleStudents = classroom.students.filter((student) =>
      selectedStudentIds.has(student.id)
    );

    if (eligibleStudents.length === 0) {
      setSlotMachineStudents([]);
      setDrawnStudents(Array(numSlotMachines).fill(null));
      setIsStudentSelectionOpen(true);
      return;
    }

    setHasConfirmed(false);
    setSlotMachineStudents(eligibleStudents);
    try {
      const response = await api.post(`/classrooms/${selectedClassroomId}/draw`, {
        num_students: drawnStudents.length,
        student_ids: eligibleStudents.map((student) => student.id),
        group_id: selectedGroupId,
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
      refetchClassroom();
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
    const students = classroom?.students || [];
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
  }, [classroom?.students, sortBy, displayMode]);

  const availableStudentCount = classroom?.students?.length ?? 0;

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Sélectionner une classe"
            selectedKeys={selectedClassroomId ? [selectedClassroomId.toString()] : []}
            onSelectionChange={(keys: any) => setSelectedClassroomId(Number(Array.from(keys)[0]))}
          >
            {classrooms.map(c => <SelectItem key={c.id}>{c.name}</SelectItem>)}
          </Select>
          {classroom && classroom.groups && classroom.groups.length > 0 && (
            <Select
              label="Sélectionner un groupe"
              selectedKeys={selectedGroupId ? [selectedGroupId.toString()] : ['all']}
              onSelectionChange={(keys: any) => {
                const key = Array.from(keys)[0];
                setSelectedGroupId(key === 'all' ? null : Number(key));
              }}
              items={[{id: 'all', name: 'Tous les élèves'}, ...classroom.groups]}
            >
              {(item) => <SelectItem key={item.id}>{item.name}</SelectItem>}
            </Select>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader className="flex justify-between items-center cursor-pointer" onClick={() => setIsStudentSelectionOpen(!isStudentSelectionOpen)}>
            <h2 className="text-xl font-semibold">Sélection des élèves</h2>
            {isStudentSelectionOpen ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </CardHeader>
          {isStudentSelectionOpen && (
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {[...(classroom?.students || [])].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                  <Button
                    key={student.id}
                    variant={selectedStudentIds.has(student.id) ? "flat" : "flat"}
                    color={selectedStudentIds.has(student.id) ? "secondary" : "danger"}
                  onPress={() => {
                    const newIds = new Set(selectedStudentIds);
                    if (newIds.has(student.id)) newIds.delete(student.id); else newIds.add(student.id);
                    setSelectedStudentIds(newIds);
                    setIsCustomSelection(newIds.size !== availableStudentCount);
                  }}
                >{student.name}</Button>
              ))}
              </div>
              {selectedStudentIds.size === 0 && (
                <p className="text-danger text-sm mt-4">
                  Sélectionnez au moins un élève pour lancer le tirage.
                </p>
              )}
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
              <Button
                color="primary"
                onPress={handleDraw}
                disabled={isDrawing || selectedStudentIds.size === 0}
              >
                Lancer le tirage
              </Button>
            </div>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <AnimatePresence>
              {drawnStudents.map((student, index) => (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-4">
                    <SlotMachine students={slotMachineStudents} winner={student} animationDelay={index * STAGGER_DELAY} spinId={spinId} reelId={index} />
                    <Switch color="secondary" isSelected={selectedToValidate[index] ?? true} onValueChange={(isSelected: boolean) => {
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
                <Switch isSelected={displayMode === "weight"} onValueChange={(isSelected: boolean) => setDisplayMode(isSelected ? "weight" : "probability")} />
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {studentsLoading ? <div className="col-span-full flex justify-center"><Spinner /></div> : sortedStudents.map(student => {
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
