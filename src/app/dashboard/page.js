"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [assignedDetails, setAssignedDetails] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [completedDetails, setCompletedDetails] = useState([]); // szczegóły ukończonych kursów
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        fetchUserData(user.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAssignedCourses(userData.assignedCourses || []);
        setCompletedCourses(userData.completedCourses || []);
        setNotifications(userData.notifications || []);
      } else {
        console.error("Brak danych użytkownika!");
      }
    } catch (error) {
      console.error("Błąd pobierania danych użytkownika:", error);
    }
  };

  // Pobieramy szczegóły kursów przypisanych (tytuł, itd.)
  useEffect(() => {
    const fetchAssignedCoursesDetails = async () => {
      if (!user) return;
      try {
        const details = await Promise.all(
          assignedCourses.map(async (courseId) => {
            const courseDoc = await getDoc(doc(db, "courses", courseId));
            return {
              courseId,
              title: courseDoc.exists() ? courseDoc.data().title : "Nieznany kurs",
            };
          })
        );
        setAssignedDetails(details);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAssignedCoursesDetails();
  }, [assignedCourses, user]);

  // Pobieramy szczegóły ukończonych kursów – completedCourses to tablica obiektów { courseId, completedAt }
  useEffect(() => {
    const fetchCompletedCoursesDetails = async () => {
      if (!user) return;
      try {
        const details = await Promise.all(
          completedCourses.map(async (comp) => {
            const courseId =
              typeof comp === "object" && comp.courseId ? comp.courseId : comp;
            const courseDoc = await getDoc(doc(db, "courses", courseId));
            return {
              courseId,
              title: courseDoc.exists() ? courseDoc.data().title : "Nieznany kurs",
              completedAt:
                typeof comp === "object" && comp.completedAt ? comp.completedAt : null,
            };
          })
        );
        setCompletedDetails(details);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCompletedCoursesDetails();
  }, [completedCourses, user]);

  const handleDeleteNotification = async (index) => {
    if (!user) return;
    const updatedNotifications = notifications.filter((_, i) => i !== index);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        notifications: updatedNotifications,
      });
      setNotifications(updatedNotifications);
    } catch (error) {
      console.error("Błąd usuwania powiadomienia:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  // Funkcja generująca certyfikat – używana w sekcji ukończonych kursów
// Funkcja generująca certyfikat – używana w sekcji ukończonych kursów
const handleGenerateCertificate = (courseId, courseTitle, completedAt) => {
  if (!user) return;
  const docPDF = new jsPDF();
  docPDF.setFont("helvetica", "bold");
  docPDF.setFontSize(24);
  // Nagłówek certyfikatu z tytułem kursu
  docPDF.text(`CERTYFIKAT UKONCZENIA KURSU
  ${courseTitle}`, 20, 30);
  
  docPDF.setFont("helvetica", "normal");
  docPDF.setFontSize(16);
  // Wstawiamy e-mail użytkownika
  docPDF.text(`Gratulacje, ${user.email}!`, 20, 50);
  // Formatowanie daty ukończenia (zakładamy, że completedAt to obiekt timestamp)
  const completionDate = completedAt
    ? new Date(completedAt.seconds * 1000).toLocaleDateString("pl-PL")
    : "nieznana data";
  docPDF.text(`W dniu ${completionDate} ukonczyles kurs doszkalajacy.`, 20, 70);
  docPDF.text(
    `Zyczymy Ci wielu bezpiecznych kilometrow na drodze oraz
satysfakcji z nauki!`,
    20,
    90
  );
  
  // Podziękowania od zespołu BezpiecznyStart – umieszczone na dole certyfikatu
  docPDF.setFontSize(12);
  docPDF.text(`Dziekujemy, zespol BezpiecznyStart`, 20, 280);
  
  docPDF.save(`Certyfikat_${courseId}.pdf`);
};

  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-900 text-white">
      <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-white">📌 Panel użytkownika</h1>
        {user ? (
          <div className="mt-4">
            <p className="text-lg">
              👋 Witaj,{" "}
              <strong className="text-yellow-400">{user.email}</strong>
            </p>

            {/* Powiadomienia */}
            {notifications.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-200/90 border border-yellow-500 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-black">
                  🔔 Powiadomienia
                </h2>
                <ul className="mt-2">
                  {notifications.map((notification, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm mt-1"
                    >
                      <div className="text-black text-left">
                        <p className="font-semibold">{notification.message}</p>
                        <p className="text-xs text-gray-600">
                          {notification.timestamp
                            ? new Date(
                                notification.timestamp.seconds * 1000
                              ).toLocaleString()
                            : "Brak daty"}
                        </p>
                      </div>
                      <button
                        className="text-red-500 font-bold hover:text-red-700"
                        onClick={() => handleDeleteNotification(index)}
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Twoje kursy – wyświetlamy tytuły */}
            <h2 className="text-xl font-bold mt-6">📚 Twoje kursy</h2>
            <ul className="mt-4 w-full">
              {assignedDetails.length > 0 ? (
                assignedDetails.map((course, index) => (
                  <Link key={index} href={`/courses/${course.courseId}`}>
                    <li className="p-3 bg-blue-500 text-white font-semibold rounded shadow-md text-center hover:bg-blue-600 cursor-pointer transition">
                      {course.title}
                    </li>
                  </Link>
                ))
              ) : (
                <p className="text-gray-400">🚀 Brak przypisanych kursów.</p>
              )}
            </ul>

            {/* Ukończone kursy */}
{/* Ukończone kursy */}
<h2 className="text-xl font-bold mt-6">✅ Ukończone kursy</h2>
{completedDetails.length > 0 ? (
  <ul className="mt-4 w-full">
    {completedDetails.map((course) => (
      <li
        key={course.courseId}
        className="p-3 bg-green-500 text-white font-semibold rounded shadow-md flex justify-between items-center mt-3"
      >
        <div className="text-left">
          <p>{course.title}</p>
          <p className="text-sm text-gray-200">
            Ukończono:{" "}
            {course.completedAt
              ? new Date(course.completedAt.seconds * 1000).toLocaleString()
              : "Nieznana"}
          </p>
        </div>
        <button
          className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded shadow-md transition"
          onClick={() =>
            handleGenerateCertificate(
              course.courseId,
              course.title,
              course.completedAt
            )
          }
        >
          Pobierz certyfikat
        </button>
      </li>
    ))}
  </ul>
) : (
  <p className="text-gray-400 mt-4">Brak ukończonych kursów.</p>
)}


            <button
              onClick={handleLogout}
              className="mt-6 bg-red-500 text-white px-4 py-2 rounded shadow-md hover:bg-red-600 transition"
            >
              🔒 Wyloguj się
            </button>
          </div>
        ) : (
          <p className="mt-4 text-gray-300">⏳ Ładowanie...</p>
        )}
      </div>
    </div>
  );
}
