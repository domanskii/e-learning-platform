"use client";
import { useState, useEffect } from "react";
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
  
  // Stany do nawigacji w kursie:
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      try {
        const courseDocSnap = await getDoc(doc(db, "courses", courseId));
        if (courseDocSnap.exists()) {
          const courseData = courseDocSnap.data();
          setCourse(courseData);
          // Ustaw domyślnie pierwszy moduł i pierwszą lekcję, jeśli dostępne
          if (courseData.modules && courseData.modules.length > 0) {
            setSelectedModuleIndex(0);
            if (
              courseData.modules[0].lessons &&
              courseData.modules[0].lessons.length > 0
            ) {
              setSelectedLessonIndex(0);
            } else {
              setSelectedLessonIndex(-1);
            }
          }
        } else {
          console.error("Kurs nie istnieje!");
        }
      } catch (error) {
        console.error("Błąd pobierania kursu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Musisz być zalogowany!</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Ładowanie kursu...</p>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-500">Nie znaleziono kursu.</p>
      </div>
    );
  }

  const modules = course.modules || [];
  const currentModule = modules[selectedModuleIndex];
  const lessons = currentModule?.lessons || [];
  const currentLesson = lessons[selectedLessonIndex];

  // Ustawienie wybranego modułu
  const handleModuleSelect = (moduleIndex) => {
    setSelectedModuleIndex(moduleIndex);
    const selectedModule = modules[moduleIndex];
    if (selectedModule.lessons && selectedModule.lessons.length > 0) {
      setSelectedLessonIndex(0);
    } else {
      setSelectedLessonIndex(-1);
    }
  };

  // Ustawienie wybranej lekcji
  const handleLessonSelect = (lessonIndex) => {
    setSelectedLessonIndex(lessonIndex);
  };

  // Przejście do następnej lekcji lub modułu
  const handleNextLesson = () => {
    if (selectedLessonIndex < lessons.length - 1) {
      setSelectedLessonIndex(selectedLessonIndex + 1);
    } else if (selectedModuleIndex < modules.length - 1) {
      setSelectedModuleIndex(selectedModuleIndex + 1);
      const nextModule = modules[selectedModuleIndex + 1];
      setSelectedLessonIndex(
        nextModule.lessons && nextModule.lessons.length > 0 ? 0 : -1
      );
    }
  };

  // Przejście do poprzedniej lekcji (lub ostatniej lekcji poprzedniego modułu)
  const handlePrevLesson = () => {
    if (selectedLessonIndex > 0) {
      setSelectedLessonIndex(selectedLessonIndex - 1);
    } else if (selectedModuleIndex > 0) {
      const prevModule = modules[selectedModuleIndex - 1];
      setSelectedModuleIndex(selectedModuleIndex - 1);
      setSelectedLessonIndex(
        prevModule.lessons && prevModule.lessons.length > 0
          ? prevModule.lessons.length - 1
          : -1
      );
    }
  };

  // Przejście do następnego modułu (bez zmiany lekcji, ustawiamy pierwszą, jeśli istnieje)
  const handleNextModule = () => {
    if (selectedModuleIndex < modules.length - 1) {
      setSelectedModuleIndex(selectedModuleIndex + 1);
      const nextModule = modules[selectedModuleIndex + 1];
      setSelectedLessonIndex(
        nextModule.lessons && nextModule.lessons.length > 0 ? 0 : -1
      );
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto bg-gray-800 p-6 rounded shadow-lg">
        {/* Nagłówek kursu */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-300 mt-2">{course.description}</p>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Sidebar z modułami i lekcjami */}
          <div className="md:w-1/3 md:pr-4">
            <h2 className="text-xl font-semibold mb-4">Moduły</h2>
            <ul className="space-y-2">
              {modules.map((mod, index) => (
                <li key={mod.moduleId}>
                  <button 
                    className={`w-full text-left px-4 py-2 rounded transition ${
                      index === selectedModuleIndex ? "bg-blue-500" : "bg-gray-700"
                    } hover:bg-blue-600`}
                    onClick={() => handleModuleSelect(index)}
                  >
                    {mod.title}
                  </button>
                  {/* Rozwijana lista lekcji dla wybranego modułu */}
                  {index === selectedModuleIndex && mod.lessons && mod.lessons.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1">
                      {mod.lessons.map((lesson, lIndex) => (
                        <li key={lesson.lessonId}>
                          <button 
                            className={`w-full text-left px-3 py-1 rounded transition ${
                              lIndex === selectedLessonIndex ? "bg-green-500" : "bg-gray-600"
                            } hover:bg-green-600`}
                            onClick={() => handleLessonSelect(lIndex)}
                          >
                            {lesson.title}
                          </button>
                        </li>
                      ))}
                      {/* Po lekcjach wyświetlamy kafelek z QUIZ, jeśli moduł zawiera test */}
                      {mod.test && mod.test.questions && mod.test.questions.length > 0 && (
                        <li className="mt-2">
                          <Link 
                            href={`/courses/${courseId}/quiz`}
                            className="block px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition text-center"
                          >
                            Rozpocznij QUIZ z modułu {mod.title}
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Główna zawartość – treść lekcji */}
          <div className="md:w-2/3 md:pl-4 mt-6 md:mt-0">
            {currentLesson ? (
              <div>
                <h2 className="text-2xl font-semibold mb-2">{currentLesson.title}</h2>
                <p className="text-gray-300">{currentLesson.content}</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400">Wybierz lekcję, aby zobaczyć jej treść.</p>
              </div>
            )}
            
            {/* Przyciski nawigacyjne */}
            <div className="mt-6 flex flex-wrap gap-4">
              <button 
                onClick={handlePrevLesson}
                className="bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600 transition"
              >
                Poprzednia lekcja
              </button>
              <button 
                onClick={handleNextLesson}
                className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Następna lekcja
              </button>
              <button 
                onClick={handleNextModule}
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Następny moduł
              </button>
            </div>
            
            {/* Przyciski na dole */}
            <div className="mt-6 flex gap-4">
              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Powrót do listy kursów
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
