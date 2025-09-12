
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

const REEL_ITEM_HEIGHT = 40; // h-10
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

  const containerHeight = REEL_ITEM_HEIGHT * VISIBLE_ITEMS;
  const offset = (containerHeight - REEL_ITEM_HEIGHT) / 2;

  return (
    <Card className="w-full">
      <CardBody>
        <div
          className="relative text-center text-2xl font-bold overflow-hidden"
          style={{ height: containerHeight }}
        >
          <motion.div
            animate={{
              y: isSpinning
                ? - (reel.length * REEL_ITEM_HEIGHT) // A large number to ensure it spins for a while
                : - (winnerIndex * REEL_ITEM_HEIGHT - offset),
            }}
            transition={{
              duration: isSpinning ? 5 : 2, // Adjust duration for spinning and stopping
              ease: isSpinning ? 'linear' : 'easeOut',
            }}
            className="flex flex-col"
          >
            {reel.map((student, index) => (
              <div key={`${student.id}-${index}`} className="flex items-center justify-center" style={{ height: REEL_ITEM_HEIGHT }}>
                {student.name}
              </div>
            ))}
          </motion.div>
        </div>
      </CardBody>
    </Card>
  );
};
