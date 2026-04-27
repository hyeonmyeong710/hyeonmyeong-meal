"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`로그인 실패: ${error.message}`);
      return;
    }

    alert("로그인 성공!");
    router.push("/manage");
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <section>
          <p className="text-sm text-neutral-500">현명한 한끼</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            관리자 로그인
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            레시피 작성과 관리는 관리자만 가능합니다
          </p>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-4 outline-none"
          />

          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-2xl bg-black px-4 py-5 text-xl font-bold text-white"
          >
            로그인
          </button>
        </section>
      </div>
    </main>
  );
}