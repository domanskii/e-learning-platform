"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";

export default function CourseStudents() {
  const { courseId } = useParams();
  const router = useRouter();

  const [students, setStudents] = useState([]);    // Lista użytkowników przypisanych do kursu
  const [allUsers, setAllUsers] = useState([]);    // Lista wszystkich użytkowników
  const [courseTitle, setCourseTitle] = useState("");
  const [selectedUser, setSelectedUser] = useState(""); // Użytkownik, któremu przyznajemy dostęp

  useEffect(() => {
    const fetchCourseAndStudents = async () => {
      try {
        // 1. Pobierz tytuł kursu
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          setCourseTitle(courseSnap.data().title);
        }

        // 2. Pobierz wszystkich użytkowników
        const usersSnapshot = await getDocs(collection(db, "users"));
        const all = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 3. Wyodrębnij tych, którzy już mają przypisany ten kurs
        const assigned = all.filter(
          (user) => user.assignedCourses && user.assignedCourses.includes(courseId)
        );

        setAllUsers(all);
        setStudents(assigned);
      } catch (error) {
        console.error("❌ Błąd pobierania danych:", error);
      }
    };

    fetchCourseAndStudents();
  }, [courseId]);

  // Filtrujemy użytkowników, którzy nie mają jeszcze przypisanego tego kursu
  const notAssignedUsers = allUsers.filter(
    (user) => !(user.assignedCourses ?? []).includes(courseId)
  );

  // Funkcja przyznająca dostęp do kursu
  const handleAddAccess = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser);
      await updateDoc(userRef, {
        assignedCourses: arrayUnion(courseId),
        accessDate: serverTimestamp(), // opcjonalnie zapisujemy datę
      });

      // Znajdujemy w allUsers użytkownika, któremu właśnie dodaliśmy kurs
      const updatedUser = allUsers.find((u) => u.id === selectedUser);

      // Uaktualniamy stan "students"
      setStudents((prev) => [
        ...prev,
        {
          ...updatedUser,
          assignedCourses: [...(updatedUser.assignedCourses ?? []), courseId],
        },
      ]);

      // Uaktualniamy stan "allUsers"
      setAllUsers(
        allUsers.map((u) => {
          if (u.id === selectedUser) {
            return {
              ...u,
              assignedCourses: [...(u.assignedCourses ?? []), courseId],
            };
          }
          return u;
        })
      );

      setSelectedUser("");
      alert(`✅ Dostęp do kursu został przyznany użytkownikowi: ${updatedUser.email}`);
    } catch (error) {
      console.error("❌ Błąd przyznawania dostępu:", error);
      alert("❌ Nie udało się przyznać dostępu do kursu.");
    }
  };

  // Funkcja zabierająca dostęp do kursu
  const handleRemoveAccess = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        assignedCourses: arrayRemove(courseId),
      });

      // Usuwamy z listy `students`
      setStudents((prev) => prev.filter((s) => s.id !== userId));

      // Uaktualniamy "allUsers", by ten użytkownik mógł się ponownie pojawić w "nieprzypisanych"
      setAllUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              assignedCourses: (user.assignedCourses ?? []).filter((c) => c !== courseId),
            };
          }
          return user;
        })
      );

      alert("✅ Dostęp do kursu został odebrany.");
    } catch (error) {
      console.error("❌ Błąd odebrania dostępu:", error);
      alert("❌ Nie udało się zabrać dostępu do kursu.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold">👥 Kursanci kursu</h1>
        <h2 className="text-xl font-semibold mt-2">{courseTitle}</h2>

        {/* Przycisk powrotu */}
        <button
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
          onClick={() => router.push("/admin/manage-courses")}
        >
          ↩️ Powrót
        </button>

        {/* Sekcja dodawania użytkownika */}
        <div className="mt-6 p-4 bg-gray-700 rounded shadow-md">
          <h3 className="text-lg font-semibold">Dodaj użytkownika do kursu:</h3>
          <select
            className="mt-2 w-full p-2 bg-gray-600 text-white rounded"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">-- Wybierz użytkownika --</option>
            {notAssignedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
          <button
            className="mt-2 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            onClick={handleAddAccess}
          >
            Przyznaj dostęp
          </button>
        </div>

        {/* Lista przypisanych kursantów */}
        <div className="mt-6 p-4 bg-gray-700 rounded shadow-md">
          <h3 className="text-lg font-semibold">Lista kursantów:</h3>
          {students.length > 0 ? (
            <ul className="mt-4">
              {students.map((student) => (
                <li
                  key={student.id}
                  className="p-3 bg-gray-600 rounded shadow-md mt-2 flex items-start justify-between"
                >
                  <div>
                    <p className="text-lg font-bold">{student.email}</p>
                    <p className="text-sm text-gray-300">
                      📅 Data nadania dostępu:{" "}
                      {student.accessDate
                        ? new Date(student.accessDate.seconds * 1000).toLocaleString()
                        : "Brak informacji"}
                    </p>
                  </div>
                  <button
                    className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    onClick={() => handleRemoveAccess(student.id)}
                  >
                    Usuń dostęp
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-300 mt-4">Brak kursantów przypisanych do tego kursu.</p>
          )}
        </div>
      </div>
    </div>
  );
}
