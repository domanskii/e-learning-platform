"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsers(usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Błąd pobierania użytkowników:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć tego użytkownika? Ta operacja jest nieodwracalna!"
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      alert("Użytkownik został usunięty!");
      fetchUsers();
    } catch (error) {
      console.error("Błąd usuwania użytkownika:", error);
      alert("Nie udało się usunąć użytkownika.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Ładowanie użytkowników...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-3xl mx-auto bg-gray-800/80 p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold">Zarządzaj użytkownikami</h1>
        <ul className="mt-6">
          {users.length > 0 ? (
            users.map((user) => (
              <li
                key={user.id}
                className="p-4 bg-gray-700 rounded shadow-md mt-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{user.email}</p>
                  <p className="text-sm text-gray-300">ID: {user.id}</p>
                </div>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded shadow-md hover:bg-red-600 transition"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Usuń
                </button>
              </li>
            ))
          ) : (
            <p className="text-gray-400">Brak użytkowników.</p>
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
