// src/app/courses/[courseId]/quiz/page.js
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";

// helper do formatowania dat ukończenia (Firestore Timestamp lub JS Date)
function formatCompletionDate(tsOrDate) {
  if (!tsOrDate) return "–";
  if (tsOrDate.seconds != null) {
    return new Date(tsOrDate.seconds * 1000).toLocaleString();
  }
  if (typeof tsOrDate.toDate === "function") {
    return tsOrDate.toDate().toLocaleString();
  }
  return new Date(tsOrDate).toLocaleString();
}

export default function QuizPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const user = auth.currentUser;

  const [quiz, setQuiz] = useState(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // nowa logika
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);

  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [userCompleted, setUserCompleted] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }
      try {
        // pobieramy kurs
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          const data = courseSnap.data();
          setCourseTitle(data.title || "");
          // pierwszy quiz
          let quizData = null;
          for (const mod of data.modules || []) {
            if (mod.test?.questions?.length) {
              quizData = mod.test;
              break;
            }
          }
          if (!quizData) {
            alert("Quiz nie został przygotowany.");
            router.push(`/courses/${courseId}`);
            return;
          }
          setQuiz(quizData);
        }
        // sprawdzamy wcześniejsze ukończenie
        const userRef = doc(db, "users", user.uid);
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) {
          const udata = uSnap.data();
          const found = (udata.completedCourses || []).find(c => c.courseId === courseId);
          if (found) {
            setUserCompleted(true);
            setCompletionInfo(found);
          }
        }
      } catch (err) {
        console.error("Błąd pobierania quizu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, user, router]);

  const handleAnswer = (qIndex, optIndex) => {
    setAnswers(a => ({ ...a, [qIndex]: optIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    setScore(correct);

    if (correct === quiz.questions.length && user && !userCompleted) {
      const userRef = doc(db, "users", user.uid);
      const uSnap = await getDoc(userRef);
      if (uSnap.exists()) {
        const udata = uSnap.data();
        const newComp = { courseId, completedAt: new Date() };
        await updateDoc(userRef, {
          completedCourses: [...(udata.completedCourses || []), newComp],
        });
        setUserCompleted(true);
        setCompletionInfo(newComp);
      }
    }
  };

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
        <p className="text-lg text-gray-500">⏳ Ładowanie quizu...</p>
      </div>
    );
  }
  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-lg text-red-500">Brak quizu dla tego kursu.</p>
      </div>
    );
  }


  if (!started && score === null) {
    return (
      <div
        className="min-h-screen p-6 text-gray-900 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/background.png')",
        }}
      >
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-lg text-gray-900">
          <h1 className="text-3xl font-bold mb-4">Quiz – {courseTitle}</h1>
          <p>
            Znajdujesz się w teście podsumowującym kurs <strong>{courseTitle}</strong>. 
            Liczba pytań w teście: <strong>{quiz.questions.length}</strong>.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="mt-6 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-500 transition"
          >
            Rozpocznij test
          </button>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="mt-4 ml-4 bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }


  if (score !== null) {
    return (
      <div className="min-h-screen p-6 bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md bg-white text-gray-900 p-8 rounded-2xl shadow text-center space-y-4">
          <h2 className="text-2xl font-bold">Twój wynik</h2>
          <p className="text-xl">
            {score} / {quiz.questions.length}
          </p>
          {userCompleted ? (
            <p className="text-green-600">
              Ukończono:{" "}
              {formatCompletionDate(completionInfo.completedAt)}
            </p>
          ) : (
            <p className="text-red-600">Nie uzyskałeś 100%. Spróbuj ponownie.</p>
          )}
          <div className="flex justify-center gap-4">
            {userCompleted && (
            <Link
            href={`/dashboard`}
            className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400"
          >
            Powrót do strony głównej
          </Link>
            )}
            <Link
              href={`/courses/${courseId}`}
              className="bg-gray-300 text-gray-900 px-4 py-2 rounded hover:bg-gray-400"
            >
              Powrót do kursu
            </Link>
          </div>
        </div>
      </div>
    );
  }


  const total = quiz.questions.length;
  const remaining = total - 1 - current;
  const q = quiz.questions[current];

  return (
    <div
      className="min-h-screen p-6 bg-gray-900 text-gray-100 flex items-start justify-center"
      style={{
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-lg text-gray-900 space-y-6">
          <h2 className="text-2xl font-bold">Pytanie {current + 1}</h2>

          {(q.mediaUrl || q.videoUrl) && (() => {
            const url = q.mediaUrl || q.videoUrl;
            const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
            if (yt) {
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${yt[1]}`}
                  className="w-full max-h-[360px] h-auto mb-4 rounded"
                  allowFullScreen
                />
              );
            } else {
              return (
                <img
                  src={url}
                  alt="Materiał"
                  className="w-full max-h-[360px] h-auto object-contain rounded mb-4"
                />
              );
            }
          })()}

          <p className="font-semibold">{q.question}</p>

          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(current, i)}
                className={`w-full text-left px-4 py-2 rounded-lg transition ${
                  answers[current] === i
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              disabled={current === 0}
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              className={`px-4 py-2 rounded-lg ${
                current === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              } transition`}
            >
              &larr; Poprzednie
            </button>
            {current < total - 1 ? (
              <button
                onClick={() => setCurrent(c => c + 1)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition"
              >
                Następne &rarr;
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
              >
                Zakończ test
              </button>
            )}
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg text-gray-900">
          <h3 className="font-semibold mb-2">Postęp</h3>
          <p>
            Pytanie {current + 1} z {total}
          </p>
          <p>Zostało: {remaining} {remaining === 1 ? 'pytanie' : 'pytań'}</p>
        </div>
      </div>
    </div>
  );
}
