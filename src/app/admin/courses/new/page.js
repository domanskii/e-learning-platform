"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CreateCoursePage() {
  const router = useRouter();

  // Pola wymagane przy tworzeniu nowego kursu
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState(""); // Przykładowe pole na treść kursu

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    // Podstawowa walidacja
    if (!title || !description || !content) {
      setMessage("❌ Wypełnij wszystkie wymagane pola!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Tworzenie nowego kursu w Firestore
      const newCourseRef = await addDoc(collection(db, "courses"), {
        title,
        description,
        content,
        videoUrl: videoUrl.trim() !== "" ? videoUrl : null,
        // Pusta tablica modułów zgodna ze strukturą używaną w edycji
        modules: [],
        isActive: true,
      });

      setMessage("✅ Kurs dodany pomyślnie!");

      // Przekierowanie do widoku edycji nowo utworzonego kursu
      router.push(`/admin/courses/${newCourseRef.id}/edit`);
    } catch (error) {
      console.error("❌ Błąd zapisu kursu:", error);
      setMessage("❌ Wystąpił błąd przy dodawaniu kursu.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center">➕ Dodaj nowy kurs</h1>

        {message && (
          <p className="mt-2 text-lg text-red-400 text-center">{message}</p>
        )}

        {/* Pola kursu */}
        <div className="mt-6 p-4 bg-gray-700 rounded shadow-md w-full">
          <input
            type="text"
            placeholder="Tytuł kursu"
            className="border p-2 rounded w-full text-white bg-gray-600 placeholder-gray-300"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Opis kursu"
            className="border p-2 rounded w-full text-white bg-gray-600 placeholder-gray-300 mt-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Link do YouTube (opcjonalnie)"
            className="border p-2 rounded w-full text-white bg-gray-600 placeholder-gray-300 mt-2"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        {/* Treść kursu */}
        <div className="mt-6 p-4 bg-gray-700 rounded shadow-md w-full">
          <h2 className="text-lg font-semibold text-white">📖 Treść kursu</h2>
          <textarea
            placeholder="Wprowadź treść merytoryczną kursu..."
            className="border p-2 rounded w-full text-white bg-gray-600 placeholder-gray-300 mt-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {/* Przyciski akcji */}
        <button
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition w-full"
          onClick={handleCreateCourse}
          disabled={loading}
        >
          {loading ? "⏳ Tworzenie kursu..." : "💾 Utwórz kurs"}
        </button>

        <button
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition w-full"
          onClick={() => router.push("/admin")}
        >
          ↩️ Powrót
        </button>
      </div>
    </div>
  );
}
