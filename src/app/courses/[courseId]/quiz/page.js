"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import jsPDF from "jspdf";

export default function QuizPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const user = auth.currentUser;

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  // Przechowujemy wybrane odpowiedzi jako indeksy opcji
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [userCompleted, setUserCompleted] = useState(false);
  // Zapisujemy dane ukończenia, np. data ukończenia
  const [completionInfo, setCompletionInfo] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }
      try {
        // Pobieramy dokument kursu (w którym quiz jest w module.test)
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          let quizData = null;
          if (courseData.modules && courseData.modules.length > 0) {
            for (const mod of courseData.modules) {
              if (mod.test && mod.test.questions && mod.test.questions.length > 0) {
                quizData = mod.test;
                break;
              }
            }
          }
          if (quizData) {
            setQuiz(quizData);
          } else {
            console.error("Quiz nie istnieje!");
            alert("Quiz dla tego kursu nie został jeszcze przygotowany.");
            router.push(`/courses/${courseId}`);
            return;
          }
        } else {
          console.error("Kurs nie istnieje!");
        }

        // Sprawdzamy, czy użytkownik już ukończył kurs – teraz completedCourses jest tablicą obiektów { courseId, completedAt }
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (
            userData.completedCourses &&
            userData.completedCourses.some((item) => item.courseId === courseId)
          ) {
            setUserCompleted(true);
            const comp = userData.completedCourses.find(
              (item) => item.courseId === courseId
            );
            setCompletionInfo(comp);
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

  // Zapisujemy indeks wybranej opcji zamiast tekstu
  const handleAnswer = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz || !quiz.questions) return;

    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);

    // Jeśli użytkownik uzyskał 100% i jeszcze nie ukończył kursu – zapisz datę ukończenia
    if (correctCount === quiz.questions.length && user && !userCompleted) {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Używamy new Date() zamiast serverTimestamp()
          const newCompletion = { courseId, completedAt: new Date() };
          const updated = userData.completedCourses
            ? [...userData.completedCourses, newCompletion]
            : [newCompletion];
          await updateDoc(userRef, { completedCourses: updated });
          setUserCompleted(true);
          setCompletionInfo(newCompletion);
        }
      } catch (err) {
        console.error("Błąd zapisu ukończenia kursu:", err);
      }
    }
    
  };

  // Funkcja generująca certyfikat – dostępna tylko w pierwszym ukończeniu, nie przy kolejnych próbach na tej stronie
  const handleGenerateCertificate = () => {
    if (!user) return;
    const docPDF = new jsPDF();
    docPDF.setFont("helvetica", "bold");
    docPDF.setFontSize(24);
    docPDF.text("Certyfikat ukończenia kursu", 20, 30);

    docPDF.setFont("helvetica", "normal");
    docPDF.setFontSize(16);
    docPDF.text(`Gratulacje, ${user.email}!`, 20, 50);
    docPDF.text(`Ukończyłeś kurs: ${courseId}`, 20, 70);

    // Jeśli mamy completionInfo, spróbuj sformatować datę (może wymagać dodatkowego pobrania serwera)
    docPDF.setFontSize(12);
    docPDF.text(
      `Data ukończenia: ${
        completionInfo && completionInfo.completedAt
          ? new Date(completionInfo.completedAt.seconds * 1000).toLocaleString()
          : "Nieznana"
      }`,
      20,
      90
    );

    docPDF.save(`Certyfikat_${courseId}.pdf`);
  };

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Musisz być zalogowany</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Ładowanie quizu...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
        <p>Nie znaleziono quizu dla tego kursu.</p>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white flex flex-col items-center">
      <div className="bg-gray-800 p-6 rounded shadow max-w-2xl w-full">
        <h1 className="text-2xl font-bold">Quiz – {courseId}</h1>

        {score !== null ? (
          <div className="mt-4 text-center">
            <p className="text-xl">
              Twój wynik: {score} / {totalQuestions}
            </p>
            {userCompleted ? (
              <>
                <p className="mt-2 text-green-400">
                  Ukończyłeś kurs już wcześniej, data ukończenia:
                  {" "}
                  {completionInfo && completionInfo.completedAt
                    ? new Date(completionInfo.completedAt.seconds * 1000).toLocaleString()
                    : "nieznana"}
                </p>
                {/* Na tej stronie nie pozwalamy już na pobieranie certyfikatu – 
                    certyfikat pobierany będzie z dashboardu */}
              </>
            ) : (
              <>
                <p className="mt-2 text-red-300">
                  Nie uzyskałeś 100%. Spróbuj ponownie później.
                </p>
                <button
                  className="mt-4 bg-yellow-500 px-4 py-2 rounded"
                  onClick={handleSubmit}
                >
                  Sprawdź wyniki
                </button>
              </>
            )}
            <button
              className="mt-4 bg-blue-500 px-4 py-2 rounded"
              onClick={() => router.push(`/courses/${courseId}`)}
            >
              Powrót do kursu
            </button>
          </div>
        ) : (
          <div className="mt-4">
            {quiz.questions.map((question, index) => (
              <div key={index} className="mb-4">
                <p className="font-semibold">{question.question}</p>
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`block w-full text-left px-4 py-2 mt-1 rounded ${
                      answers[index] === i
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-black"
                    }`}
                    onClick={() => handleAnswer(index, i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ))}
            <button
              className="mt-4 bg-green-500 px-4 py-2 rounded"
              onClick={handleSubmit}
            >
              Sprawdź wyniki
            </button>
            <button
              className="mt-2 bg-gray-500 px-4 py-2 rounded"
              onClick={() => router.push(`/courses/${courseId}`)}
            >
              Powrót do kursu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
