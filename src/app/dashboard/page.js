"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  signOut,
  updateEmail as fbUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as fbUpdatePassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import Link from "next/link";
import jsPDF from "jspdf";

const dailyTips = [
  "Pamiętaj o odblaskach – zwiększ swoją widoczność.",
  "Sprawdzaj ciśnienie w oponach przed trasą.",
  "Utrzymuj bezpieczny odstęp od innych pojazdów.",
  "Unikaj rozproszeń – odłóż telefon.",
  "Zawsze używaj kierunkowskazów przy zmianie pasa.",
  "Sprawdzaj martwe pola przed manewrem.",
  "Nie zostawiaj kluczyków w widocznym miejscu.",
  "Regularnie serwisuj hamulce i amortyzatory.",
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [assignedDetails, setAssignedDetails] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [completedDetails, setCompletedDetails] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [lastActivity, setLastActivity] = useState([]);
  const [tipIndex, setTipIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState({ inProgress: 0, completed: 0, notifications: 0, total: 0 });

  // Settings state
  const [emailInput, setEmailInput] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState("");

  // Rotate daily tip every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % dailyTips.length);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Listen auth state and fetch data
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/auth");
        return;
      }
      setUser(u);
      setEmailInput(u.email || "");
      const uSnap = await getDoc(doc(db, "users", u.uid));
      if (!uSnap.exists()) return;
      const data = uSnap.data();
      setAssignedCourses(data.assignedCourses || []);
      setCompletedCourses(data.completedCourses || []);
      setNotifications(data.notifications || []);
      computeStats(data);
    });
    return () => unsub();
  }, [router]);

  // Fetch assigned course details
  useEffect(() => {
    if (!assignedCourses.length) return;
    (async () => {
      const arr = await Promise.all(
        assignedCourses.map(async (id) => {
          const snap = await getDoc(doc(db, "courses", id));
          return { id, title: snap.data()?.title || "-" };
        })
      );
      setAssignedDetails(arr);
    })();
  }, [assignedCourses]);

  // Fetch completed course details
  useEffect(() => {
    if (!completedCourses.length) return;
    (async () => {
      const arr = await Promise.all(
        completedCourses.map(async (c) => {
          const id = c.courseId;
          const snap = await getDoc(doc(db, "courses", id));
          return { id, title: snap.data()?.title || "-", completedAt: c.completedAt };
        })
      );
      setCompletedDetails(arr);
    })();
  }, [completedCourses]);

  // Build last activity when notifications or completedDetails change
  useEffect(() => {
    const acts = [];
    notifications.forEach((n) => {
      acts.push({ message: n.message, timestamp: n.timestamp?.seconds * 1000 || Date.now() });
    });
    completedDetails.forEach((c) => {
      acts.push({
        message: `Ukończyłeś kurs: ${c.title}`,
        timestamp: c.completedAt?.seconds * 1000 || Date.now(),
      });
    });
    acts.sort((a, b) => b.timestamp - a.timestamp);
    setLastActivity(acts.slice(0, 5));
  }, [notifications, completedDetails]);

  // Compute stats helper
  const computeStats = (data) => {
    const inProg = data.assignedCourses?.length || 0;
    const comp = data.completedCourses?.length || 0;
    const notif = data.notifications?.length || 0;
    setStats({ inProgress: inProg, completed: comp, notifications: notif, total: inProg + comp });
  };

  const handleDeleteNotification = async (i) => {
    if (!user) return;
    const updated = notifications.filter((_, idx) => idx !== i);
    await updateDoc(doc(db, "users", user.uid), { notifications: updated });
    setNotifications(updated);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth");
  };

  const handleGenerateCertificate = (id, title, completedAt) => {
    const pdf = new jsPDF();
    pdf.setFontSize(24);
    pdf.text(`CERTYFIKAT UKOŃCZENIA KURSU: ${title}`, 20, 30);
    pdf.setFontSize(16);
    pdf.text(`Gratulacje, ${user.email}!`, 20, 50);
    const date = completedAt
      ? new Date(completedAt.seconds * 1000).toLocaleDateString("pl-PL")
      : "-";
    pdf.text(`Ukończono: ${date}`, 20, 70);
    pdf.save(`Certyfikat_${id}.pdf`);
  };

  const handleUpdateEmail = async () => {
    setEmailMsg("");
    try {
      await fbUpdateEmail(user, emailInput);
      await updateDoc(doc(db, "users", user.uid), { email: emailInput });
      setEmailMsg("E-mail zaktualizowany");
    } catch (err) {
      setEmailMsg(err.message);
    }
  };

  const handleChangePassword = async () => {
    setPassMsg("");
    try {
      const cred = EmailAuthProvider.credential(user.email || "", oldPassword);
      await reauthenticateWithCredential(user, cred);
      await fbUpdatePassword(user, newPassword);
      setPassMsg("Hasło zmienione pomyślnie");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setPassMsg(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      <nav className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <MenuButton icon="🏠" label="Przegląd" active={activeSection === "dashboard"} onClick={() => setActiveSection("dashboard")} />
        <MenuButton icon="📚" label="Moje kursy" active={activeSection === "courses"} onClick={() => setActiveSection("courses")} />
        <MenuButton icon="✅" label="Ukończone" active={activeSection === "completed"} onClick={() => setActiveSection("completed")} />
        <MenuButton icon="🔔" label="Powiadomienia" active={activeSection === "notifications"} onClick={() => setActiveSection("notifications")} />
        <MenuButton icon="⚙️" label="Ustawienia" active={activeSection === "settings"} onClick={() => setActiveSection("settings")} />
        <button onClick={handleLogout} className="mt-auto bg-red-500 text-white py-2 rounded hover:bg-red-600">Wyloguj</button>
      </nav>
      <main className="flex-1 p-8 overflow-auto">
        {activeSection === "dashboard" && (
          <>
            <h2 className="text-3xl font-bold mb-4">Przegląd</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <StatCard label="W trakcie" value={stats.inProgress} />
              <StatCard label="Ukończone" value={stats.completed} />
              <StatCard label="Powiadomienia" value={stats.notifications} />
              <StatCard label="Wszystkie kursy" value={stats.total} />
            </div>
            <div className="bg-yellow-200 p-4 rounded-lg mb-6">
              <h3 className="font-semibold">Porada dnia:</h3>
              <p>{dailyTips[tipIndex]}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Ostatnia aktywność</h3>
              <ul className="list-disc list-inside">
                {lastActivity.length
                  ? lastActivity.map((act, i) => (
                      <li key={i} className="text-sm">
                        {act.message} –{' '}
                        <span className="italic">
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                      </li>
                    ))
                  : <li className="text-sm">Brak aktywności</li>
                }
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Nowinki ze świata drogowego</h3>
              <div className="bg-white p-4 rounded-lg shadow text-gray-700">
                <p className="italic">Brak nowinek. Czekaj na aktualizacje!</p>
              </div>
            </div>
          </>
        )}
        {activeSection === "courses" && <CourseCards courses={assignedDetails} />}
        {activeSection === "completed" && <CompletedSection details={completedDetails} onGenerate={handleGenerateCertificate} />}
        {activeSection === "notifications" && <Notifications items={notifications} onDelete={handleDeleteNotification} />}
        {activeSection === "settings" && (
          <SettingsSection
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            emailMsg={emailMsg}
            onUpdateEmail={handleUpdateEmail}
            oldPassword={oldPassword}
            setOldPassword={setOldPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            passMsg={passMsg}
            onChangePassword={handleChangePassword}
          />
        )}
      </main>
    </div>
  );
}

// Shared components
function MenuButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 mb-4 p-2 rounded hover:bg-gray-200 ${active ? "bg-gray-200 font-semibold" : ""}`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
function StatCard({ label, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-gray-600">{label}</p>
    </div>
  );
}
function CourseCards({ courses }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((c) => (
        <div
          key={c.id}
          className="bg-blue-500 text-white rounded-lg p-6 shadow hover:shadow-lg transition"
        >
          <h3 className="text-xl font-semibold mb-2">{c.title}</h3>
          <Link
            href={`/courses/${c.id}`}
            className="bg-white text-blue-600 px-4 py-2 rounded"
          >
            Kontynuuj →
          </Link>
        </div>
      ))}
    </div>
  );
}
function CompletedSection({ details, onGenerate }) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Ukończone kursy</h2>
      <div className="space-y-4">
        {details.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <p className="font-medium">{c.title}</p>
            <button
              onClick={() => onGenerate(c.id, c.title, c.completedAt)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Pobierz certyfikat
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
function Notifications({ items, onDelete }) {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Powiadomienia</h2>
      <div className="space-y-2">
        {items.map((n, idx) => (
          <div
            key={idx}
            className="bg-white p-3 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{n.message}</p>
              <p className="text-sm text-gray-500">
                {n.timestamp
                  ? new Date(n.timestamp.seconds * 1000).toLocaleString()
                  : "Brak daty"}
              </p>
            </div>
            <button
              onClick={() => onDelete(idx)}
              className="text-red-500 hover:text-red-700"
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
function SettingsSection({
  emailInput,
  setEmailInput,
  emailMsg,
  onUpdateEmail,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  passMsg,
  onChangePassword,
}) {
  return (
    <div className="max-w-md bg-white p-6 rounded-lg shadow space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Ustawienia profilu</h2>
        <label className="block font-medium mb-1">Adres e-mail</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="flex-1 border p-2 rounded focus:outline-none focus:ring"
          />
          <button
            onClick={onUpdateEmail}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zaktualizuj
          </button>
        </div>
        {emailMsg && <p className="text-sm text-red-600 mt-1">{emailMsg}</p>}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Zmiana hasła</h3>
        <label className="block font-medium mb-1">Stare hasło</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="w-full border p-2 rounded mb-2 focus:outline-none focus:ring"
        />
        <label className="block font-medium mb-1">Nowe hasło</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border p-2 rounded mb-2 focus:outline-none focus:ring"
        />
        <button
          onClick={onChangePassword}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Zmień hasło
        </button>
        {passMsg && <p className="text-sm text-red-600 mt-1">{passMsg}</p>}
      </div>
    </div>
  );
}
