"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";

export default function ManageCourses() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        setCourses(
          coursesSnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
        );
      } catch (error) {
        console.error("❌ Błąd pobierania kursów:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    try {
      await updateDoc(doc(db, "courses", courseId), { isActive: !currentStatus });
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId ? { ...course, isActive: !currentStatus } : course
        )
      );
    } catch (error) {
      console.error("❌ Błąd zmiany statusu kursu:", error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const confirmDelete = confirm(
      "Czy na pewno chcesz usunąć ten kurs? ❌ Tej operacji nie można cofnąć!"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "courses", courseId));
      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId));
      alert("🗑️ Kurs został usunięty!");
    } catch (error) {
      console.error("❌ Błąd usuwania kursu:", error);
    }
  };

  // Filtrowanie kursów (aktywnych, nieaktywnych, wszystkie)
  const filteredCourses = courses.filter((course) => {
    if (filter === "active") return course.isActive;
    if (filter === "inactive") return !course.isActive;
    return true;
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold">⚙️ Zarządzaj kursami</h1>

        {/* Filtry */}
        <div className="flex gap-4 mt-6">
          <button
            className={`px-4 py-2 rounded shadow-md transition ${
              filter === "all"
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setFilter("all")}
          >
            Wszystkie
          </button>
          <button
            className={`px-4 py-2 rounded shadow-md transition ${
              filter === "active"
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setFilter("active")}
          >
            Aktywne
          </button>
          <button
            className={`px-4 py-2 rounded shadow-md transition ${
              filter === "inactive"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-600 text-gray-200 hover:bg-gray-700"
            }`}
            onClick={() => setFilter("inactive")}
          >
            Nieaktywne
          </button>
        </div>

        {/* Lista kursów */}
        <ul className="mt-6 w-full">
          {filteredCourses.map((course) => (
            <li
              key={course.id}
              className="p-3 bg-gray-700 text-white font-semibold rounded shadow-md flex justify-between items-center mt-3"
            >
              <span className="text-lg">{course.title}</span>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded shadow-md transition ${
                    course.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                  }`}
                  onClick={() => handleToggleCourseStatus(course.id, course.isActive)}
                >
                  {course.isActive ? "❌ Dezaktywuj" : "✅ Aktywuj"}
                </button>
                <Link
                  href={`/admin/manage-courses/${course.id}/students`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow-md transition"
                >
                  👥 Kursanci
                </Link>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded shadow-md transition"
                  onClick={() => handleDeleteCourse(course.id)}
                >
                  🗑️ Usuń kurs
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Przycisk powrotu */}
        <button
          className="mt-6 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
          onClick={() => router.push("/admin")}
        >
          ↩️ Powrót
        </button>
      </div>
    </div>
  );
}
