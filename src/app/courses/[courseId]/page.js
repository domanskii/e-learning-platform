"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const [started, setStarted] = useState(false);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      try {
        const snap = await getDoc(doc(db, "courses", courseId));
        if (snap.exists()) {
          const data = snap.data();
          setCourse(data);
          if (data.modules?.length) {
            setSelectedModuleIndex(0);
            setSelectedLessonIndex(
              data.modules[0].lessons?.length ? 0 : -1
            );
          }
        }
      } catch (err) {
        console.error("❌ Błąd pobierania kursu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // autoryzacja + statusy
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-gray-300">Musisz być zalogowany!</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-gray-500">⏳ Ładowanie kursu...</p>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-red-500">Nie znaleziono kursu.</p>
      </div>
    );
  }

  const modules = course.modules || [];
  const currentModule = modules[selectedModuleIndex] || {};
  const lessons = currentModule.lessons || [];
  const currentLesson = lessons[selectedLessonIndex] || null;

  const selectModule = (idx) => {
    setStarted(true);
    setSelectedModuleIndex(idx);
    const m = modules[idx];
    setSelectedLessonIndex(m.lessons?.length ? 0 : -1);
  };
  const selectLesson = (idx) => setSelectedLessonIndex(idx);
  const nextLesson = () => {
    if (selectedLessonIndex + 1 < lessons.length) {
      setSelectedLessonIndex((i) => i + 1);
    } else if (selectedModuleIndex + 1 < modules.length) {
      selectModule(selectedModuleIndex + 1);
    }
  };
  const prevLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex((i) => i - 1);
    } else if (selectedModuleIndex > 0) {
      const prevM = modules[selectedModuleIndex - 1];
      selectModule(selectedModuleIndex - 1);
      setSelectedLessonIndex(prevM.lessons?.length - 1 || -1);
    }
  };

  return (
    <div
      className="min-h-screen p-6 text-gray-900"
      style={{
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {!started ? (
          // strona powitalna przed startem
          <div className="bg-white/50 backdrop-blur-md p-8 rounded-xl shadow-lg space-y-6 text-gray-900">
            <h1 className="text-4xl font-extrabold text-teal-600">
              {course.title}
            </h1>
            <p>{course.description}</p>
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-3">Lista modułów</h2>
              <ul className="space-y-2">
                {modules.map((m, i) => (
                  <li key={m.moduleId}>
                    <button
                      onClick={() => selectModule(i)}
                      className="w-full text-left px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                    >
                      {m.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center gap-6 mt-6">
              <button
                onClick={() => setStarted(true)}
                className="bg-teal-500 hover:bg-teal-400 px-6 py-3 rounded-full text-lg font-semibold transition"
              >
                Rozpocznij od początku
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-teal-500 hover:bg-teal-400 px-6 py-3 rounded-full text-lg font-semibold transition"
              >
                Powrót do strony głównej
              </button>
            </div>
          </div>
        ) : (
          // widok kursu
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-1/3 bg-white/50 backdrop-blur-md p-6 rounded-xl shadow-lg text-gray-900">
              <h2 className="text-2xl font-bold mb-4">Moduły</h2>
              <div className="space-y-4">
                {modules.map((m, idx) => (
                  <div key={m.moduleId}>
                    <button
                      onClick={() => selectModule(idx)}
                      className={`w-full text-left px-4 py-2 rounded-lg mb-2 transition-colors duration-200 ${
                        idx === selectedModuleIndex
                          ? "bg-teal-600 text-white"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      }`}
                    >
                      {m.title}
                    </button>
                    {idx === selectedModuleIndex && m.lessons?.length > 0 && (
                      <ul className="ml-4 space-y-1 border-l border-gray-300 pl-2">
                        {m.lessons.map((l, li) => (
                          <li key={l.lessonId}>
                            <button
                              onClick={() => selectLesson(li)}
                              className={`w-full text-left px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                                li === selectedLessonIndex
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                              }`}
                            >
                              {l.title}
                            </button>
                          </li>
                        ))}
                        {m.test?.questions?.length > 0 && (
                          <li className="mt-3">
                            <Link
                              href={`/courses/${courseId}/quiz`}
                              className="block text-center bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
                            >
                              Rozpocznij QUIZ: {m.title}
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </aside>

            <section className="lg:w-2/3 bg-white/50 backdrop-blur-md p-6 rounded-xl shadow-lg flex flex-col text-gray-900">
              <div className="flex-1 overflow-auto space-y-6">
                {currentLesson ? (
                  <>
                    <h3 className="text-2xl font-semibold">
                      {currentLesson.title}
                    </h3>
                    <p>{currentLesson.content}</p>
                    {currentLesson.videoUrl && (() => {
                      const ytMatch = currentLesson.videoUrl.match(
                        /(?:youtu\.be\/|v=)([\w-]{11})/
                      );
                      if (ytMatch) {
                        // YouTube
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                            className="w-full h-100 mb-4 rounded"
                            allowFullScreen
                          />
                        );
                      } else {
                        // dowolny URL do obrazka
                        return (
                          <img
                            src={currentLesson.videoUrl}
                            alt="Materiał"
                            className="w-full max-h-[500px] h-auto object-contain rounded mb-4"
                          />
                        );
                      }
                    })()}
                  </>
                ) : (
                  <p className="text-gray-700">
                    Wybierz lekcję, aby zobaczyć zawartość.
                  </p>
                )}
              </div>

              <nav className="mt-6 flex justify-between">
                <button
                  onClick={prevLesson}
                  className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  ← Poprzednia
                </button>
                <button
                  onClick={nextLesson}
                  className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-400 transition"
                >
                  Następna →
                </button>
              </nav>

              <footer className="mt-4 text-right">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-gray-700 hover:underline transition"
                >
                  ← Powrót do strony głównej
                </button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
