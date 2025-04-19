"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function UserProgressPage() {
  const { id } = useParams(); // id użytkownika
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [courseProgress, setCourseProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        const userDocSnap = await getDoc(doc(db, "users", id));
        if (!userDocSnap.exists()) {
          console.error("Użytkownik nie istnieje.");
          return;
        }
        const data = userDocSnap.data();
        setUserData(data);
        const assigned = data.assignedCourses || [];
        const completed = data.completedCourses || [];
        // Dla każdego przypisanego kursu pobieramy tytuł i status ukończenia
        const progressArray = await Promise.all(
          assigned.map(async (courseId) => {
            const courseDocSnap = await getDoc(doc(db, "courses", courseId));
            const title = courseDocSnap.exists()
              ? courseDocSnap.data().title
              : "Nieznany kurs";
            const isCompleted = completed.some((item) =>
              typeof item === "object" ? item.courseId === courseId : false
            );
            return {
              courseId,
              title,
              status: isCompleted ? "Zakończony" : "W toku",
            };
          })
        );
        setCourseProgress(progressArray);
      } catch (error) {
        console.error("Błąd pobierania postępu użytkownika:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProgress();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Ładowanie postępu użytkownika...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Brak danych użytkownika.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded shadow-lg">
        <h1 className="text-3xl font-bold">Postęp użytkownika</h1>
        <p className="mt-2">
          <strong>Nazwa użytkownika:</strong> {userData.email} <br />
          <strong>ID:</strong> {id}
        </p>
        <h2 className="text-2xl font-semibold mt-6">Postęp w kursach</h2>
        <ul className="mt-4">
          {courseProgress.length > 0 ? (
            courseProgress.map((course) => (
              <li
                key={course.courseId}
                className="p-3 bg-gray-700 rounded shadow-md mt-2"
              >
                <p className="font-semibold">{course.title}</p>
                <p className="text-sm text-gray-300">Status: {course.status}</p>
              </li>
            ))
          ) : (
            <p className="text-gray-400">Brak przypisanych kursów.</p>
          )}
        </ul>
        <button
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition"
          onClick={() => router.push("/admin")}
        >
          Powrót do panelu
        </button>
      </div>
    </div>
  );
}
