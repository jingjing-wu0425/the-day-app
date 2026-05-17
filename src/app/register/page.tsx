"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!/^\d{11}$/.test(phone)) {
      setError("请输入11位手机号");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (!nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    setSubmitting(true);

    const { data: authData, error: authError } = await getSupabase().auth.signUp({
      email: `${phone}@theday.app`,
      password,
    });

    if (authError) {
      setSubmitting(false);
      if (authError.message.includes("already registered")) {
        setError("该手机号已注册");
      } else {
        setError("注册失败: " + authError.message);
      }
      return;
    }

    if (authData.user) {
      const { error: profileError } = await getSupabase().from("profiles").insert({
        id: authData.user.id,
        phone,
        nickname: nickname.trim(),
      });
      if (profileError) {
        setSubmitting(false);
        setError("创建资料失败: " + profileError.message);
        return;
      }
    }

    setSubmitting(false);
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-8">
      <h1 className="font-serif text-3xl font-semibold text-fg/80 tracking-wide mb-2">注册</h1>
      <p className="text-muted/40 text-[13px] font-light mb-10">创建你的日记账号</p>

      <div className="w-full max-w-xs space-y-4">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="手机号"
          className="w-full bg-fg/5 rounded-xl px-4 py-3 text-[15px] text-fg/80 placeholder:text-muted/30 outline-none font-light"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码（至少6位）"
          className="w-full bg-fg/5 rounded-xl px-4 py-3 text-[15px] text-fg/80 placeholder:text-muted/30 outline-none font-light"
        />
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称"
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          className="w-full bg-fg/5 rounded-xl px-4 py-3 text-[15px] text-fg/80 placeholder:text-muted/30 outline-none font-light"
        />
        {error && <p className="text-red-400 text-[13px] font-light text-center">{error}</p>}
        <button
          onClick={handleRegister}
          disabled={submitting}
          className="w-full bg-fg text-white rounded-xl py-3 text-[15px] font-medium hover:bg-fg/80 transition-all disabled:opacity-50"
        >
          {submitting ? "注册中..." : "注册"}
        </button>
      </div>

      <button
        onClick={() => router.push("/login")}
        className="mt-6 text-[13px] text-muted/50 font-light hover:text-fg/60 transition-colors"
      >
        已有账号？登录
      </button>
    </div>
  );
}
