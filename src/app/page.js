"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const tips = [
    'Pamiętaj o odblaskach – zwiększ swoją widoczność.',
    'Sprawdzaj ciśnienie w oponach przed trasą.',
    'Utrzymuj bezpieczny odstęp od innych pojazdów.',
    'Unikaj rozproszeń – odłóż telefon.',
  ];
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Rotate tips with fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % tips.length);
        setFade(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          role: "user",
          isBlocked: false,
          blockUntil: null,
          assignedCourses: [],
          completedCourses: [],
        });
      }
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        setError("❌ Błąd: Konto nie istnieje.");
        return;
      }
      const data = userDoc.data();
      if (data.isBlocked) {
        setError("❌ Twoje konto jest zablokowane. Skontaktuj się z administratorem.");
        return;
      }
      if (data.blockUntil && data.blockUntil.toMillis() > Date.now()) {
        setError(
          `❌ Twoje konto jest zablokowane do ${new Date(
            data.blockUntil.toMillis()
          ).toLocaleString()}`
        );
        return;
      }
      router.push(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background image */}
      <img
        src="/images/road.jpg"
        alt="Droga o świcie"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="z-10 flex flex-col items-center w-full max-w-sm px-6 py-8">
        {/* Porada dnia above card */}
        <div
          className={`mb-8 w-full bg-white rounded-full px-6 py-2 shadow transition-opacity duration-500 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-gray-800 font-serif text-center text-lg">
            {tips[tipIndex]}
          </p>
        </div>

        {/* Auth card */}
        <div className="flex flex-col items-center w-full bg-white/30 backdrop-blur-md rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">
            {isLogin ? "Logowanie" : "Rejestracja"}
          </h1>

          {error && (
            <p className="text-red-500 mb-4 text-center text-sm">{error}</p>
          )}

          <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
            <div className="border border-white rounded-lg px-4 py-3 bg-white/30">
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent focus:outline-none text-white placeholder-white"
              />
            </div>

            <div className="border border-white rounded-lg px-4 py-3 bg-white/30">
              <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent focus:outline-none text-white placeholder-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-blue-600 font-semibold py-3 rounded-lg shadow-md"
            >
              {isLogin ? "Zaloguj się" : "Zarejestruj się"}
            </button>
          </form>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="mt-6 text-white text-sm hover:underline"
          >
            {isLogin ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}
          </button>
        </div>
      </div>
    </div>
  );
}