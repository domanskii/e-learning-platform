"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [message, setMessage] = useState("");

  // ───────────────────────────────────────────
  // 1. Pobierz dane kursu z Firestore
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!courseId) return;

    const fetchCourseData = async () => {
      try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);

        if (courseSnap.exists()) {
          const courseData = courseSnap.data();
          setCourse(courseData);
          setModules(courseData.modules || []);
        } else {
          console.error("❌ Kurs nie istnieje!");
        }
      } catch (error) {
        console.error("❌ Błąd pobierania kursu:", error);
      }
    };

    fetchCourseData();
  }, [courseId]);

  // ───────────────────────────────────────────
  // 2. Zapisz zmiany w kursie (tytuł, opis, moduły, lekcje, testy itd.)
  // ───────────────────────────────────────────
  const handleSaveCourse = async () => {
    if (!course) return;
    try {
      await updateDoc(doc(db, "courses", courseId), {
        ...course,
        modules,
      });
      setMessage("✅ Zmiany zapisane!");
    } catch (error) {
      console.error("❌ Błąd zapisu kursu:", error);
      setMessage("❌ Wystąpił błąd");
    }
  };

  // ───────────────────────────────────────────
  // 3. Zarządzanie modułami
  // ───────────────────────────────────────────
  // 3.1 Dodawanie nowego modułu
  const handleAddModule = () => {
    const newModule = {
      moduleId: `mod-${Date.now()}`,
      title: "Nowy moduł",
      lessons: [],
      test: null, // Możesz zaczynać od null, by pokazywać przycisk "Dodaj test"
    };
    setModules([...modules, newModule]);
  };

  // 3.2 Usuwanie modułu
  const handleDeleteModule = (moduleIndex) => {
    if (!confirm("Czy na pewno chcesz usunąć ten moduł?")) return;
    setModules(modules.filter((_, index) => index !== moduleIndex));
  };

  // 3.3 Edycja tytułu modułu
  const handleEditModuleTitle = (index, title) => {
    const updatedModules = [...modules];
    updatedModules[index].title = title;
    setModules(updatedModules);
  };

  // ───────────────────────────────────────────
  // 4. Zarządzanie lekcjami (treść merytoryczna)
  // ───────────────────────────────────────────
  // 4.1 Dodawanie nowej lekcji
  const handleAddLesson = (moduleIndex) => {
    const newLesson = {
      lessonId: `les-${Date.now()}`,
      title: "Nowa lekcja",
      content: "",
    };

    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    setModules(updatedModules);
  };

  // 4.2 Usuwanie lekcji
  const handleDeleteLesson = (moduleIndex, lessonIndex) => {
    if (!confirm("Czy na pewno chcesz usunąć tę lekcję?")) return;
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter(
      (_, index) => index !== lessonIndex
    );
    setModules(updatedModules);
  };

  // 4.3 Edycja pola lekcji (tytuł lub treść)
  const handleEditLesson = (moduleIndex, lessonIndex, field, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex][field] = value;
    setModules(updatedModules);
  };

  // ───────────────────────────────────────────
  // 5. Zarządzanie testem
  // ───────────────────────────────────────────
  // 5.1 Dodawanie testu w module (jeśli np. test = null)
  const handleAddTest = (moduleIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test = {
      questions: [],
    };
    setModules(updatedModules);
  };

  // 5.2 Usuwanie całego testu
  const handleDeleteTest = (moduleIndex) => {
    if (!confirm("Czy na pewno chcesz usunąć cały test?")) return;
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test = null;
    setModules(updatedModules);
  };

  // 5.3 Dodawanie pytania do testu
  const handleAddTestQuestion = (moduleIndex) => {
    const updatedModules = [...modules];
    if (!updatedModules[moduleIndex].test) {
      // jeśli w module nie ma testu, tworzymy go
      updatedModules[moduleIndex].test = { questions: [] };
    }
    updatedModules[moduleIndex].test.questions.push({
      question: "",
      options: [], // tablica odpowiedzi
      correctAnswer: null, // indeks prawidłowej odpowiedzi
    });
    setModules(updatedModules);
  };

  // 5.4 Usuwanie pytania z testu
  const handleDeleteTestQuestion = (moduleIndex, questionIndex) => {
    if (!confirm("Czy na pewno chcesz usunąć to pytanie?")) return;
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test.questions = updatedModules[moduleIndex].test.questions.filter(
      (_, idx) => idx !== questionIndex
    );
    setModules(updatedModules);
  };

  // 5.5 Edycja samego pytania (treść)
  const handleEditTestQuestion = (moduleIndex, questionIndex, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test.questions[questionIndex].question = value;
    setModules(updatedModules);
  };

  // 5.6 Dodawanie odpowiedzi do pytania
  const handleAddAnswer = (moduleIndex, questionIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test.questions[questionIndex].options.push("");
    setModules(updatedModules);
  };

  // 5.7 Usuwanie odpowiedzi z pytania
  const handleDeleteAnswer = (moduleIndex, questionIndex, answerIndex) => {
    if (!confirm("Czy na pewno chcesz usunąć tę odpowiedź?")) return;
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test.questions[questionIndex].options = updatedModules[
      moduleIndex
    ].test.questions[questionIndex].options.filter((_, idx) => idx !== answerIndex);

    // jeśli usuwaliśmy odpowiedź, a była oznaczona jako prawidłowa – zeruj correctAnswer
    const currentCorrect = updatedModules[moduleIndex].test.questions[questionIndex].correctAnswer;
    if (currentCorrect === answerIndex) {
      updatedModules[moduleIndex].test.questions[questionIndex].correctAnswer = null;
    }

    setModules(updatedModules);
  };

  // 5.8 Edycja treści odpowiedzi
  const handleEditAnswer = (moduleIndex, questionIndex, answerIndex, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test.questions[questionIndex].options[answerIndex] = value;
    setModules(updatedModules);
  };

  // 5.9 Wybór prawidłowej odpowiedzi
  const handleSelectCorrectAnswer = (moduleIndex, questionIndex, answerIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].test.questions[questionIndex].correctAnswer = answerIndex;
    setModules(updatedModules);
  };

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  if (!course) return <p className="text-center mt-10">⏳ Ładowanie...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold">✏️ Edycja Kursu</h1>
        {message && <p className="mt-2 text-green-400">{message}</p>}

        {/* Tytuł kursu */}
        <input
          type="text"
          className="border p-2 rounded w-full text-black bg-white font-bold text-xl mt-4"
          value={course.title}
          onChange={(e) => setCourse({ ...course, title: e.target.value })}
        />

        {/* Opis kursu */}
        <textarea
          className="border p-2 rounded w-full text-black bg-white mt-2"
          value={course.description}
          onChange={(e) => setCourse({ ...course, description: e.target.value })}
        />

        {/* Przycisk dodawania modułu */}
        <button
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full"
          onClick={handleAddModule}
        >
          ➕ Dodaj moduł
        </button>

        {/* Lista modułów */}
        {modules.map((module, moduleIndex) => (
          <div key={module.moduleId} className="p-4 bg-gray-700 rounded mt-5">
            {/* Edytowalny tytuł modułu */}
            <div className="flex items-center mb-2">
              <input
                type="text"
                className="border p-2 rounded w-full text-black bg-white font-bold"
                value={module.title}
                onChange={(e) => handleEditModuleTitle(moduleIndex, e.target.value)}
              />
              <button
                className="ml-2 bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleDeleteModule(moduleIndex)}
              >
                🗑
              </button>
            </div>

            {/* Lekcje */}
            <div className="pl-2">
              <h3 className="font-semibold mt-2 mb-2">Lekcje:</h3>
              {module.lessons.map((lesson, lessonIndex) => (
                <div key={lesson.lessonId} className="bg-gray-600 p-2 rounded mt-2">
                  {/* Edycja tytułu lekcji */}
                  <input
                    type="text"
                    className="border p-2 rounded w-full text-black bg-white font-semibold"
                    value={lesson.title}
                    onChange={(e) =>
                      handleEditLesson(moduleIndex, lessonIndex, "title", e.target.value)
                    }
                  />
                  {/* Edycja treści lekcji */}
                  <textarea
                    rows={3}
                    className="border p-2 rounded w-full text-black bg-white mt-2"
                    value={lesson.content}
                    onChange={(e) =>
                      handleEditLesson(moduleIndex, lessonIndex, "content", e.target.value)
                    }
                  />
                  <button
                    className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => handleDeleteLesson(moduleIndex, lessonIndex)}
                  >
                    🗑 Usuń lekcję
                  </button>
                </div>
              ))}

              {/* Dodaj lekcję */}
              <button
                className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                onClick={() => handleAddLesson(moduleIndex)}
              >
                ➕ Dodaj lekcję
              </button>
            </div>

            {/* Test */}
            <div className="mt-4 bg-gray-600 p-3 rounded">
              <h3 className="font-semibold">Test:</h3>

              {/* Jeśli test nie istnieje, pokaż przycisk do jego dodania */}
              {!module.test && (
                <button
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                  onClick={() => handleAddTest(moduleIndex)}
                >
                  ➕ Dodaj test
                </button>
              )}

              {/* Jeśli test istnieje, wyświetl pytania */}
              {module.test && (
                <>
                  <button
                    className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => handleDeleteTest(moduleIndex)}
                  >
                    🗑 Usuń cały test
                  </button>

                  <button
                    className="mt-2 ml-2 bg-green-500 text-white px-3 py-1 rounded"
                    onClick={() => handleAddTestQuestion(moduleIndex)}
                  >
                    ➕ Dodaj pytanie
                  </button>

                  {module.test.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="bg-gray-500 p-2 rounded mt-2">
                      {/* Treść pytania */}
                      <div className="flex items-center">
                        <input
                          type="text"
                          className="border p-2 rounded w-full text-black bg-white"
                          placeholder="Pytanie..."
                          value={question.question}
                          onChange={(e) =>
                            handleEditTestQuestion(
                              moduleIndex,
                              questionIndex,
                              e.target.value
                            )
                          }
                        />
                        <button
                          className="ml-2 bg-red-500 text-white px-3 py-1 rounded"
                          onClick={() =>
                            handleDeleteTestQuestion(moduleIndex, questionIndex)
                          }
                        >
                          🗑
                        </button>
                      </div>

                      {/* Odpowiedzi */}
                      <h4 className="mt-2 font-semibold">Odpowiedzi:</h4>
                      {question.options.map((answer, answerIndex) => (
                        <div key={answerIndex} className="mt-1 flex items-center">
                          <input
                            type="radio"
                            name={`correctAnswer-${moduleIndex}-${questionIndex}`}
                            className="mr-2"
                            checked={question.correctAnswer === answerIndex}
                            onChange={() =>
                              handleSelectCorrectAnswer(moduleIndex, questionIndex, answerIndex)
                            }
                          />
                          <input
                            type="text"
                            className="border p-1 rounded text-black bg-white w-full"
                            value={answer}
                            onChange={(e) =>
                              handleEditAnswer(
                                moduleIndex,
                                questionIndex,
                                answerIndex,
                                e.target.value
                              )
                            }
                          />
                          <button
                            className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
                            onClick={() =>
                              handleDeleteAnswer(moduleIndex, questionIndex, answerIndex)
                            }
                          >
                            🗑
                          </button>
                        </div>
                      ))}

                      <button
                        className="mt-2 bg-green-500 text-white px-2 py-1 rounded"
                        onClick={() => handleAddAnswer(moduleIndex, questionIndex)}
                      >
                        ➕ Dodaj odpowiedź
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Przycisk zapisz zmiany */}
        <button
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded w-full"
          onClick={handleSaveCourse}
        >
          💾 Zapisz zmiany
        </button>

        {/* Przycisk powrót */}
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          onClick={() => router.push("/admin")}
        >
          ↩️ Powrót
        </button>
      </div>
    </div>
  );
}