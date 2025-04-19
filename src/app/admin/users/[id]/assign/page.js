"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

export default function AssignCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUserAndCourses = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          console.error("Użytkownik nie istnieje!");
        }

        const coursesSnapshot = await getDocs(collection(db, "courses"));
        setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Błąd pobierania danych:", error);
      }
    };

    fetchUserAndCourses();
  }, [id]);

  const handleAssignCourse = async () => {
    if (!selectedCourse) {
      setMessage("Wybierz kurs! ❌");
      return;
    }

    try {
      const userRef = doc(db, "users", id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedCourses = userData.assignedCourses
          ? [...userData.assignedCourses, selectedCourse]
          : [selectedCourse];

        await updateDoc(userRef, { assignedCourses: updatedCourses });
        setMessage("Kurs przypisany pomyślnie! ✅");
      }
    } catch (error) {
      console.error("Błąd przypisywania kursu:", error);
      setMessage("Wystąpił błąd ❌");
    }
  };

  if (!user) return <p className="text-center mt-10">Ładowanie...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold">Przypisywanie kursów</h1>

      {message && <p className="mt-2 text-lg">{message}</p>}

      <div className="mt-6 w-full max-w-md">
        <p className="text-black font-semibold">Użytkownik: {user.email}</p>

        <label className="block mt-4 text-black font-semibold">Wybierz kurs:</label>
        <select
          className="border p-2 rounded w-full bg-white text-black"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">-- Wybierz kurs --</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>

        <button
          className="bg-green-500 text-white p-2 rounded w-full mt-4"
          onClick={handleAssignCourse}
        >
          ➕ Przypisz kurs
        </button>

        <button
          className="bg-gray-500 text-white p-2 rounded w-full mt-2"
          onClick={() => router.push("/admin")}
        >
          ↩️ Powrót
        </button>
      </div>
    </div>
  );
}
