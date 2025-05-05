"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function ManagePermissions() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("❌ Brak ID użytkownika!");
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser(userData);
          setRole(userData.role || "user");
        } else {
          setError("❌ Użytkownik nie istnieje.");
        }
      } catch (error) {
        setError("❌ Błąd pobierania danych użytkownika.");
        console.error("Błąd:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleSaveRole = async () => {
    if (!id) {
      alert("❌ Brak ID użytkownika!");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, { role });
      alert(`✅ Uprawnienia zaktualizowane! Użytkownik teraz ma rolę: ${role}`);
      router.push("/admin");
    } catch (error) {
      alert("❌ Nie udało się zmienić uprawnień.");
      console.error("Błąd zmiany roli:", error);
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-center text-white">⏳ Ładowanie...</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
        <p className="text-red-500">{error}</p>
        <button
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
          onClick={() => router.push("/admin")}
        >
          ↩️ Powrót
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold">⚙️ Zarządzanie Uprawnieniami</h1>
        <p className="text-gray-300 mt-2">
          Użytkownik: <strong>{user?.email}</strong>
        </p>

        <div className="mt-6">
          <label className="block text-lg font-semibold mb-2">Rola użytkownika:</label>
          <select 
            className="w-full p-2 bg-gray-700 text-white rounded-md"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">👤 Użytkownik</option>
            <option value="admin">👑 Administrator</option>
          </select>
        </div>

        <button
          className={`mt-6 w-full bg-green-500 text-white px-4 py-2 rounded shadow-md hover:bg-green-600 transition ${
            saving && "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleSaveRole}
          disabled={saving}
        >
          {saving ? "⏳ Zapisywanie..." : "💾 Zapisz zmiany"}
        </button>

        <button
          className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
          onClick={() => router.push("/admin")}
        >
          ↩️ Powrót
        </button>
      </div>
    </div>
  );
}
