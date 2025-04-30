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
            setSelectedLessonIndex(data.modules[0].lessons?.length ? 0 : -1);
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

  const selectModule = idx => {
    setSelectedModuleIndex(idx);
    const m = modules[idx];
    setSelectedLessonIndex(m.lessons?.length ? 0 : -1);
  };

  const selectLesson = idx => setSelectedLessonIndex(idx);

  const nextLesson = () => {
    if (selectedLessonIndex + 1 < lessons.length) {
      setSelectedLessonIndex(i => i + 1);
    } else if (selectedModuleIndex + 1 < modules.length) {
      selectModule(selectedModuleIndex + 1);
    }
  };

  const prevLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex(i => i - 1);
    } else if (selectedModuleIndex > 0) {
      const prevM = modules[selectedModuleIndex - 1];
      selectModule(selectedModuleIndex - 1);
      setSelectedLessonIndex(prevM.lessons?.length - 1 || -1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-1/3 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-200">Moduły</h2>
          <ul className="space-y-2">
            {modules.map((m, idx) => (
              <li key={m.moduleId}>
                <button
                  onClick={() => selectModule(idx)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    idx === selectedModuleIndex
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-200'
                  } transition`}
                >
                  {m.title}
                </button>
                {idx === selectedModuleIndex && m.lessons?.length > 0 && (
                  <ul className="mt-2 ml-4 space-y-1">
                    {m.lessons.map((l, li) => (
                      <li key={l.lessonId}>
                        <button
                          onClick={() => selectLesson(li)}
                          className={`w-full text-left px-2 py-1 rounded ${
                            li === selectedLessonIndex
                              ? 'bg-green-600 text-white'
                              : 'hover:bg-gray-700 text-gray-200'
                          } transition text-sm`}
                        >
                          {l.title}
                        </button>
                      </li>
                    ))}
                    {m.test?.questions?.length > 0 && (
                      <li className="mt-2">
                        <Link
                          href={`/courses/${courseId}/quiz`}
                          className="block text-center bg-red-600 text-white py-2 rounded hover:bg-red-700 transition text-sm font-medium"
                        >
                          Quiz: {m.title}
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <section className="lg:w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
          <header className="mb-4">
            <h1 className="text-3xl font-bold text-gray-100">{course.title}</h1>
            <p className="text-gray-400 mt-2">{course.description}</p>
          </header>

          <div className="flex-1 overflow-auto prose prose-invert text-gray-200">
            {currentLesson ? (
              <>
                <h3 className="text-2xl font-semibold mb-3">{currentLesson.title}</h3>
                <div>{currentLesson.content}</div>
              </>
            ) : (
              <p className="text-gray-500">Wybierz lekcję, aby zobaczyć zawartość.</p>
            )}
          </div>

          <nav className="mt-6 flex justify-between">
            <button
              onClick={prevLesson}
              className="bg-gray-700 text-gray-200 px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Poprzednia
            </button>
            <button
              onClick={nextLesson}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Następna lekcja
            </button>
          </nav>

          <footer className="mt-4 text-right">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-gray-400 hover:underline"
            >
              &larr; Powrót do kursów
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
