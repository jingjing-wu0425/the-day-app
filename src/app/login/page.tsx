"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!/^\d{11}$/.test(phone)) {
      setError("请输入11位手机号");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    setSubmitting(true);
    const { error } = await getSupabase().auth.signInWithPassword({
      email: `${phone}@theday.app`,
      password,
    });
    setSubmitting(false);
    if (error) {
      setError("手机号或密码错误");
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-8">
      <h1 className="font-serif text-3xl font-semibold text-fg/80 tracking-wide mb-2">那一天</h1>
      <p className="text-muted/40 text-[13px] font-light mb-10">记录每一天</p>

      <div className="w-full max-w-xs space-y-4">
        <div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="手机号"
            className="w-full bg-fg/5 rounded-xl px-4 py-3 text-[15px] text-fg/80 placeholder:text-muted/30 outline-none font-light"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-fg/5 rounded-xl px-4 py-3 text-[15px] text-fg/80 placeholder:text-muted/30 outline-none font-light"
          />
        </div>
        {error && <p className="text-red-400 text-[13px] font-light text-center">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={submitting}
          className="w-full bg-fg text-white rounded-xl py-3 text-[15px] font-medium hover:bg-fg/80 transition-all disabled:opacity-50"
        >
          {submitting ? "登录中..." : "登录"}
        </button>
      </div>

      <button
        onClick={() => router.push("/register")}
        className="mt-6 text-[13px] text-muted/50 font-light hover:text-fg/60 transition-colors"
      >
        没有账号？注册
      </button>
    </div>
  );
}
