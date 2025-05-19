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

  const [students, setStudents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {
    const fetchCourseAndStudents = async () => {
      try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          setCourseTitle(courseSnap.data().title);
        }
        const usersSnapshot = await getDocs(collection(db, "users"));
        const all = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const assigned = all.filter((user) => user.assignedCourses?.includes(courseId));
        setAllUsers(all);
        setStudents(assigned);
      } catch (error) {
        console.error("❌ Błąd pobierania danych:", error);
      }
    };
    fetchCourseAndStudents();
  }, [courseId]);

  const notAssignedUsers = allUsers.filter((user) => !user.assignedCourses?.includes(courseId));

  const handleAddAccess = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, "users", selectedUser);
      await updateDoc(userRef, { assignedCourses: arrayUnion(courseId), accessDate: serverTimestamp() });
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      const base = allUsers.find((u) => u.id === selectedUser);
      const newStudent = { ...base, assignedCourses: [...(base.assignedCourses||[]), courseId], accessDate: data.accessDate };
      setStudents((prev) => [...prev, newStudent]);
      setAllUsers((prev) => prev.map((u) => u.id === selectedUser ? newStudent : u));
      setSelectedUser("");
      alert(`✅ Dostęp do kursu przyznany: ${base.email}`);
    } catch (error) {
      console.error(error);
      alert("❌ Nie udało się przyznać dostępu.");
    }
  };

  const handleRemoveAccess = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { assignedCourses: arrayRemove(courseId) });
      setStudents((prev) => prev.filter((s) => s.id !== userId));
      setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, assignedCourses: u.assignedCourses?.filter((c) => c !== courseId) } : u));
      alert("✅ Dostęp odebrany.");
    } catch (error) {
      console.error(error);
      alert("❌ Nie udało się odebrać dostępu.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-2">👥 Kursanci kursu {courseTitle}</h1>
          <button
            onClick={() => router.push("/admin/manage-courses")}
            className="mb-6 text-gray-600 hover:underline"
          >
            ↩️ Powrót
          </button>

          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Nadanie dostępu:</h3>
            <div className="flex gap-2">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="flex-1 border p-2 rounded focus:outline-none"
              >
                <option value="">-- Wybierz --</option>
                {notAssignedUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>
              <button
                onClick={handleAddAccess}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >Przyznaj</button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Lista kursantów:</h3>
            {students.length ? (
              <ul className="space-y-2">
                {students.map((s) => (
                  <li key={s.id} className="flex justify-between items-center border p-4 rounded">
                    <div>
                      <p className="font-medium">{s.email}</p>
                      <p className="text-sm text-gray-600">
                        📅 {s.accessDate ? new Date(s.accessDate.seconds * 1000).toLocaleString() : 'Brak'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAccess(s.id)}
                      className="text-red-600 hover:underline"
                    >Usuń</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Brak przypisanych kursantów.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
