import { Metadata } from "next";
import { StudentImportPage } from "./student-import-page";

export const metadata: Metadata = {
  title: "O'quvchilarni import qilish | Mendeleyev",
  description: "Excel fayl orqali o'quvchilarni import qilish",
};

export default function ImportPage() {
  return <StudentImportPage />;
}
