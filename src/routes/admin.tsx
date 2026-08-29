import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CATEGORY_OPTIONS,
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  fileToResizedDataUrl,
  thb,
  updateMenuItem,
  type MenuItem,
  type MenuItemInput,
} from "@/lib/menu";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "หลังบ้านจัดการเมนู — Maison Aurum POS" },
      {
        name: "description",
        content:
          "หน้าหลังบ้านสำหรับผู้ดูแลร้าน เพิ่ม แก้ไข และลบเมนูอาหาร พร้อมรูปภาพ ราคา หมวดหมู่ และสถานะเปิดขาย",
      },
      { property: "og:title", content: "หลังบ้านจัดการเมนู — Maison Aurum POS" },
      {
        property: "og:description",
        content: "จัดการรายการเมนูของร้าน เพิ่ม แก้ไข ลบ พร้อมอัปโหลดรูปภาพเมนู",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const EMPTY: MenuItemInput = {
  name: "",
  en: "",
  description: "",
  price: 0,
  category: CATEGORY_OPTIONS[0],
  image_url: null,
  is_available: true,
  sort_order: 0,
};

const inputClass =
  "w-full rounded-xl border border-gold/25 bg-ink3/50 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-gold/60 focus:outline-none";
const labelClass = "mb-1.5 block text-[10px] uppercase tracking-[0.3em] text-cream/40";

function AdminPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["menu-items", "all"],
    queryFn: () => fetchMenuItems(false),
  });

  const [form, setForm] = useState<MenuItemInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyImage, setBusyImage] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["menu-items"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price: Number(form.price) || 0, sort_order: Number(form.sort_order) || 0 };
      if (editingId) await updateMenuItem(editingId, payload);
      else await createMenuItem(payload);
    },
    onSuccess: () => {
      setNotice(editingId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มเมนูใหม่แล้ว");
      resetForm();
      invalidate();
    },
    onError: (e: Error) => setNotice(`ผิดพลาด: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      setNotice("ลบเมนูแล้ว");
      invalidate();
    },
    onError: (e: Error) => setNotice(`ผิดพลาด: ${e.message}`),
  });

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (m: MenuItem) => {
    setEditingId(m.id);
    setNotice(null);
    setForm({
      name: m.name,
      en: m.en,
      description: m.description,
      price: m.price,
      category: m.category,
      image_url: m.image_url,
      is_available: m.is_available,
      sort_order: m.sort_order,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setBusyImage(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((f) => ({ ...f, image_url: dataUrl }));
    } catch (e) {
      setNotice(`อัปโหลดรูปไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusyImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink font-body text-cream antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 pb-5">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-full border border-gold/50 font-display text-xl text-gold">
              M
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none tracking-wide text-cream">
                Maison Aurum · หลังบ้าน
              </h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-gold/70">จัดการเมนูอาหาร</p>
            </div>
          </div>
          <Link
            to="/"
            className="rounded-full border border-gold/30 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-cream/70 transition-colors hover:border-gold/60 hover:text-cream"
          >
            ← หน้ารับออร์เดอร์
          </Link>
        </header>

        <div className="mt-5 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
          {/* Form */}
          <section className="rounded-2xl border border-gold/20 bg-ink2 p-6 lg:sticky lg:top-5 lg:self-start">
            <h2 className="font-display text-2xl text-cream">
              {editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
            </h2>

            {notice && (
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-center text-sm text-goldsoft">
                {notice}
              </div>
            )}

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setNotice(null);
                saveMutation.mutate();
              }}
            >
              <div>
                <label className={labelClass} htmlFor="name">
                  ชื่อเมนู (ไทย)
                </label>
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ผัดไทยกุ้งสด"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="en">
                  ชื่อภาษาอังกฤษ
                </label>
                <input
                  id="en"
                  value={form.en}
                  onChange={(e) => setForm({ ...form, en: e.target.value })}
                  placeholder="Pad Thai"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="desc">
                  รายละเอียด
                </label>
                <input
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="เส้นจันท์ · กุ้งสด · ถั่วงอก"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="price">
                    ราคา (บาท)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    step="1"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="sort">
                    ลำดับแสดงผล
                  </label>
                  <input
                    id="sort"
                    type="number"
                    step="1"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="cat">
                  หมวดหมู่
                </label>
                <select
                  id="cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-ink2">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="img">
                  รูปภาพเมนู
                </label>
                <div className="flex items-center gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-gold/25 bg-ink3/50">
                    {form.image_url ? (
                      <img src={form.image_url} alt={form.name || "ตัวอย่างรูปเมนู"} className="size-full object-cover" />
                    ) : (
                      <span className="text-xs text-cream/30">ไม่มีรูป</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      id="img"
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickImage(e.target.files?.[0])}
                      className="w-full text-xs text-cream/60 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-xs file:text-ink"
                    />
                    {busyImage && <p className="text-xs text-gold/70">กำลังประมวลผลรูป…</p>}
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: null })}
                        className="text-xs text-cream/40 underline underline-offset-4 hover:text-cream"
                      >
                        ลบรูปนี้
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-cream/70">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="size-4 accent-[var(--gold)]"
                />
                เปิดขาย (แสดงบนหน้ารับออร์เดอร์)
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending || busyImage}
                  className="flex-1 rounded-full bg-gold py-3.5 font-semibold tracking-wide text-ink transition-colors hover:bg-goldsoft disabled:opacity-40"
                >
                  {saveMutation.isPending ? "กำลังบันทึก…" : editingId ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-gold/30 px-5 py-3.5 text-sm text-cream/70 hover:text-cream"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* List */}
          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-cream">รายการเมนูทั้งหมด</h2>
              <span className="text-xs text-cream/40">{items.length} เมนู</span>
            </div>

            {isLoading && <p className="py-10 text-center text-sm text-cream/40">กำลังโหลดเมนู…</p>}
            {error && (
              <p className="py-10 text-center text-sm text-destructive">
                โหลดเมนูไม่สำเร็จ: {(error as Error).message}
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {items.map((m) => (
                <article
                  key={m.id}
                  className={`flex gap-4 rounded-xl border border-gold/15 bg-ink2 p-4 ${
                    m.is_available ? "" : "opacity-55"
                  }`}
                >
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-gold/20 bg-ink3/50">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.name} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-cream/30">ไม่มีรูป</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl leading-tight text-cream">{m.name}</p>
                    <p className="mt-0.5 text-xs text-cream/40">
                      {m.en || "—"} · {m.category}
                      {!m.is_available && " · ปิดขาย"}
                    </p>
                    <p className="mt-1 text-xs text-cream/40">{m.description}</p>
                    <p className="mt-1.5 text-sm text-goldsoft">{thb(m.price)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col justify-center gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="rounded-full border border-gold/40 px-4 py-1.5 text-xs text-gold transition-colors hover:bg-gold hover:text-ink"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`ลบเมนู "${m.name}" ?`)) deleteMutation.mutate(m.id);
                      }}
                      className="rounded-full border border-destructive/50 px-4 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive hover:text-cream"
                    >
                      ลบ
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {!isLoading && items.length === 0 && (
              <p className="py-10 text-center text-sm text-cream/40">ยังไม่มีเมนู — เพิ่มเมนูแรกจากฟอร์มด้านซ้าย</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
