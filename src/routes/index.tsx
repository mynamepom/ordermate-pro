import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { fetchMenuItems, thb, type MenuItem } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison Aurum POS — ระบบรับออร์เดอร์ร้านอาหาร" },
      {
        name: "description",
        content:
          "ระบบรับออร์เดอร์สำหรับพนักงานร้านอาหาร ระบุเลขโต๊ะ เลือกเมนูจากหมวดหมู่หรือค้นหา ตรวจสอบรายการ และสรุปออร์เดอร์ได้รวดเร็ว รองรับแท็บเล็ตและคอมพิวเตอร์",
      },
      { property: "og:title", content: "Maison Aurum POS — ระบบรับออร์เดอร์ร้านอาหาร" },
      {
        property: "og:description",
        content: "รับออร์เดอร์ได้รวดเร็ว ระบุเลขโต๊ะ เลือกเมนู คำนวณยอดรวม และคอนเฟิร์มเข้าระบบ",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const ALL = "ทั้งหมด";
const TABLES = Array.from({ length: 12 }, (_, i) => i + 1);

type Cart = Record<string, number>;
type OrderStats = Record<string, number>;

const ORDER_STATS_KEY = "maison-aurum-order-stats";

const loadOrderStats = (): OrderStats => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(ORDER_STATS_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const saveOrderStats = (stats: OrderStats) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDER_STATS_KEY, JSON.stringify(stats));
};

