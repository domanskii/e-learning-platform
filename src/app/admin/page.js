"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  //dodawanie uzytkownika
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  //nowinki - do zrobienia
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsActive, setNewsActive] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [newsSuccess, setNewsSuccess] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      if (!currentUser || currentUser.email !== "admin@wsb.pl") {
        router.push("/");
      } else {
        fetchData();
      }
    });
    return () => unsub();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uSnap, cSnap, nSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "courses")),
        getDocs(collection(db, "news")),
      ]);
      setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setNews(nSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  //zarzadzanie uzytkownikiem
  const handleAddUser = async e => {
    e.preventDefault();
    setAddError(""); setAddSuccess("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      await setDoc(doc(db, "users", cred.user.uid), {
        email: newEmail,
        role: "user",
        isBlocked: false,
        blockUntil: null,
        assignedCourses: [],
        completedCourses: [],
      });
      setAddSuccess("Użytkownik dodany pomyślnie!");
      setNewEmail(""); setNewPassword("");
      fetchData();
    } catch (err) {
      setAddError(err.message.replace("Firebase: ", ""));
    }
  };

  const handleBlock = async (id, type) => {
    const updates = {};
    if (type === "permanent") {
      updates.isBlocked = true;
      updates.blockUntil = null;
    }
    if (type === "temporary") {
      updates.blockUntil = new Date(Date.now() + 24 * 3600 * 1000);
    }
    if (type === "unblock") {
      updates.isBlocked = false;
      updates.blockUntil = null;
    }
    await updateDoc(doc(db, "users", id), updates);
    fetchData();
  };

  const handleDeleteUser = async id => {
    if (!confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      fetchData();
    } catch (err) {
      alert("Nie udało się usunąć użytkownika.");
      console.error(err);
    }
  };

  //nowinki - zarzadzanie 
  const handleAddNews = async () => {
    setNewsError(""); setNewsSuccess("");
    if (!newsTitle.trim() || !newsContent.trim()) {
      setNewsError("Tytuł i treść są wymagane.");
      return;
    }
    try {
      await addDoc(collection(db, "news"), {
        title: newsTitle,
        content: newsContent,
        isActive: newsActive,
        createdAt: new Date(),
      });
      setNewsSuccess("Dodane pomyślnie!");
      setNewsTitle(""); setNewsContent(""); setNewsActive(true);
      fetchData();
    } catch (err) {
      setNewsError(err.message);
    }
  };

  const handleUpdateNews = async item => {
    try {
      await updateDoc(doc(db, "news", item.id), {
        title: item.title,
        content: item.content,
        isActive: item.isActive,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNews = async id => {
    if (!confirm("Czy na pewno usunąć tę nowinkę?")) return;
    try {
      await deleteDoc(doc(db, "news", id));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditNewsField = (id, field, value) => {
    setNews(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (loading) return <p className="text-center mt-10">Ładowanie...</p>;
//panel nawigacji admina
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
<nav className="w-64 bg-white shadow p-6 flex flex-col">
  <h2 className="text-2xl font-bold mb-6">Panel Admina</h2>
  <button onClick={() => setActiveTab("home")} className={`mb-2 px-4 py-2 text-left rounded ${
      activeTab === "home"
        ? "bg-gray-200 font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`}  >🏠 Strona główna </button>
  <button onClick={() => setActiveTab("users")} className={`mb-2 px-4 py-2 text-left rounded ${
      activeTab === "users"
        ? "bg-gray-200 font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`}  >👥 Użytkownicy </button>
  <button
    onClick={() => setActiveTab("addUser")}
    className={`mb-2 px-4 py-2 text-left rounded ${
      activeTab === "addUser"
        ? "bg-gray-200 font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`} > ➕ Dodaj użytkownika </button>
  <button
    onClick={() => setActiveTab("courses")}
    className={`mb-2 px-4 py-2 text-left rounded ${
      activeTab === "courses"
        ? "bg-gray-200 font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`} > 📚 Dodane kursy </button>
  <button
    onClick={() => router.push("/admin/manage-courses")}
    className="mb-2 px-4 py-2 text-left text-gray-600 hover:text-gray-900"
  > ⚙️ Zarządzaj kursami </button>
  <button
    onClick={() => router.push("/admin/courses/new")}
    className="mb-2 px-4 py-2 text-left text-gray-600 hover:text-gray-900"
  > ➕ Dodaj kurs </button>
  <button
    onClick={() => setActiveTab("news")}
    className={`mb-2 px-4 py-2 text-left rounded ${
      activeTab === "news"
        ? "bg-gray-200 font-semibold text-gray-900"
        : "text-gray-600 hover:text-gray-900"
    }`} > 📰 Nowinki </button>
  <button
    onClick={() => router.push("/admin/messages/send")}
    className="mb-2 px-4 py-2 text-left text-gray-600 hover:text-gray-900"
  > 📩 Wyślij wiadomość</button>
  <button
    onClick={handleLogout}
    className="mt-auto bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
  >🔒 Wyloguj</button>
</nav>

      <main className="flex-1 p-8 overflow-auto">
        {activeTab === "home" && <HomeView users={users} auth={auth} />}
        {activeTab === "users" && <UserList users={users} onBlock={handleBlock} onDelete={handleDeleteUser} />}
        {activeTab === "addUser" && <AddUserForm onSubmit={handleAddUser} newEmail={newEmail} setNewEmail={setNewEmail} newPassword={newPassword} setNewPassword={setNewPassword} addError={addError} addSuccess={addSuccess} />}
        {activeTab === "courses" && <CourseList courses={courses} />}
        {activeTab === "news" && <NewsView news={news} setNewsField={handleEditNewsField} onAdd={handleAddNews} onUpdate={handleUpdateNews} onDelete={handleDeleteNews} newsTitle={newsTitle} setNewsTitle={setNewsTitle} newsContent={newsContent} setNewsContent={setNewsContent} newsActive={newsActive} setNewsActive={setNewsActive} newsError={newsError} newsSuccess={newsSuccess} />}
      </main>
    </div>
  );
}

//main page panelu admina
function HomeView({ users, auth }) {
  const total = users.length;
  const blockedCount = users.filter(u => u.isBlocked || (u.blockUntil?.toMillis() > Date.now())).length;
  const activeCount = total - blockedCount;
  const adminEmail = auth.currentUser?.email;
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">Cześć, {adminEmail}</h2>
      <p className="text-gray-700 mb-6">Zobacz podsumowanie użytkowników i zaplanuj działania.</p>
      <div className="flex justify-around text-center">
        <div><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span><span>Aktywni: {activeCount}</span></div>
        <div><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span><span>Zablokowani: {blockedCount}</span></div>
      </div>
    </div>
  );
}

function UserList({ users, onBlock, onDelete }) {
  return (
    <div className="space-y-4">
      {users.map(u => {
        const blocked = u.isBlocked || (u.blockUntil?.toMillis() > Date.now());
        return (
          <div key={u.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">{u.email}</p>
              <p className="text-sm text-gray-600">{blocked ? "Zablokowany" : "Aktywny"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onBlock(u.id, "permanent")} className="text-red-600 hover:underline">Blokada stała</button>
              <button onClick={() => onBlock(u.id, "temporary")} className="text-yellow-600 hover:underline">Blokada na 24h</button>
              <button onClick={() => onBlock(u.id, "unblock")} className="text-green-600 hover:underline">Odblokuj</button>
              <button onClick={() => onDelete(u.id)} className="text-gray-600 hover:underline">Usuń</button>
              <Link href={`/admin/users/${u.id}/permissions`} className="text-pink-600 hover:underline">Zarządzaj uprawnieniami</Link>
              <Link href={`/admin/users/${u.id}/progress`} className="text-indigo-600 hover:underline">Sprawdź postęp</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddUserForm({ onSubmit, newEmail, setNewEmail, newPassword, setNewPassword, addError, addSuccess }) {
  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Dodaj użytkownika</h3>
      {addError && <p className="text-red-600 mb-2">{addError}</p>}
      {addSuccess && <p className="text-green-600 mb-2">{addSuccess}</p>}
      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="E-mail" className="w-full border p-2 mb-4 focus:outline-none focus:ring" />
      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Hasło" className="w-full border p-2 mb-4 focus:outline-none focus:ring" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Dodaj</button>
    </form>
  );
}

function CourseList({ courses }) {
  return (
    <div className="space-y-4">
      {courses.map(c => (
        <div key={c.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
          <h3 className="font-semibold text-lg text-gray-900">{c.title}</h3>
          <Link href={`/admin/courses/${c.id}/edit`} className="ml-2 bg-white text-blue-600 px-3 py-1 rounded shadow hover:bg-gray-100 transition">✏️ Edytuj</Link>
        </div>
      ))}
    </div>
  );
}

function NewsView({ news, setNewsField, onAdd, onUpdate, onDelete, newsTitle, setNewsTitle, newsContent, setNewsContent, newsActive, setNewsActive, newsError, newsSuccess }) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Dodaj nowinkę</h3>
        {newsError && <p className="text-red-600 mb-2">{newsError}</p>}
        {newsSuccess && <p className="text-green-600 mb-2">{newsSuccess}</p>}
        <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="Tytuł" className="w-full border p-2 rounded mb-2" />
        <textarea value={newsContent} onChange={e => setNewsContent(e.target.value)} placeholder="Treść" className="w-full border p-2 rounded mb-2" rows={3}></textarea>
        <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={newsActive} onChange={e => setNewsActive(e.target.checked)} /> Aktywna</label>
        <button onClick={onAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Dodaj nowinkę</button>
      </div>
      <h3 className="text-xl font-semibold mb-2">Lista dodanych:</h3>
      <div className="space-y-4">
        {news.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow">
            <input value={item.title} onChange={e => setNewsField(item.id, 'title', e.target.value)} className="w-full border p-1 rounded mb-2" />
            <textarea value={item.content} onChange={e => setNewsField(item.id, 'content', e.target.value)} className="w-full border p-1 rounded mb-2" rows={2}></textarea>
            <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={item.isActive} onChange={e => setNewsField(item.id, 'isActive', e.target.checked)} /> Aktywna</label>
            <div className="flex gap-2">
              <button onClick={() => onUpdate(item)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Zapisz</button>
              <button onClick={() => onDelete(item.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Usuń</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
