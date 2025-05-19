"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async user => {
      if (!user) {
        router.replace("/");
        return;
      }
      // sprawdź rolę z Firestore
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data?.role !== "admin") {
        router.replace("/");
      }
    });
    return () => unsub();
  }, [router]);

  return <>{children}</>;
}
