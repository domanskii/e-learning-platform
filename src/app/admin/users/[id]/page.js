"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          console.error("Użytkownik nie istnieje!");
        }
      } catch (error) {
        console.error("Błąd pobierania użytkownika:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleUpdateUser = async () => {
    try {
      await updateDoc(doc(db, "users", id), {
        email: user.email, // Można dodać więcej pól do edycji w przyszłości
      });
      setMessage("Dane użytkownika zaktualizowane! ✅");
    } catch (error) {
      console.error("Błąd aktualizacji użytkownika:", error);
      setMessage("Wystąpił błąd ❌");
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      router.push("/admin");
    } catch (error) {
      console.error("Błąd usuwania użytkownika:", error);
    }
  };

  if (loading) return <p className="text-center mt-10">Ładowanie...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold">Edycja użytkownika</h1>

      {message && <p className="mt-2 text-lg">{message}</p>}

      {user && (
        <div className="mt-6 w-full max-w-md">
          <label className="block text-black font-semibold">Email</label>
          <input
            type="text"
            className="border p-2 rounded w-full bg-gray-100 text-black"
            value={user.email}
            disabled
          />

          <button
            className="bg-blue-500 text-white p-2 rounded w-full mt-4"
            onClick={handleUpdateUser}
          >
            Zapisz zmiany
          </button>
          <button
            className="bg-red-500 text-white p-2 rounded w-full mt-2"
            onClick={handleDeleteUser}
          >
            ❌ Usuń użytkownika
          </button>
          <button
            className="bg-gray-500 text-white p-2 rounded w-full mt-4 hover:bg-gray-600 transition"
            onClick={() => router.push("/admin")}
            >
            ↩️ Powrót do panelu admina
        </button>

        </div>
      )}
    </div>
  );
}
