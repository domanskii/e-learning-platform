"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("bg-blue-500");

  useEffect(() => {
    const colors = ["bg-blue-400", "bg-blue-500", "bg-blue-600", "bg-blue-700"];
    let index = 0;
    const interval = setInterval(() => {
      setBackgroundColor(colors[index]);
      index = (index + 1) % colors.length;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "user",
          isBlocked: false,
          blockUntil: null,
          assignedCourses: [],
          completedCourses: []
        });
      }

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 🛑 Sprawdzamy, czy konto jest zablokowane
        if (userData.isBlocked) {
          setError("❌ Twoje konto jest zablokowane. Skontaktuj się z administratorem.");
          return;
        }

        if (userData.blockUntil && userData.blockUntil.toMillis() > Date.now()) {
          setError(`❌ Twoje konto jest zablokowane do ${new Date(userData.blockUntil.toMillis()).toLocaleString()}.`);
          return;
        }

        // 🚀 Sprawdzamy, czy to admin
        if (userData.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("❌ Błąd: Konto nie istnieje.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-1000 ${backgroundColor}`}>
      <div className="bg-white/20 backdrop-blur-lg p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center">{isLogin ? "Logowanie" : "Rejestracja"}</h1>
        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        <form className="flex flex-col gap-4 mt-4" onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded bg-white/80 text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            className="border p-2 rounded bg-white/80 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">
            {isLogin ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </form>
        <button
          className="mt-4 text-white hover:underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}
        </button>
      </div>
    </div>
  );
}
