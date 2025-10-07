import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Group {
  id: number;
  name: string;
  classroom_id: number;
  students: Student[];
}

export interface GroupInDB {
  id: number;
  name: string;
  classroom_id: number;
}

export interface Student {
  id: number;
  name: string;
  weight: number;
  draw_count: number;
  classroom_id: number;
  probability?: number;
  groups: GroupInDB[];
}

export interface Classroom {
  id: number;
  name: string;
  students: Student[];
  groups: Group[];
}

export interface DrawingHistory {
    id: number;
    classroom_id: number;
    drawing_date: string;
    drawn_students: { id: number; name: string }[];
}