function Index() {
  const { data: menu = [], isLoading } = useQuery({
    queryKey: ["menu-items", "available"],
    queryFn: () => fetchMenuItems(true),
  });

  const [table, setTable] = useState<number | null>(7);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [category, setCategory] = useState(ALL);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [confirmed, setConfirmed] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const [orderStats, setOrderStats] = useState<OrderStats>({});

  useEffect(() => {
    setOrderStats(loadOrderStats());
  }, []);

  const categories = useMemo(() => [ALL, ...Array.from(new Set(menu.map((m) => m.category)))], [menu]);

  const topMenus = useMemo(
    () =>
      Object.entries(orderStats)
        .map(([id, qty]) => ({ item: menu.find((m) => m.id === id), qty }))
        .filter((x): x is { item: MenuItem; qty: number } => !!x.item && x.qty > 0)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 3),
    [orderStats, menu],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter(
      (m) =>
        (category === ALL || m.category === category) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.en.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)),
    );
  }, [category, search, menu]);

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: menu.find((m) => m.id === id), qty }))
        .filter((x): x is { item: MenuItem; qty: number } => !!x.item),
    [cart, menu],
  );

  const subtotal = items.reduce((s, x) => s + x.item.price * x.qty, 0);
  const vat = subtotal * 0.07;
  const total = subtotal + vat;
  const itemCount = items.reduce((s, x) => s + x.qty, 0);

  const add = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setPopKey((k) => k + 1);
    setConfirmed(null);
  };
  const dec = (id: string) =>
    setCart((c) => {
      const n = { ...c };
      const q = (n[id] ?? 0) - 1;
      if (q <= 0) delete n[id];
      else n[id] = q;
      return n;
    });
  const inc = add;

  const confirm = () => {
    if (!table || items.length === 0) return;
    setConfirmed(table);
    setCart({});
    setOrderStats((prev) => {
      const next = { ...prev };
      for (const { item, qty } of items) next[item.id] = (next[item.id] ?? 0) + qty;
      saveOrderStats(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      {/* Dark band header */}
      <header className="bg-strong text-on-strong">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-12">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center rounded-xxsmall bg-primary text-base font-medium text-primary-foreground">
              M
            </div>
            <div>
              <p className="text-lg font-medium leading-tight text-on-strong">Maison Aurum</p>
              <p className="eyebrow text-white/60">ระบบรับออร์เดอร์</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="hidden rounded-full border border-white/40 px-6 py-2 text-sm font-medium text-on-strong transition-colors duration-200 hover:bg-white/10 sm:block"
            >
              จัดการเมนู
            </Link>

            {/* Table selector */}
            <div className="relative">
              <button
                onClick={() => setTablePickerOpen((o) => !o)}
                className="flex items-center gap-3 rounded-full border border-white/40 px-6 py-2 text-sm font-medium text-on-strong transition-colors duration-200 hover:bg-white/10"
                aria-label="เลือกเลขโต๊ะ"
              >
                <span className="text-white/60">โต๊ะ</span>
                <span className="text-lg leading-none">{table ? String(table).padStart(2, "0") : "—"}</span>
                <span className="text-white/60">เปลี่ยน</span>
              </button>
              {tablePickerOpen && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-border-weak bg-card p-4 text-foreground">
                  <p className="mb-3 text-sm font-medium text-text-strong">เลือกเลขโต๊ะ</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TABLES.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTable(t);
                          setTablePickerOpen(false);
                        }}
                        className={`grid h-10 place-items-center rounded-xsmall border text-sm transition-colors duration-200 ${
                          table === t
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border-weak hover:border-border hover:bg-muted"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
          {/* LEFT: menu */}
          <section className="flex min-w-0 flex-col">
            {topMenus.length > 0 && (
              <div className="mb-8">
                <p className="eyebrow mb-3 text-text-weak">เมนูขายดี 3 อันดับแรก</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {topMenus.map(({ item, qty }, i) => (
                    <button
                      key={item.id}
                      onClick={() => add(item.id)}
                      className="flex items-start gap-3 rounded-lg border border-border-weak bg-card p-6 text-left transition-colors duration-200 hover:border-border"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ok-surface text-sm font-medium text-ok-icon">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[1.125rem] font-medium leading-6 text-text-strong">{item.name}</p>
                        <p className="mt-1 text-sm text-text-weak">สั่งแล้ว {qty} ที่</p>
                        <p className="mt-2 text-sm font-medium text-primary">{thb(item.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <label className="sr-only" htmlFor="menu-search">
                  ค้นหาเมนู
                </label>
                <input
                  id="menu-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาเมนู เช่น ผัดไทย, ต้มยำ…"
                  className="min-h-9 w-full rounded-xsmall border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-text-weak focus:outline-none"
                />
              </div>
              <span className="whitespace-nowrap text-sm text-text-weak">
                {menu.length} เมนู · {Math.max(categories.length - 1, 0)} หมวดหมู่
              </span>
            </div>

            <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`h-9 whitespace-nowrap rounded-full border px-6 text-sm font-medium transition-colors duration-200 ${
                    category === c
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => {
                const qty = cart[m.id] ?? 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => add(m.id)}
                    className="group flex min-h-[110px] items-start justify-between gap-4 rounded-lg border border-border-weak bg-card p-6 text-left transition-colors duration-200 hover:border-border"
                  >
                    <div className="flex min-w-0 gap-4">
                      {m.image_url && (
                        <img
                          src={m.image_url}
                          alt={m.name}
                          loading="lazy"
                          className="size-16 shrink-0 rounded-xsmall border border-border-weak object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-[1.125rem] font-medium leading-6 text-text-strong transition-colors duration-200 group-hover:text-primary">
                          {m.name}
                        </p>
                        <p className="mt-1 text-sm text-text-weak">{m.description}</p>
                        <p className="mt-2 text-sm font-medium text-primary">{thb(m.price)}</p>
                      </div>
                    </div>
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full border text-base leading-none transition-colors duration-200 ${
                        qty > 0
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border text-foreground"
                      }`}
                    >
                      {qty > 0 ? qty : "+"}
                    </span>
                  </button>
                );
              })}
              {isLoading && <p className="col-span-full py-12 text-center text-sm text-text-weak">กำลังโหลดเมนู…</p>}
              {!isLoading && filtered.length === 0 && (
                <p className="col-span-full py-12 text-center text-sm text-text-weak">ไม่พบเมนูที่ค้นหา</p>
              )}
            </div>
          </section>

          {/* RIGHT: order summary */}
          <aside className="flex flex-col rounded-lg border border-border-weak bg-card p-6 lg:sticky lg:top-8 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-[1.375rem] leading-7">สรุปออร์เดอร์</h2>
              <span className="text-sm text-text-weak">
                โต๊ะ {table ? String(table).padStart(2, "0") : "—"}
              </span>
            </div>

            {confirmed !== null && (
              <div className="mt-4 flex items-start gap-2 rounded-xsmall bg-ok-surface p-3 text-sm text-text-strong">
                <span aria-hidden className="text-ok-icon">
                  ✓
                </span>
                <span>ส่งออร์เดอร์โต๊ะ {String(confirmed).padStart(2, "0")} เข้าครัวเรียบร้อยแล้ว</span>
              </div>
            )}

            <div className="mt-6 max-h-[340px] flex-1 space-y-4 overflow-y-auto">
              {items.length === 0 && (
                <p className="py-8 text-center text-sm text-text-weak">
                  ยังไม่มีรายการ — แตะเมนูด้านซ้ายเพื่อเพิ่มรายการ
                </p>
              )}
              {items.map(({ item, qty }) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-medium leading-6 text-text-strong">{item.name}</p>
                    <p className="mt-1 text-sm text-text-weak">
                      {thb(item.price)} × {qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(item.id)}
                        aria-label="ลดจำนวน"
                        className="grid size-7 place-items-center rounded-full border border-border text-sm leading-none transition-colors duration-200 hover:bg-muted"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{qty}</span>
                      <button
                        onClick={() => inc(item.id)}
                        aria-label="เพิ่มจำนวน"
                        className="grid size-7 place-items-center rounded-full border border-border text-sm leading-none transition-colors duration-200 hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm">{thb(item.price * qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-border-weak pt-6 text-sm">
              <div className="flex justify-between text-text-weak">
                <span>ยอดรวม</span>
                <span>{thb(subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-weak">
                <span>ภาษี 7%</span>
                <span>{thb(vat)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <span className="font-medium text-text-strong">รวมทั้งหมด</span>
                <span key={popKey} className="animate-ticket-pop text-[2rem] font-medium leading-10 text-text-strong">
                  {thb(total)}
                </span>
              </div>
            </div>

            <button
              onClick={confirm}
              disabled={!table || items.length === 0}
              className="mt-6 h-12 w-full rounded-full bg-primary px-7 font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-hover disabled:pointer-events-none disabled:bg-muted disabled:text-text-weak"
            >
              สรุปออร์เดอร์ {itemCount > 0 ? `· ${itemCount} รายการ` : ""}
            </button>
            <p className="mt-3 text-center text-xs text-text-weak">
              {table ? `ส่งเข้าครัว · โต๊ะ ${String(table).padStart(2, "0")}` : "กรุณาเลือกเลขโต๊ะก่อนยืนยัน"}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
