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
        const snapshot = await getDocs(collection(db, "courses"));
        setCourses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("❌ Błąd pobierania kursów:", err);
      }
    };
    fetchCourses();
  }, []);

  const toggleStatus = async (id, isActive) => {
    try {
      await updateDoc(doc(db, "courses", id), { isActive: !isActive });
      setCourses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !isActive } : c))
      );
    } catch (err) {
      console.error("❌ Błąd zmiany statusu:", err);
    }
  };

  const removeCourse = async (id) => {
    if (!confirm("Czy na pewno usunąć kurs?❌")) return;
    try {
      await deleteDoc(doc(db, "courses", id));
      setCourses((prev) => prev.filter((c) => c.id !== id));
      alert("🗑️ Kurs usunięty.");
    } catch (err) {
      console.error("❌ Błąd usuwania kursu:", err);
    }
  };

  const filtered = courses.filter((c) => {
    if (filter === "active") return c.isActive;
    if (filter === "inactive") return !c.isActive;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">⚙️Panel zarządzania kursami</h1>

          <div className="flex gap-4 mb-6">
            {[
              { key: 'all', label: 'Wszystkie' },
              { key: 'active', label: 'Aktywne' },
              { key: 'inactive', label: 'Nieaktywne' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded shadow-md transition ${
                  filter === key
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="space-y-4">
            {filtered.map((course) => (
              <li
                key={course.id}
                className="flex justify-between items-center border p-4 rounded-lg shadow-sm"
              >
                <span className="font-medium text-gray-900">{course.title}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(course.id, course.isActive)}
                    className={`px-3 py-1 rounded transition ${
                      course.isActive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {course.isActive ? '❌ Dezaktywuj' : '✅ Aktywuj'}
                  </button>
                  <Link
                    href={`/admin/manage-courses/${course.id}/students`}
                    className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    👥 Kursanci
                  </Link>
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    🗑️ Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={() => router.push("/admin")}
            className="mt-6 text-gray-600 hover:underline"
          >
            ↩️ Powrót
          </button>
        </div>
      </main>
    </div>
  );
}
