import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

interface DrawingHistory {
  id: number;
  drawing_date: string;
  drawn_students: { id: number; name: string }[];
}

interface DrawingHistoryProps {
  classroomId: number;
  refreshTrigger: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const formatToNearestMinute = (dateString: string) => {
  const date = new Date(dateString);
  date.setSeconds(0, 0);
  return date.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const DrawingHistory = ({ classroomId, refreshTrigger }: DrawingHistoryProps) => {
  const [history, setHistory] = useState<DrawingHistory[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (classroomId) {
      fetch(`${API_URL}/classrooms/${classroomId}/drawing-history`)
        .then((res) => res.json())
        .then((data) => {
          setHistory(data);
        })
        .catch(error => console.error("Error fetching history:", error));
    }
  }, [classroomId, refreshTrigger]);

  if (!history.length) {
    return null;
  }

  const drawsToShow = isExpanded ? history : history.slice(0, 1);

  return (
    <Card className="mt-4">
      <CardHeader>
        <h2 className="text-xl font-semibold">Historique</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {drawsToShow.map((draw, index) => (
          <div key={draw.id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <time className="text-sm text-slate-500">
                {formatToNearestMinute(draw.drawing_date)}
              </time>
              {index === 0 && <span className="text-xs font-semibold text-slate-500">(Dernier tirage)</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {draw.drawn_students.map((student) => (
                <Button key={student.id} variant="flat" color="secondary" size="sm">
                  {student.name}
                </Button>
              ))}
            </div>
          </div>
        ))}

        {history.length > 1 && (
          <div className="flex justify-center mt-4">
            <Button variant="light" onPress={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
