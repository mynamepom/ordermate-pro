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
  category: "อาหารจานเดียว",
  image_url: null,
  is_available: true,
  sort_order: 0,
};

const inputClass =
  "min-h-9 w-full rounded-xsmall border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-text-weak focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

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
  const [noticeError, setNoticeError] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["menu-items"] });

  const showError = (msg: string) => {
    setNoticeError(true);
    setNotice(msg);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price: Number(form.price) || 0, sort_order: Number(form.sort_order) || 0 };
      if (editingId) await updateMenuItem(editingId, payload);
      else await createMenuItem(payload);
    },
    onSuccess: () => {
      setNoticeError(false);
      setNotice(editingId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มเมนูใหม่แล้ว");
      resetForm();
      invalidate();
    },
    onError: (e: Error) => showError(`บันทึกไม่สำเร็จ: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: () => {
      setNoticeError(false);
      setNotice("ลบเมนูแล้ว");
      invalidate();
    },
    onError: (e: Error) => showError(`ลบไม่สำเร็จ: ${e.message}`),
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
      showError(`อัปโหลดรูปไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusyImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="bg-strong text-on-strong">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-12">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-xxsmall bg-primary text-base font-medium text-primary-foreground">
              M
            </div>
            <div>
              <h1 className="text-lg font-medium leading-tight text-on-strong">Maison Aurum · หลังบ้าน</h1>
              <p className="eyebrow text-white/60">จัดการเมนูอาหาร</p>
            </div>
          </div>
          <Link
            to="/"
            className="rounded-full border border-white/40 px-6 py-2 text-sm font-medium text-on-strong transition-colors duration-200 hover:bg-white/10"
          >
            หน้ารับออร์เดอร์
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
          {/* Form */}
          <section className="rounded-lg border border-border-weak bg-card p-6 lg:sticky lg:top-8 lg:self-start">
            <h2 className="text-[1.375rem] leading-7">{editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}</h2>

            {notice && (
              <div
                className={`mt-4 rounded-xsmall p-3 text-sm text-text-strong ${
                  noticeError ? "bg-critical-surface" : "bg-ok-surface"
                }`}
              >
                <span aria-hidden className={noticeError ? "text-critical-text" : "text-ok-icon"}>
                  {noticeError ? "!" : "✓"}
                </span>{" "}
                {notice}
              </div>
            )}

            <form
              className="mt-6 space-y-4"
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

              <div className="grid grid-cols-2 gap-4">
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
                    <option key={c} value={c}>
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
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xsmall border border-border-weak bg-muted">
                    {form.image_url ? (
                      <img src={form.image_url} alt={form.name || "ตัวอย่างรูปเมนู"} className="size-full object-cover" />
                    ) : (
                      <span className="text-xs text-text-weak">ไม่มีรูป</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      id="img"
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickImage(e.target.files?.[0])}
                      className="w-full text-sm text-text-weak file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                    />
                    {busyImage && <p className="text-sm text-text-weak">กำลังประมวลผลรูป…</p>}
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: null })}
                        className="text-sm font-medium text-primary underline underline-offset-4"
                      >
                        ลบรูปนี้
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 text-base">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="size-4 accent-[var(--primary)]"
                />
                เปิดขาย (แสดงบนหน้ารับออร์เดอร์)
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending || busyImage}
                  className="h-12 flex-1 rounded-full bg-primary px-7 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-hover disabled:pointer-events-none disabled:bg-muted disabled:text-text-weak"
                >
                  {saveMutation.isPending ? "กำลังบันทึก…" : editingId ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-12 rounded-full border border-border px-7 font-medium text-foreground transition-colors duration-200 hover:bg-muted"
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
              <h2 className="text-[1.375rem] leading-7">รายการเมนูทั้งหมด</h2>
              <span className="text-sm text-text-weak">{items.length} เมนู</span>
            </div>

            {isLoading && <p className="py-12 text-center text-sm text-text-weak">กำลังโหลดเมนู…</p>}
            {error && (
              <p className="rounded-xsmall bg-critical-surface p-3 text-sm text-text-strong">
                โหลดเมนูไม่สำเร็จ: {(error as Error).message}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {items.map((m) => (
                <article
                  key={m.id}
                  className="flex gap-4 rounded-lg border border-border-weak bg-card p-6 transition-colors duration-200 hover:border-border"
                >
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xsmall border border-border-weak bg-muted">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.name} loading="lazy" className="size-full object-cover" />
                    ) : (
                      <span className="text-xs text-text-weak">ไม่มีรูป</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[1.125rem] font-medium leading-6 text-text-strong">{m.name}</p>
                    <p className="mt-1 text-sm text-text-weak">
                      {m.en || "—"} · {m.category}
                      {!m.is_available && " · ปิดขาย"}
                    </p>
                    <p className="mt-1 text-sm text-text-weak">{m.description}</p>
                    <p className="mt-2 text-sm font-medium text-primary">{thb(m.price)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col justify-center gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="h-8 rounded-full border border-border px-4 text-sm font-medium transition-colors duration-200 hover:bg-muted"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`ลบเมนู "${m.name}" ?`)) deleteMutation.mutate(m.id);
                      }}
                      className="h-8 rounded-full border border-border px-4 text-sm font-medium text-critical-text transition-colors duration-200 hover:bg-critical-surface"
                    >
                      ลบ
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {!isLoading && items.length === 0 && (
              <p className="py-12 text-center text-sm text-text-weak">ยังไม่มีเมนู — เพิ่มเมนูแรกจากฟอร์มด้านซ้าย</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
