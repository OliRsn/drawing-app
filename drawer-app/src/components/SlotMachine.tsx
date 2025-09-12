
import { useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { XMarkIcon as XIcon } from '@heroicons/react/24/solid';

interface Student {
  id: number;
  name: string;
}

interface SlotMachineProps {
  students: Student[];
  winner: Student;
  isSpinning: boolean;
  animationDelay: number;
  onRemove: () => void;
}

const REEL_ITEM_WIDTH = 150; // w-36

export const SlotMachine = ({ students, winner, isSpinning, animationDelay, onRemove }: SlotMachineProps) => {
  const [visibleItems, setVisibleItems] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  const reel = useMemo(() => {
    let reelItems: Student[] = [];
    const numRepeats = 20; // Increased repeats for a longer spin

    for (let i = 0; i < numRepeats; i++) {
      const shuffled = [...students].sort(() => Math.random() - 0.5);
      reelItems = reelItems.concat(shuffled);
    }

    if (winner) {
      const winnerIndex = Math.floor(reelItems.length * 0.9);
      reelItems.splice(winnerIndex, 1, winner);
    }

    return reelItems;
  }, [students, winner]);

  const winnerIndex = useMemo(() => {
    if (!winner) return -1;
    return reel.lastIndexOf(winner);
  }, [reel, winner]);

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

  const [spring, setSpring] = useState({ damping: 50, stiffness: 100, mass: 1 });

  useEffect(() => {
    setSpring({
      damping: 50 + Math.random() * 30,
      stiffness: 100 + Math.random() * 50,
      mass: 1 + Math.random(),
    });
  }, [isSpinning]);

  return (
    <Card className="w-full group">
        <Button 
            className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity" 
            variant="light" 
            size="sm"
            onPress={onRemove}
        >
            <XIcon className="w-4 h-4"/>
        </Button>
      <CardBody ref={containerRef} className="flex justify-center items-center">
        <div
          className="relative text-center text-2xl font-bold overflow-hidden mx-auto"
          style={{ width: containerWidth }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-full border-2 border-primary rounded-lg z-10" />
          <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-background to-transparent z-20" />
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-background to-transparent z-20" />
          <motion.div
            initial={{ x: 0 }}
            animate={{
              x: isSpinning && winnerIndex !== -1 ? -(winnerIndex * REEL_ITEM_WIDTH - offset) : 0,
            }}
            transition={{
              type: 'spring',
              ...spring,
              delay: isSpinning ? animationDelay / 1000 : 0,
            }}
            className="flex flex-row"
          >
            {reel.map((student, index) => (
              <div key={`${student.id}-${index}`} className="flex items-center justify-center" style={{ width: REEL_ITEM_WIDTH, flexShrink: 0 }}>
                {student.name}
              </div>
            ))}
          </motion.div>
        </div>
      </CardBody>
    </Card>
  );
};
