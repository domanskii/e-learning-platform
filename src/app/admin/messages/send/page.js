"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function SendMessagePage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [message, setMessage] = useState("");

  // Lista gotowych wiadomości
  const messageTemplates = [
    "📢 Masz nowy dostęp do kursu!",
    "🎉 Gratulacje! Ukończyłeś kurs!",
    "⏳ Przypomnienie: Twój kurs kończy się wkrótce!",
    "📝 Nowe materiały do Twojego kursu!",
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email })));
      } catch (error) {
        console.error("❌ Błąd pobierania użytkowników:", error);
      }
    };

    fetchUsers();
  }, []);

  // Funkcja do wysyłania wiadomości
  const handleSendMessage = async () => {
    if (!selectedUser) {
      setMessage("❌ Wybierz użytkownika!");
      return;
    }

    const finalMessage = selectedTemplate ? selectedTemplate : customMessage;
    if (!finalMessage) {
      setMessage("❌ Wybierz lub wpisz treść wiadomości!");
      return;
    }

    try {
      const userRef = doc(db, "users", selectedUser);
      await updateDoc(userRef, {
        notifications: [
          {
            message: finalMessage,
            timestamp: new Date(),
          },
        ],
      });

      setMessage("✅ Wiadomość wysłana!");
      setSelectedUser("");
      setSelectedTemplate("");
      setCustomMessage("");
    } catch (error) {
      console.error("❌ Błąd wysyłania wiadomości:", error);
      setMessage("❌ Wystąpił błąd!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 text-black">
      <h1 className="text-3xl font-bold">📩 Wyślij wiadomość</h1>

      {message && <p className="mt-2 text-lg text-red-500">{message}</p>}

      <select
        className="border p-2 rounded w-full max-w-md mt-4"
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
      >
        <option value="">Wybierz użytkownika</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>{user.email}</option>
        ))}
      </select>

      <select
        className="border p-2 rounded w-full max-w-md mt-4"
        value={selectedTemplate}
        onChange={(e) => setSelectedTemplate(e.target.value)}
      >
        <option value="">Wybierz gotowe powiadomienie</option>
        {messageTemplates.map((template, index) => (
          <option key={index} value={template}>{template}</option>
        ))}
      </select>

      <textarea
        className="border p-2 rounded w-full max-w-md mt-4"
        placeholder="Lub wpisz własną wiadomość..."
        value={customMessage}
        onChange={(e) => setCustomMessage(e.target.value)}
      />

      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition"
        onClick={handleSendMessage}
      >
        📤 Wyślij wiadomość
      </button>
      <button
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
        onClick={() => router.push("/admin")}
      >
        ↩️ Powrót
      </button>
    </div>
  );
}
