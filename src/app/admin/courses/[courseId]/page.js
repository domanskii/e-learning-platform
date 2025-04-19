"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [message, setMessage] = useState("");

  // Edytowalne pola kursu
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedVideoUrl, setEditedVideoUrl] = useState("");

  // Nowe pytanie do quizu
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", ""]);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("");

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseAndQuiz = async () => {
      try {
        const courseRef = doc(db, "courses", courseId);
        const quizRef = doc(db, "quizzes", courseId);

        const courseSnap = await getDoc(courseRef);
        const quizSnap = await getDoc(quizRef);

        if (courseSnap.exists()) {
          const courseData = courseSnap.data();
          setCourse(courseData);
          setEditedTitle(courseData.title);
          setEditedDescription(courseData.description);
          setEditedVideoUrl(courseData.videoUrl || "");
        } else {
          console.error("❌ Kurs nie istnieje!");
        }

        if (quizSnap.exists()) {
          setQuiz(quizSnap.data().questions || []);
        } else {
          console.warn("⚠️ Quiz dla tego kursu nie istnieje.");
        }
      } catch (error) {
        console.error("❌ Błąd pobierania danych:", error);
      }
    };

    fetchCourseAndQuiz();
  }, [courseId]);

  // Zapis edytowanych danych kursu + quizu
  const handleSaveChanges = async () => {
    try {
      await updateDoc(doc(db, "courses", courseId), {
        title: editedTitle,
        description: editedDescription,
        videoUrl: editedVideoUrl,
      });

      await updateDoc(doc(db, "quizzes", courseId), { questions: quiz });

      setMessage("✅ Zmiany w kursie i quizie zapisane!");
    } catch (error) {
      console.error("❌ Błąd zapisu danych:", error);
      setMessage("❌ Wystąpił błąd");
    }
  };

  // Dodawanie nowego pytania
  const handleAddQuestion = () => {
    if (!newQuestion || newOptions.some(opt => opt === "") || !newCorrectAnswer) {
      setMessage("❌ Wypełnij wszystkie pola i wybierz poprawną odpowiedź!");
      return;
    }

    const updatedQuiz = [...quiz, { question: newQuestion, options: newOptions, correctAnswer: newCorrectAnswer }];
    setQuiz(updatedQuiz);
    setNewQuestion("");
    setNewOptions(["", "", ""]);
    setNewCorrectAnswer("");
  };

  // Usuwanie pytania
  const handleDeleteQuestion = (index) => {
    if (!confirm("Czy na pewno chcesz usunąć to pytanie?")) return;
    setQuiz(quiz.filter((_, i) => i !== index));
  };

  if (!course) return <p className="text-center mt-10">⏳ Ładowanie...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold">Edycja Kursu</h1>
      <button
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded shadow-md hover:bg-gray-600 transition"
        onClick={() => router.push("/admin")}
      >
        ↩️ Powrót
      </button>
      <button
  className="mt-6 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition w-full max-w-2xl"
  onClick={handleSaveChanges}
>
  💾 Zapisz wszystkie zmiany
</button>

      {/* Edytowalne szczegóły kursu */}
      <div className="mt-6 p-4 bg-gray-200 rounded shadow-md w-full max-w-2xl">
        <input
          type="text"
          className="border p-2 rounded w-full text-black bg-white font-bold text-2xl"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
        />
        <textarea
          className="border p-2 rounded w-full text-black bg-white mt-2"
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
        />
        <input
          type="text"
          className="border p-2 rounded w-full text-black bg-white mt-2"
          placeholder="Link do YouTube"
          value={editedVideoUrl}
          onChange={(e) => setEditedVideoUrl(e.target.value)}
        />
      </div>

      {/* Edycja quizu */}
      <h2 className="text-2xl font-semibold mt-6">Edycja Quizu</h2>
      {message && <p className="mt-2 text-lg">{message}</p>}

      {quiz.length > 0 && (
        <ul className="mt-4 w-full max-w-2xl">
          {quiz.map((q, index) => (
            <li key={index} className="p-4 bg-gray-300 rounded shadow-md mt-2">
              <input
                type="text"
                className="border p-2 rounded w-full text-black bg-gray-100"
                value={q.question}
                onChange={(e) => {
                  const updatedQuiz = [...quiz];
                  updatedQuiz[index] = { ...q, question: e.target.value };
                  setQuiz(updatedQuiz);
                }}
              />
              {q.options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  className={`border p-2 rounded w-full mt-2 text-black ${opt === q.correctAnswer ? "bg-green-300" : "bg-gray-100"}`}
                  value={opt}
                  onChange={(e) => {
                    const updatedQuiz = [...quiz];
                    updatedQuiz[index].options[idx] = e.target.value;
                    setQuiz(updatedQuiz);
                  }}
                />
              ))}
              <select
                className="border p-2 rounded w-full mt-2 text-black bg-gray-100"
                value={q.correctAnswer}
                onChange={(e) => {
                  const updatedQuiz = [...quiz];
                  updatedQuiz[index].correctAnswer = e.target.value;
                  setQuiz(updatedQuiz);
                }}
              >
                {q.options.map((opt, idx) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <button
                className="mt-2 bg-red-500 text-white px-3 py-1 rounded shadow-md hover:bg-red-600 transition"
                onClick={() => handleDeleteQuestion(index)}
              >
                🗑 Usuń
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Dodawanie nowego pytania */}
      <div className="p-4 bg-gray-300 rounded shadow-md w-full max-w-2xl mt-6">
        <input
          type="text"
          placeholder="Treść pytania"
          className="border p-2 rounded w-full text-black bg-gray-100"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        {newOptions.map((opt, idx) => (
          <input
            key={idx}
            type="text"
            placeholder={`Odpowiedź ${idx + 1}`}
            className="border p-2 rounded w-full mt-2 text-black bg-gray-100"
            value={opt}
            onChange={(e) => {
              const updatedOptions = [...newOptions];
              updatedOptions[idx] = e.target.value;
              setNewOptions(updatedOptions);
            }}
          />
        ))}
        <select
          className="border p-2 rounded w-full mt-2 text-black bg-gray-100"
          value={newCorrectAnswer}
          onChange={(e) => setNewCorrectAnswer(e.target.value)}
        >
          <option value="">Wybierz poprawną odpowiedź</option>
          {newOptions.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <button className="bg-green-500 text-white p-2 rounded mt-2 w-full" onClick={handleAddQuestion}>
          ➕ Dodaj pytanie
        </button>
      </div>
      <button
  className="mt-6 bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600 transition w-full max-w-2xl"
  onClick={handleSaveChanges}
>
  💾 Zapisz wszystkie zmiany
</button>

    </div>
  );
}
