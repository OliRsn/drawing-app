
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";

interface Student {
  id: number;
  name: string;
  pastDraws: number;
  lastGrade: number;
}

interface DrawnStudentCardProps {
  student: Student;
}

export const DrawnStudentCard = ({ student }: DrawnStudentCardProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardBody>
          <p className="text-center text-2xl font-bold">{student.name}</p>
        </CardBody>
      </Card>
    </motion.div>
  );
};
