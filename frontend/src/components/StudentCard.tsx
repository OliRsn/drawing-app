import { Progress } from "@heroui/progress";

interface StudentCardProps {
  name: string;
  value: number;
  displayValue: string;
}

export const StudentCard = ({ name, value, displayValue }: StudentCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-2">
      <p className="text-sm font-medium truncate">{name}</p>
      <div className="flex items-center gap-2">
        <Progress
          value={value}
          color="secondary"
        />
        <span className="text-xs font-semibold text-slate-600">{displayValue}</span>
      </div>
    </div>
  );
};
