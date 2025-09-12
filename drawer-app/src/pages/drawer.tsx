import { useState, useMemo, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon } from "@heroicons/react/24/solid";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { SlotMachine } from "@/components/SlotMachine";

// === Types ===
interface Student {
  id: number;
  name: string;
  pastDraws: number;
  lastGrade: number;
}

interface HistoryEntry {
  time: string;
  picked: Student[];
}

// === Fake Data ===
const initialStudents: Student[] = [
  { id: 1, name: "Léa", pastDraws: 0, lastGrade: 12 },
  { id: 2, name: "Hugo", pastDraws: 2, lastGrade: 8 },
  { id: 3, name: "Maya", pastDraws: 1, lastGrade: 14 },
  { id: 4, name: "Lucas", pastDraws: 3, lastGrade: 9 },
  { id: 5, name: "Sara", pastDraws: 0, lastGrade: 16 },
  { id: 6, name: "Noah", pastDraws: 0, lastGrade: 6 },
];

// === Probability computation ===
function computeWeights(
  students: Student[],
  { pastDrawPenalty = 0.6, boostFactor = 1.5, maxGrade = 20 }
): number[] {
  const raw = students.map((s) => {
    const penalty = Math.pow(pastDrawPenalty, s.pastDraws || 0);
    const grade = typeof s.lastGrade === "number" ? s.lastGrade : maxGrade;
    const gradeBoost = 1 + ((maxGrade - grade) / maxGrade) * boostFactor;
    return Math.max(0.0001, penalty * gradeBoost);
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => r / sum);
}

// === Component ===
export default function DrawerPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [drawnStudents, setDrawnStudents] = useState<Student[]>([null]);
  const [isDrawing, setIsDrawing] = useState(false);

  const probs = useMemo(
    () =>
      computeWeights(students, {
        pastDrawPenalty: 0.6,
        boostFactor: 1.5,
        maxGrade: 20,
      }),
    [students]
  );

  const sortedStudentsWithProbs = useMemo(() => {
    return students
      .map((student, index) => ({
        student,
        prob: probs[index],
      }))
      .sort((a, b) => b.prob - a.prob);
  }, [students, probs]);

  useEffect(() => {
    if (isDrawing) {
      const totalAnimationTime = 8000 + (drawnStudents.length - 1) * 1000;
      const timer = setTimeout(() => setIsDrawing(false), totalAnimationTime);
      return () => clearTimeout(timer);
    }
  }, [isDrawing, drawnStudents.length]);

  function handleDraw() {
    setIsDrawing(true);
    const picked: Student[] = [];
    const available = [...students];
    const weights = [...probs];

    for (let i = 0; i < drawnStudents.length && available.length > 0; i++) {
      const r = Math.random();
      let cum = 0;
      let idx = 0;
      for (let j = 0; j < available.length; j++) {
        cum += weights[j];
        if (r <= cum) {
          idx = j;
          break;
        }
      }
      picked.push(available[idx]);
      available.splice(idx, 1);
      weights.splice(idx, 1);
    }

    // Increment pastDraws for drawn students
    setStudents((prev) =>
      prev.map((s) =>
        picked.find((p) => p.id === s.id)
          ? { ...s, pastDraws: s.pastDraws + 1 }
          : s
      )
    );

    setHistory((h) => [
      { time: new Date().toLocaleTimeString(), picked },
      ...h,
    ]);
    setDrawnStudents(picked);
  }

  const addSlotMachine = () => {
    setDrawnStudents((prev) => [...prev, null]);
  };

  const removeSlotMachine = (index: number) => {
    setDrawnStudents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <DefaultLayout>
      <section className="py-2">
        <div className="text-3xl font-bold mb-6 text-center">
          <h1 className={title()}>Tirage au sort</h1>
        </div>

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
                    students={students}
                    winner={student}
                    isSpinning={isDrawing}
                    animationDelay={index * 1000}
                    onRemove={() => removeSlotMachine(index)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {!isDrawing && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onPress={addSlotMachine}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Ajouter un étudiant
              </Button>
            )}
          </CardBody>
        </Card>

        {/* Probabilities */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Probabilités de tirage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {sortedStudentsWithProbs.map(({ student, prob }) => (
              <div key={student.id}>
                <div className="flex justify-between mb-1">
                  <span>{student.name}</span>
                  <span className="text-sm text-slate-500">
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={prob * 100}
                  color="secondary"
                  className="h-2"
                />
              </div>
            ))}
          </CardBody>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Historique des tirages</h2>
          </CardHeader>
          <CardBody>
            {history.length === 0 ? (
              <p className="text-slate-500">
                Aucun tirage effectué pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((h, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center border rounded p-2"
                  >
                    <span>{h.time}</span>
                    <span className="font-medium">
                      {h.picked.map((p) => p.name).join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
