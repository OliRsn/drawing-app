import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/card';

interface Student {
  id: number;
  name: string;
}

interface SlotMachineProps {
  students: Student[];
  winner: Student;
  animationDelay: number;
  probabilities: number[];
}

const REEL_ITEM_WIDTH = 150; // w-36
const VISIBLE_ITEMS = 3;

export const SlotMachine = ({ students, winner, animationDelay, probabilities }: SlotMachineProps) => {
  const [isSpinning, setIsSpinning] = useState(true);

  const reel = useMemo(() => {
    const weightedList: Student[] = [];
    students.forEach((student, index) => {
      const weight = Math.round(probabilities[index] * 100);
      for (let i = 0; i < weight; i++) {
        weightedList.push(student);
      }
    });

    // Shuffle the weighted list
    for (let i = weightedList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weightedList[i], weightedList[j]] = [weightedList[j], weightedList[i]];
    }

    // Ensure the winner is in the list, and place it at a random position
    const winnerIndexInWeightedList = weightedList.findIndex(s => s.id === winner.id);
    if (winnerIndexInWeightedList === -1) {
        weightedList.splice(Math.floor(Math.random() * weightedList.length), 0, winner);
    } else {
        // Move winner to a different random location to make it less predictable
        const temp = weightedList[winnerIndexInWeightedList];
        weightedList.splice(winnerIndexInWeightedList, 1);
        weightedList.splice(Math.floor(Math.random() * weightedList.length), 0, temp);
    }

    return weightedList;
  }, [students, probabilities, winner]);

  const winnerIndex = useMemo(() => reel.findIndex((s) => s.id === winner.id), [reel, winner]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpinning(false);
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const containerWidth = REEL_ITEM_WIDTH * VISIBLE_ITEMS;
  const offset = (containerWidth - REEL_ITEM_WIDTH) / 2;

  return (
    <Card className="w-full flex justify-center items-center">
      <CardBody>
        <div
          className="relative text-center text-2xl font-bold overflow-hidden"
          style={{ width: containerWidth }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-full border-2 border-primary rounded-lg z-10" />
          <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-background to-transparent z-20" />
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-background to-transparent z-20" />
          <motion.div
            animate={{
              x: isSpinning
                ? - (reel.length * REEL_ITEM_WIDTH)
                : - (winnerIndex * REEL_ITEM_WIDTH - offset),
            }}
            transition={{
              duration: isSpinning ? 5 : 2,
              ease: isSpinning ? 'linear' : 'easeOut',
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