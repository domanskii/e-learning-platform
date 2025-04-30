"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!title || !description || !content) {
      setMessage({ type: "error", text: "❌ Wypełnij wszystkie wymagane pola!" });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const newCourseRef = await addDoc(collection(db, "courses"), {
        title,
        description,
        content,
        videoUrl: videoUrl.trim() !== "" ? videoUrl : null,
        modules: [],
        isActive: true,
      });

      setMessage({ type: "success", text: "✅ Kurs dodany pomyślnie!" });
      router.push(`/admin/courses/${newCourseRef.id}/edit`);
    } catch (error) {
      console.error("❌ Błąd zapisu kursu:", error);
      setMessage({ type: "error", text: "❌ Wystąpił błąd przy dodawaniu kursu." });
    }

    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4 text-center">➕ Dodaj nowy kurs</h1>

          {message && (
            <p
              className={`mb-4 text-center ${
                message.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {message.text}
            </p>
          )}

          <section className="mb-6">
            <input
              type="text"
              placeholder="Tytuł kursu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring"
            />
            <textarea
              placeholder="Opis kursu"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring"
              rows={3}
            />
            <input
              type="text"
              placeholder="Link do YouTube (opcjonalnie)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full border p-2 rounded focus:outline-none focus:ring"
            />
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-2">📖 Treść kursu</h2>
            <textarea
              placeholder="Wprowadź treść merytoryczną kursu..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border p-2 rounded focus:outline-none focus:ring"
              rows={5}
            />
          </section>

          <button
            onClick={handleCreateCourse}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mb-2"
          >
            {loading ? "⏳ Tworzenie kursu..." : "💾 Utwórz kurs"}
          </button>

          <button
            onClick={() => router.push("/admin")}
            className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
          >
            ↩️ Powrót
          </button>
        </div>
      </main>
    </div>
  );
}
