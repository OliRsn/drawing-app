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
}

const REEL_ITEM_WIDTH = 150;
const NUM_REPEATS = 20;

export const SlotMachine = ({
  students,
  winner,
  animationDelay,
  spinId,
}: SlotMachineProps) => {
  const [visibleItems, setVisibleItems] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build reel items with repetitions
  const reel = useMemo<Student[]>(() => {
    let reelItems: Student[] = [];

    for (let i = 0; i < NUM_REPEATS; i++) {
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      reelItems = reelItems.concat(shuffled);
    }

    if (winner) {
      // Ensure winner is near the end
      const winnerIndex = Math.floor(reelItems.length * 0.9);
      reelItems.splice(winnerIndex, 1, winner);
    }

    return reelItems;
  }, [students, winner, spinId]);

  const winnerIndex = useMemo(() => {
    if (!winner) return -1;
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
              animate={{
                x:
                  winnerIndex !== -1
                    ? -(winnerIndex * REEL_ITEM_WIDTH - offset)
                    : 0,
              }}
              transition={{
                duration: 5.0,
                ease: "easeOut",
                delay: animationDelay / 1000
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
