import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/card";

interface Student {
  id: number;
  name: string;
  weight: number;
  draw_count: number;
  probability?: number;
}

interface SlotMachineProps {
  students: Student[];
  winner: Student | null;
  animationDelay: number; // ms
  spinId: number; // changes each time we spin
  reelId: number;
}

const REEL_ITEM_WIDTH = 150;
const MIN_FULL_CYCLES = 3;
const MIN_TOTAL_SPINS = 40;
const BUFFER_MULTIPLIER = 2;
const SPIN_DURATION_MS = 5000;
const SLOW_SPIN_EASE: [number, number, number, number] = [0.15, 0.85, 0.25, 1];

export const SLOT_MACHINE_SPIN_DURATION = SPIN_DURATION_MS;

// Mulberry32 PRNG factory
const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Fisher-Yates shuffle algorithm with a custom PRNG
const shuffleWithRng = <T,>(array: T[], rng: () => number): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const SlotMachine = ({
  students,
  winner,
  animationDelay,
  spinId,
  reelId,
}: SlotMachineProps) => {
  const [visibleItems, setVisibleItems] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  const reel = useMemo<Student[]>(() => {
    if (students.length === 0) {
      return [];
    }

    // Create a deterministic, but unique PRNG for this machine instance
    const seed = spinId + reelId * 1000 + (winner?.id || 0);
    const rng = mulberry32(seed);

    const ensureOdd = (value: number) => (value % 2 === 0 ? value + 1 : value);
    const effectiveVisible = ensureOdd(Math.max(visibleItems, 3));

    const itemsBeforeWinner = Math.max(
      students.length * MIN_FULL_CYCLES,
      effectiveVisible * (MIN_FULL_CYCLES + 1),
      MIN_TOTAL_SPINS
    );
    const bufferAfterWinner = Math.max(effectiveVisible * BUFFER_MULTIPLIER, effectiveVisible + 3);
    const totalItemsNeeded = itemsBeforeWinner + bufferAfterWinner;

    const generated: Student[] = [];
    while (generated.length < totalItemsNeeded) {
      const shuffled = shuffleWithRng(students, rng);
      if (generated.length > 0 && shuffled.length > 0 && generated[generated.length - 1].id === shuffled[0].id) {
        if (shuffled.length > 1) {
          shuffled.push(shuffled.shift()!);
        }
      }
      for (const student of shuffled) {
        generated.push(student);
        if (generated.length >= totalItemsNeeded) {
          break;
        }
      }
    }

    if (winner) {
      const insertionIndex = Math.min(
        Math.max(itemsBeforeWinner - Math.ceil(effectiveVisible / 2), effectiveVisible),
        generated.length
      );
      const filtered = generated.filter(student => student.id !== winner.id);
      filtered.splice(insertionIndex, 0, winner);
      return filtered;
    }

    return generated;
  }, [students, winner, spinId, reelId, visibleItems]);

  const winnerIndex = useMemo(() => {
    if (!winner) return -1;
    // The winner should now be unique, but lastIndexOf is safest
    return reel.lastIndexOf(winner);
  }, [reel, winner]);

  // Calculate number of visible items based on container size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        let numItems = Math.floor(containerWidth / REEL_ITEM_WIDTH);
        if (numItems % 2 === 0) {
          numItems = numItems > 1 ? numItems - 1 : 1;
        }
        setVisibleItems(numItems);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const containerWidth = REEL_ITEM_WIDTH * visibleItems;
  const offset = (containerWidth - REEL_ITEM_WIDTH) / 2;
  const targetPosition =
    winnerIndex !== -1 ? -(winnerIndex * REEL_ITEM_WIDTH - offset) : 0;
  const animation =
    winnerIndex !== -1
      ? { x: [0, targetPosition * 0.82, targetPosition] }
      : { x: 0 };
  const transition =
    winnerIndex !== -1
      ? {
          duration: SPIN_DURATION_MS / 1000,
          ease: ["linear", SLOW_SPIN_EASE],
          times: [0, 0.75, 1] as const,
        }
      : {
          duration: SPIN_DURATION_MS / 1000,
          ease: SLOW_SPIN_EASE,
        };

  return (
    <Card className="w-full group relative">
      <div ref={containerRef} className="flex justify-center items-center overflow-x-hidden">
        <CardBody>
          <div
            className="relative text-center text-2xl font-bold overflow-hidden mx-auto"
            style={{ width: containerWidth }}
          >
            {/* Highlight window */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-full border-2 border-primary rounded-lg z-10" />

            {/* Fade gradients */}
            <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-background to-transparent z-20" />
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-background to-transparent z-20" />

            <motion.div
              key={spinId} // restart animation when spinId changes
              initial={{ x: 0 }}
              animate={animation}
              transition={{
                ...transition,
                delay: animationDelay / 1000,
              }}
              className="flex flex-row"
            >
              {reel.map((student: Student, index: number) => {
                const nameLength = student.name.length;
                let fontSizeClass = "text-2xl";
                if (nameLength > 9) fontSizeClass = "text-xl";
                if (nameLength > 12) fontSizeClass = "text-lg";
                if (nameLength > 15) fontSizeClass = "text-base";

                return (
                  <div
                    key={`${student.id}-${index}`}
                    className={`flex items-center justify-center whitespace-nowrap ${fontSizeClass}`}
                    style={{ width: REEL_ITEM_WIDTH, flexShrink: 0 }}
                  >
                    {student.name}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </CardBody>
      </div>
    </Card>
  );
};
