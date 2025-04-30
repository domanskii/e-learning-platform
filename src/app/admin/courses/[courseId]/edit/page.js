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
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        const snap = await getDoc(doc(db, "courses", courseId));
        if (snap.exists()) {
          const data = snap.data();
          setCourse({ ...data });
          setModules(data.modules || []);
        }
      } catch (err) {
        console.error("❌ Błąd pobierania kursu:", err);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleSaveCourse = async () => {
    if (!course) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateDoc(doc(db, "courses", courseId), {
        title: course.title,
        description: course.description,
        modules,
      });
      setMessage({ type: "success", text: "✅ Zmiany zapisane!" });
    } catch (err) {
      console.error("❌ Błąd zapisu kursu:", err);
      setMessage({ type: "error", text: "❌ Nie udało się zapisać zmian." });
    }
    setLoading(false);
  };

  const handleAddModule = () => {
    setModules(prev => [
      ...prev,
      { moduleId: `mod-${Date.now()}`, title: "Nowy moduł", lessons: [], test: null }
    ]);
  };

  const handleDeleteModule = index => {
    if (!confirm("Czy na pewno usunąć moduł?")) return;
    setModules(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditModuleTitle = (index, title) => {
    setModules(prev => prev.map((m, i) => i === index ? { ...m, title } : m));
  };

  const handleAddLesson = moduleIndex => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex) return m;
      return {
        ...m,
        lessons: [...(m.lessons || []), { lessonId: `les-${Date.now()}`, title: "Nowa lekcja", content: "" }]
      };
    }));
  };

  const handleDeleteLesson = (moduleIndex, lessonIndex) => {
    if (!confirm("Czy na pewno usunąć lekcję?")) return;
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex) return m;
      return {
        ...m,
        lessons: m.lessons.filter((_, idx) => idx !== lessonIndex)
      };
    }));
  };

  const handleEditLesson = (moduleIndex, lessonIndex, field, value) => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex) return m;
      const lessons = m.lessons.map((l, idx) => idx === lessonIndex ? { ...l, [field]: value } : l);
      return { ...m, lessons };
    }));
  };

  const handleAddTest = moduleIndex => {
    setModules(prev => prev.map((m, i) => i === moduleIndex ? { ...m, test: { questions: [] } } : m));
  };

  const handleDeleteTest = moduleIndex => {
    if (!confirm("Czy na pewno usunąć cały test?")) return;
    setModules(prev => prev.map((m, i) => i === moduleIndex ? { ...m, test: null } : m));
  };

  const handleAddTestQuestion = moduleIndex => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex) return m;
      const test = m.test ? { ...m.test, questions: [...m.test.questions, { question: "", options: [], correctAnswer: null }] } : { questions: [] };
      return { ...m, test };
    }));
  };

  const handleDeleteTestQuestion = (moduleIndex, questionIndex) => {
    if (!confirm("Czy na pewno usunąć pytanie?")) return;
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex || !m.test) return m;
      const questions = m.test.questions.filter((_, idx) => idx !== questionIndex);
      return { ...m, test: { ...m.test, questions } };
    }));
  };

  const handleEditTestQuestion = (moduleIndex, questionIndex, value) => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex || !m.test) return m;
      const questions = m.test.questions.map((q, idx) => idx === questionIndex ? { ...q, question: value } : q);
      return { ...m, test: { ...m.test, questions } };
    }));
  };

  const handleAddAnswer = (moduleIndex, questionIndex) => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex || !m.test) return m;
      const questions = m.test.questions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        return { ...q, options: [...q.options, ""] };
      });
      return { ...m, test: { ...m.test, questions } };
    }));
  };

  const handleDeleteAnswer = (moduleIndex, questionIndex, answerIndex) => {
    if (!confirm("Czy na pewno usunąć odpowiedź?")) return;
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex || !m.test) return m;
      const questions = m.test.questions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        const options = q.options.filter((_, j) => j !== answerIndex);
        const correctAnswer = q.correctAnswer === answerIndex ? null : q.correctAnswer;
        return { ...q, options, correctAnswer };
      });
      return { ...m, test: { ...m.test, questions } };
    }));
  };

  const handleEditAnswer = (moduleIndex, questionIndex, answerIndex, value) => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex || !m.test) return m;
      const questions = m.test.questions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        const options = q.options.map((opt, j) => j === answerIndex ? value : opt);
        return { ...q, options };
      });
      return { ...m, test: { ...m.test, questions } };
    }));
  };

  const handleSelectCorrectAnswer = (moduleIndex, questionIndex, answerIndex) => {
    setModules(prev => prev.map((m, i) => {
      if (i !== moduleIndex || !m.test) return m;
      const questions = m.test.questions.map((q, idx) => idx === questionIndex ? { ...q, correctAnswer: answerIndex } : q);
      return { ...m, test: { ...m.test, questions } };
    }));
  };

  if (!course) return <p className="text-center mt-10">⏳ Ładowanie kursu...</p>;

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">✏️ Edytuj kurs</h1>

          {message && (
            <p className={`mb-4 text-center ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>
          )}

          <section className="mb-6">
            <label className="block font-semibold mb-1">Tytuł kursu</label>
            <input
              type="text"
              value={course.title}
              onChange={e => setCourse(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring"
            />
            <label className="block font-semibold mb-1">Opis kursu</label>
            <textarea
              value={course.description}
              onChange={e => setCourse(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border p-2 rounded focus:outline-none focus:ring"
            />
          </section>

          <section className="mb-6">
            <button onClick={handleAddModule} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              ➕ Dodaj moduł
            </button>
          </section>

          {modules.map((mod, mi) => (
            <div key={mod.moduleId} className="mb-6 p-4 bg-gray-50 rounded shadow-sm">
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  value={mod.title}
                  onChange={e => handleEditModuleTitle(mi, e.target.value)}
                  className="flex-1 border p-2 rounded focus:outline-none focus:ring"
                />
                <button onClick={() => handleDeleteModule(mi)} className="ml-2 text-red-600 hover:underline">
                  🗑️
                </button>
              </div>

              {/* Lekcje */}
              <div className="pl-2 mb-4">
                <h3 className="font-semibold mb-2">Lekcje:</h3>
                {mod.lessons.map((les, li) => (
                  <div key={les.lessonId} className="mb-2 p-3 bg-white rounded shadow">
                    <input
                      type="text"
                      value={les.title}
                      onChange={e => handleEditLesson(mi, li, 'title', e.target.value)}
                      className="w-full border p-2 rounded mb-2 focus:outline-none focus:ring"
                    />
                    <textarea
                      rows={3}
                      value={les.content}
                      onChange={e => handleEditLesson(mi, li, 'content', e.target.value)}
                      className="w-full border p-2 rounded focus:outline-none focus:ring"
                    />
                    <button onClick={() => handleDeleteLesson(mi, li)} className="mt-2 text-red-500 hover:underline">
                      🗑 Usuń lekcję
                    </button>
                  </div>
                ))}
                <button onClick={() => handleAddLesson(mi)} className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">
                  ➕ Dodaj lekcję
                </button>
              </div>

              {/* Test */}
              <div className="p-3 bg-gray-200 rounded">
                <h3 className="font-semibold mb-2">Test:</h3>
                {!mod.test ? (
                  <button onClick={() => handleAddTest(mi)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition">
                    ➕ Dodaj test
                  </button>
                ) : (
                  <>
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => handleDeleteTest(mi)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">
                        🗑 Usuń test
                      </button>
                      <button onClick={() => handleAddTestQuestion(mi)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">
                        ➕ Dodaj pytanie
                      </button>
                    </div>
                    {mod.test.questions.map((q, qi) => (
                      <div key={qi} className="mb-4 p-3 bg-white rounded shadow">
                        <div className="flex items-center mb-2">
                          <input
                            type="text"
                            placeholder="Pytanie..."
                            value={q.question}
                            onChange={e => handleEditTestQuestion(mi, qi, e.target.value)}
                            className="flex-1 border p-2 rounded focus:outline-none focus:ring"
                          />
                          <button onClick={() => handleDeleteTestQuestion(mi, qi)} className="ml-2 text-red-600 hover:underline">
                            🗑
                          </button>
                        </div>
                        <h4 className="font-semibold mb-2">Odpowiedzi:</h4>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center mb-1">
                            <input
                              type="radio"
                              name={`correct-${mi}-${qi}`}
                              checked={q.correctAnswer === oi}
                              onChange={() => handleSelectCorrectAnswer(mi, qi, oi)}
                              className="mr-2"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={e => handleEditAnswer(mi, qi, oi, e.target.value)}
                              className="flex-1 border p-2 rounded focus:outline-none focus:ring"
                            />
                            <button onClick={() => handleDeleteAnswer(mi, qi, oi)} className="ml-2 text-red-600 hover:underline">
                              🗑
                            </button>
                          </div>
                        ))}
                        <button onClick={() => handleAddAnswer(mi, qi)} className="mt-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
                          ➕ Dodaj odpowiedź
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={handleSaveCourse} disabled={loading} className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
              {loading ? '⏳ Zapis...' : '💾 Zapisz zmiany'}
            </button>
            <button onClick={() => router.push('/admin')} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition">
              ↩️ Powrót
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
