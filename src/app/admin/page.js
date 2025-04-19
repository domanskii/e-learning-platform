"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || currentUser.email !== "admin@wsb.pl") {
        router.push("/");
      } else {
        setUser(currentUser);
        fetchUsersAndCourses();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsersAndCourses = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const coursesSnapshot = await getDocs(collection(db, "courses"));

      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setCourses(coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("❌ Błąd pobierania użytkowników/kursów:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleBlockUser = async (userId, type) => {
    try {
      let updates = {};

      if (type === "permanent") {
        updates = { isBlocked: true, blockUntil: null };
      } else if (type === "temporary") {
        const blockUntil = new Date();
        blockUntil.setHours(blockUntil.getHours() + 24);
        updates = { isBlocked: false, blockUntil };
      } else if (type === "unblock") {
        updates = { isBlocked: false, blockUntil: null };
      }

      await updateDoc(doc(db, "users", userId), updates);
      alert(
        `✅ Użytkownik ${
          type === "permanent"
            ? "zablokowany na stałe"
            : type === "temporary"
            ? "zablokowany na 24h"
            : "odblokowany"
        }!`
      );
      fetchUsersAndCourses();
    } catch (error) {
      console.error("❌ Błąd podczas zmiany statusu użytkownika:", error);
      alert("❌ Nie udało się zmienić statusu użytkownika.");
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-white">⏳ Ładowanie...</p>
    );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-3xl text-center">
        <h1 className="text-3xl font-bold">🛠️ Panel Administracyjny</h1>
        <p className="text-gray-300 mt-2">Witaj, {user?.email}!</p>

        {/* 🎓 Zarządzanie kursami */}
        <h2 className="text-2xl font-semibold mt-6">📚 Lista Kursów</h2>
        <ul className="mt-4 w-full text-black">
          {courses.map((course) => (
            <li
              key={course.id}
              className="p-3 bg-gray-300 rounded shadow-md flex justify-between items-center mt-2"
            >
              <span className="font-semibold">{course.title}</span>
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="ml-2 bg-white text-blue-500 px-3 py-1 rounded shadow-md hover:bg-gray-200 transition"
              >
                ✏️ Edytuj
              </Link>
            </li>
          ))}
        </ul>
        {/* Opcje zarządzania kursami */}
        <div className="flex flex-col gap-2 mt-6">
          <Link
            href="/admin/manage-courses"
            className="bg-gray-700 text-white px-4 py-2 rounded shadow-md hover:bg-gray-800 transition text-center"
          >
            ⚙️ Zarządzaj kursami
          </Link>
          <Link
            href="/admin/courses/new"
            className="bg-green-500 text-white px-4 py-2 rounded shadow-md hover:bg-green-600 transition text-center"
          >
            ➕ Dodaj kurs
          </Link>
          {/* Nowy przycisk do zarządzania użytkownikami */}

        </div>

        {/* 👥 Zarządzanie użytkownikami – lista użytkowników wyświetlana na panelu */}
        <h2 className="text-2xl font-semibold mt-8">👥 Użytkownicy</h2>
       <br></br> <Link
            href="/admin/users/id/list"
            className="bg-purple-500 text-white px-4 py-2 rounded shadow-md hover:bg-purple-600 transition text-center"
          >
            Zarządzaj użytkownikami
          </Link><br></br>
        <Link
          href="/admin/messages/send"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition text-center inline-block"
        >
          📩 Wyślij wiadomość
        </Link>
        <ul className="mt-4 w-full">
          {users.map((u) => (
            <li
              key={u.id}
              className="p-4 bg-gray-700 rounded shadow-md mt-2 flex flex-col gap-2"
            >
              <div>
                <p className="text-lg">
                  {u.email} {u.role === "admin" && "👑"}
                </p>
                <p className="text-sm text-gray-300">ID: {u.id}</p>
                {u.isBlocked ? (
                  <p className="text-red-400 text-sm font-bold">
                    🚫 Zablokowany
                  </p>
                ) : u.blockUntil &&
                  new Date(u.blockUntil.toMillis()) > new Date() ? (
                  <p className="text-orange-400 text-sm font-bold">
                    ⏳ Zablokowany do{" "}
                    {new Date(u.blockUntil.toMillis()).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-green-400 text-sm font-bold">✅ Aktywny</p>
                )}
              </div>

              {/* Przyciski zarządzania użytkownikiem */}
              <div className="flex flex-wrap gap-2">
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded shadow-md hover:bg-red-600 transition"
                  onClick={() => handleBlockUser(u.id, "permanent")}
                >
                  🛑 Blokada stała
                </button>
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded shadow-md hover:bg-yellow-600 transition"
                  onClick={() => handleBlockUser(u.id, "temporary")}
                >
                  ⏳ Blokada 24h
                </button>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded shadow-md hover:bg-green-600 transition"
                  onClick={() => handleBlockUser(u.id, "unblock")}
                >
                  🔓 Odblokuj
                </button>
                <Link
                  href={`/admin/users/${u.id}/permissions`}
                  className="bg-gray-500 text-white px-3 py-1 rounded shadow-md hover:bg-gray-600 transition"
                >
                  ⚙️ Uprawnienia
                </Link>
                <Link
                  href={`/admin/users/${u.id}/progress`}
                  className="bg-purple-500 text-white px-3 py-1 rounded shadow-md hover:bg-purple-600 transition"
                >
                  📊 Postęp
                </Link>
              </div>
            </li>
          ))}
        </ul>

        {/* 🔒 Wylogowanie */}
        <button
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded shadow-md hover:bg-red-600 transition"
          onClick={handleLogout}
        >
          🔒 Wyloguj się
        </button>
      </div>
    </div>
  );
}
