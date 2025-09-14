import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { XMarkIcon as XIcon } from "@heroicons/react/24/solid";

interface Student {
  id: number;
  name: string;
}

interface SlotMachineProps {
  students: Student[];
  winner: Student | null;
  animationDelay: number; // ms
  spinId: number; // changes each time we spin
  onRemove: () => void;
}

const REEL_ITEM_WIDTH = 150;

export const SlotMachine = ({
  students,
  winner,
  animationDelay,
  spinId,
  onRemove,
}: SlotMachineProps) => {
  const [visibleItems, setVisibleItems] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build reel items with repetitions
  const reel = useMemo(() => {
    let reelItems: Student[] = [];
    const numRepeats = 20;

    for (let i = 0; i < numRepeats; i++) {
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
      <Button
        className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
        variant="light"
        size="sm"
        onPress={onRemove}
      >
        <XIcon className="w-4 h-4" />
      </Button>

      <CardBody ref={containerRef} className="flex justify-center items-center">
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
            {reel.map((student, index) => (
              <div
                key={`${student.id}-${index}`}
                className="flex items-center justify-center"
                style={{ width: REEL_ITEM_WIDTH, flexShrink: 0 }}
              >
                {student.name}
              </div>
            ))}
          </motion.div>
        </div>
      </CardBody>
    </Card>
  );
};
