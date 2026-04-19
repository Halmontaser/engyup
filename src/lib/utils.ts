import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCourseImage(title: string = "", courseCode: string = ""): string {
  const t = title.toLowerCase();
  const c = courseCode.toLowerCase();

  // Grades 7-8: Junior
  if (t.includes("grade 7") || t.includes("grade 8") || c.startsWith("g7") || c.startsWith("g8")) {
    return "/media/images/course_covers/junior.png";
  }

  // Grades 9-10: Middle
  if (t.includes("grade 9") || t.includes("grade 10") || c.startsWith("g9") || c.startsWith("g10")) {
    return "/media/images/course_covers/middle.png";
  }

  // Grades 11-12: Senior
  if (t.includes("grade 11") || t.includes("grade 12") || c.startsWith("g11") || c.startsWith("g12")) {
    return "/media/images/course_covers/senior.png";
  }

  // Fallback to middle for everything else
  return "/media/images/course_covers/middle.png";
}
