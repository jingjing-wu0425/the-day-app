"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  supaSearchUser,
  supaSendFriendRequest,
  supaGetFriendships,
  supaAcceptFriendship,
  supaRejectFriendship,
  supaGetDayRecord,
  formatDateCN,
  getDateLabel,
} from "@/lib/store";
import { Profile, Friendship, Fragment } from "@/lib/types";

// ─── Friend List + Search + Friend Diary ────

export default function FriendList({
  onClose,
  onViewFriend,
}: {
  onClose: () => void;
  onViewFriend: (userId: string, nickname: string) => void;
}) {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchError, setSearchError] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await supaGetFriendships(user.id);
    setFriendships(data);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async () => {
    setSearchError("");
    setSearchResult(null);
    setSent(false);
    if (!/^\d{11}$/.test(searchPhone)) {
      setSearchError("请输入11位手机号");
      return;
    }
    if (searchPhone === user?.user_metadata?.phone) {
      setSearchError("不能添加自己");
      return;
    }
    setSearching(true);
    const result = await supaSearchUser(searchPhone);
    setSearching(false);
    if (!result) {
      setSearchError("未找到该用户");
    } else if (result.id === user?.id) {
      setSearchError("不能添加自己");
    } else {
      setSearchResult(result);
    }
  };

  const handleAdd = async () => {
    if (!user || !searchResult) return;
    await supaSendFriendRequest(user.id, searchResult.id);
    setSent(true);
    load();
  };

  const handleAccept = async (id: string) => {
    await supaAcceptFriendship(id);
    load();
  };

  const handleReject = async (id: string) => {
    await supaRejectFriendship(id);
    load();
  };

  const accepted = friendships.filter(
    (f) => f.status === "accepted"
  );
  const pendingIncoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === user?.id
  );
  const pendingOutgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === user?.id
  );

  const getFriendProfile = (f: Friendship): Profile | undefined => {
    if (f.requester_id === user?.id) return f.addressee_profile;
    return f.requester_profile;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
      <div className="absolute inset-0 bg-fg/10 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl card-float px-5 pt-5 pb-6 w-[360px] max-h-[80vh] overflow-y-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] text-fg/80 font-medium">好友</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted/40 hover:text-fg/60 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="搜索手机号添加好友"
              className="flex-1 bg-fg/5 rounded-lg px-3 py-2 text-[13px] text-fg/80 placeholder:text-muted/30 outline-none font-light"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-3 py-2 rounded-lg bg-fg/10 text-[12px] text-fg/60 font-light hover:bg-fg/15 transition-all"
            >
              {searching ? "..." : "搜索"}
            </button>
          </div>
          {searchError && <p className="text-red-400 text-[12px] font-light mt-1.5">{searchError}</p>}
          {searchResult && !sent && (
            <div className="mt-2 flex items-center justify-between bg-fg/[0.03] rounded-lg px-3 py-2">
              <div>
                <p className="text-[13px] text-fg/70 font-light">{searchResult.nickname}</p>
                <p className="text-[11px] text-muted/40 font-light">{searchResult.phone}</p>
              </div>
              <button onClick={handleAdd} className="px-3 py-1 rounded-full bg-fg text-white text-[12px] font-light hover:bg-fg/80 transition-all">添加</button>
            </div>
          )}
          {sent && <p className="text-[12px] text-fg/50 font-light mt-1.5">已发送请求</p>}
        </div>

        {/* Pending incoming */}
        {pendingIncoming.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-muted/40 font-light tracking-widest mb-2">好友请求</p>
            {pendingIncoming.map((f) => {
              const p = getFriendProfile(f);
              return (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-[13px] text-fg/70 font-light">{p?.nickname || "用户"}</p>
                    <p className="text-[11px] text-muted/40 font-light">{p?.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(f.id)} className="px-3 py-1 rounded-full bg-fg text-white text-[12px] font-light">接受</button>
                    <button onClick={() => handleReject(f.id)} className="px-3 py-1 rounded-full bg-fg/10 text-fg/50 text-[12px] font-light">拒绝</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending outgoing */}
        {pendingOutgoing.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-muted/40 font-light tracking-widest mb-2">等待确认</p>
            {pendingOutgoing.map((f) => {
              const p = getFriendProfile(f);
              return (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-[13px] text-fg/70 font-light">{p?.nickname || "用户"}</p>
                    <p className="text-[11px] text-muted/40 font-light">{p?.phone}</p>
                  </div>
                  <span className="text-[12px] text-muted/30 font-light">等待中</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Accepted friends */}
        {accepted.length > 0 && (
          <div>
            <p className="text-[11px] text-muted/40 font-light tracking-widest mb-2">我的好友</p>
            {accepted.map((f) => {
              const p = getFriendProfile(f);
              return (
                <button
                  key={f.id}
                  onClick={() => { if (p) onViewFriend(p.id, p.nickname); }}
                  className="w-full flex items-center justify-between py-2.5 border-b border-border/30 last:border-0 hover:bg-fg/[0.02] transition-all rounded-lg px-1"
                >
                  <div className="text-left">
                    <p className="text-[13px] text-fg/70 font-light">{p?.nickname || "用户"}</p>
                    <p className="text-[11px] text-muted/40 font-light">{p?.phone}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              );
            })}
          </div>
        )}

        {friendships.length === 0 && (
          <p className="text-[13px] text-muted/30 font-light text-center py-4">还没有好友，搜索手机号添加吧</p>
        )}
      </div>
    </div>
  );
}

// ─── Friend Diary Viewer ────────────────────

export function FriendDiary({
  userId,
  nickname,
  onBack,
}: {
  userId: string;
  nickname: string;
  onBack: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supaGetDayRecord(userId, viewDate).then((record) => {
      setFragments(record.fragments);
      setLoading(false);
    });
  }, [userId, viewDate]);

  const dateAdd = (dateStr: string, days: number) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  const label = getDateLabel(viewDate);
  const isEmpty = fragments.length === 0;

  return (
    <div className="max-w-lg mx-auto min-h-dvh bg-bg">
      <div className="px-6 pt-14 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <button onClick={onBack} className="mt-1 w-8 h-8 rounded-full flex items-center justify-center text-muted/40 hover:text-fg/70 hover:bg-fg/5 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div>
            <p className="text-xs text-muted/40 font-light tracking-widest mb-1">
              {formatDateCN(viewDate)}
              {label && <span className="text-muted/25 ml-2">{label}</span>}
            </p>
            <h1 className="font-serif text-2xl font-semibold text-fg/80 tracking-wide">
              {nickname}的日记
            </h1>
            <div className="w-8 h-px bg-fg/20 mt-3" />
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setViewDate(dateAdd(viewDate, -1))} className="w-8 h-8 rounded-full flex items-center justify-center text-muted/40 hover:text-fg/70 hover:bg-fg/5 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={() => setViewDate(dateAdd(viewDate, 1))} className="w-8 h-8 rounded-full flex items-center justify-center text-muted/40 hover:text-fg/70 hover:bg-fg/5 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-16">
            <div className="w-6 h-6 border-2 border-fg/20 border-t-fg/60 rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="mt-16 text-center">
            <p className="text-muted/30 text-[14px] font-light">这天没有记录</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
            {fragments.map((fragment) => (
              <div key={fragment.id} className="relative pl-8 pb-6 last:pb-0">
                <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full z-10 flex items-center justify-center ${
                  fragment.type === "photo" ? "bg-fg" :
                  fragment.type === "voice" ? "bg-fg/70" :
                  fragment.type === "summary" ? "bg-fg/50" :
                  "bg-bg border-2 border-border"
                }`}>
                  {fragment.type === "photo" && <div className="w-[3px] h-[3px] rounded-full bg-white" />}
                </div>
                <p className="text-[11px] text-muted/60 font-light tracking-wide mb-1">
                  {fragment.type === "summary" ? "今日总结" : fragment.timestamp}
                </p>
                {fragment.type === "text" && (
                  <p className="text-[14px] text-fg/75 font-light leading-relaxed">{fragment.content}</p>
                )}
                {fragment.type === "photo" && fragment.imageUrl && (
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mt-1">
                    <img src={fragment.imageUrl} alt="照片" className="w-full h-full object-cover" />
                  </div>
                )}
                {fragment.type === "summary" && (
                  <div className="bg-gradient-to-br from-fg/[0.04] to-fg/[0.02] rounded-xl px-4 py-3 mt-1">
                    <p className="text-[13px] text-fg/65 font-light leading-relaxed">{fragment.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
