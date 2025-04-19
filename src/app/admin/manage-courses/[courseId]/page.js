"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function CourseStudents() {
  const { courseId } = useParams();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");

  useEffect(() => {
    const fetchCourseAndStudents = async () => {
      try {
        // Pobieramy nazwę kursu
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          setCourseTitle(courseSnap.data().title);
        }

        // Pobieramy użytkowników
        const usersSnapshot = await getDocs(collection(db, "users"));
        const studentsList = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.assignedCourses && user.assignedCourses.includes(courseId));

        setStudents(studentsList);
      } catch (error) {
        console.error("❌ Błąd pobierania danych:", error);
      }
    };

    fetchCourseAndStudents();
  }, [courseId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold">👥 Kursanci kursu</h1>
      <h2 className="text-xl font-semibold mt-2">{courseTitle}</h2>

      <button
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
        onClick={() => router.push("/admin/manage-courses")}
      >
        ↩️ Powrót
      </button>

      <ul className="mt-4 w-full max-w-md">
        {students.length > 0 ? (
          students.map(student => (
            <li key={student.id} className="p-3 bg-gray-200 rounded shadow-md mt-2">
              <p className="text-lg">{student.email}</p>
              <p className="text-sm text-gray-600">📅 Data nadania dostępu: {student.accessDate || "Brak informacji"}</p>
            </li>
          ))
        ) : (
          <p className="text-gray-600 mt-2">Brak kursantów przypisanych do tego kursu.</p>
        )}
      </ul>
    </div>
  );
}
