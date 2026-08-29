import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

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

type MenuItem = {
  id: string;
  name: string;
  en: string;
  desc: string;
  price: number;
  category: string;
};

const CATEGORIES = ["ทั้งหมด", "อาหารจานเดียว", "กับข้าว", "ของทานเล่น", "ของหวาน", "เครื่องดื่ม"];

const MENU: MenuItem[] = [
  { id: "m1", name: "ผัดไทยกุ้งสด", en: "Pad Thai", desc: "เส้นจันท์ · กุ้งสด · ถั่วงอก", price: 130, category: "อาหารจานเดียว" },
  { id: "m2", name: "กะเพราหมูสับไข่ดาว", en: "Krapao Moo", desc: "พริกกะเพราสด · ไข่ดาวกรอบ", price: 90, category: "อาหารจานเดียว" },
  { id: "m3", name: "ข้าวมันไก่", en: "Khao Man Gai", desc: "ไก่ต้มนุ่ม · น้ำจิ้มเต้าเจี้ยว", price: 75, category: "อาหารจานเดียว" },
  { id: "m4", name: "ข้าวหน้าเป็ด", en: "Khao Naa Ped", desc: "เป็ดย่างซอสแดง · ไข่ต้ม", price: 110, category: "อาหารจานเดียว" },
  { id: "m5", name: "ต้มยำกุ้งน้ำข้น", en: "Tom Yum Kung", desc: "กุ้งแม่น้ำ · เห็ดฟาง", price: 250, category: "กับข้าว" },
  { id: "m6", name: "แกงเขียวหวานไก่", en: "Green Curry", desc: "กะทิสด · มะเขือเปราะ", price: 150, category: "กับข้าว" },
  { id: "m7", name: "ปลาทอดน้ำปลา", en: "Fried Fish", desc: "ปลากะพงทอดกรอบ · น้ำปลาพริก", price: 180, category: "กับข้าว" },
  { id: "m8", name: "ไก่ทอดน้ำปลา", en: "Crispy Chicken", desc: "ทอดกรอบ · น้ำจิ้มแจ่ว", price: 120, category: "ของทานเล่น" },
  { id: "m9", name: "ปอเปี๊ยะทอด", en: "Spring Rolls", desc: "สาหร่ายทะเล · ซอสพลัม", price: 95, category: "ของทานเล่น" },
  { id: "m10", name: "ข้าวเหนียวมะม่วง", en: "Mango Sticky Rice", desc: "กะทิข้น · งาทอง", price: 100, category: "ของหวาน" },
  { id: "m11", name: "บัวลอยมะพร้าวอ่อน", en: "Bua Loy", desc: "กะทิอ่อน · ไข่หวาน", price: 60, category: "ของหวาน" },
  { id: "m12", name: "น้ำมะพร้าวเผา", en: "Coconut Water", desc: "มะพร้าวน้ำหอมแช่เย็น", price: 70, category: "เครื่องดื่ม" },
  { id: "m13", name: "ชาเย็น", en: "Thai Iced Tea", desc: "ชาไทยหอมมัน · นมข้น", price: 55, category: "เครื่องดื่ม" },
  { id: "m14", name: "น้ำมะนาวโซดา", en: "Lime Soda", desc: "มะนาวสด · น้ำผึ้ง", price: 65, category: "เครื่องดื่ม" },
];

const TABLES = Array.from({ length: 12 }, (_, i) => i + 1);

const thb = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

type Cart = Record<string, number>;

function Index() {
  const [table, setTable] = useState<number | null>(7);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [category, setCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [confirmed, setConfirmed] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MENU.filter(
      (m) =>
        (category === "ทั้งหมด" || m.category === category) &&
        (!q || m.name.toLowerCase().includes(q) || m.en.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)),
    );
  }, [category, search]);

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: MENU.find((m) => m.id === id)!, qty }))
        .filter((x) => x.item),
    [cart],
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
  };

  return (
    <div className="min-h-screen bg-ink font-body text-cream antialiased">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gold/20 pb-5">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-full border border-gold/50 font-display text-xl text-gold">
              M
            </div>
            <div>
              <p className="font-display text-2xl leading-none tracking-wide text-cream">Maison Aurum</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-gold/70">ระบบรับออร์เดอร์</p>
            </div>
          </div>

          {/* Table selector */}
          <div className="relative">
            <button
              onClick={() => setTablePickerOpen((o) => !o)}
              className="flex items-center gap-3 rounded-full border border-gold/30 bg-ink2 px-4 py-2 transition-colors hover:border-gold/60"
              aria-label="เลือกเลขโต๊ะ"
            >
              <span className="text-[10px] uppercase tracking-[0.3em] text-cream/40">โต๊ะ</span>
              <span className="font-display text-2xl leading-none text-goldsoft">
                {table ? String(table).padStart(2, "0") : "—"}
              </span>
              <span className="text-xs text-cream/40">เปลี่ยน</span>
            </button>
            {tablePickerOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-gold/25 bg-ink2 p-3 shadow-2xl">
                <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.3em] text-cream/40">เลือกเลขโต๊ะ</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {TABLES.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTable(t);
                        setTablePickerOpen(false);
                      }}
                      className={`grid h-11 place-items-center rounded-lg font-display text-lg transition-colors ${
                        table === t
                          ? "bg-gold text-ink"
                          : "bg-ink3/60 text-cream/70 hover:bg-ink3 hover:text-cream"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="mt-5 grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* LEFT: menu */}
          <section className="flex min-w-0 flex-col">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาเมนู เช่น ผัดไทย, ต้มยำ…"
                  className="w-full rounded-full border border-gold/20 bg-ink2 py-3 pl-10 pr-4 text-sm text-cream placeholder:text-cream/30 focus:border-gold/60 focus:outline-none"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gold/50">⌕</span>
              </div>
              <span className="whitespace-nowrap text-xs text-cream/40">
                {MENU.length} เมนู · {CATEGORIES.length - 1} หมวดหมู่
              </span>
            </div>

            <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors ${
                    category === c
                      ? "bg-gold font-medium text-ink"
                      : "border border-gold/30 text-cream/70 hover:text-cream"
                  }`}
                >
                  {c}
                </button>
              ))}
            </nav>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => {
                const qty = cart[m.id] ?? 0;
                return (
                  <button
                    key={m.id}
                    onClick={() => add(m.id)}
                    className="flex min-h-[110px] items-start justify-between gap-3 rounded-xl border border-gold/15 bg-ink2 p-4 text-left transition-colors hover:border-gold/40 active:scale-[0.98]"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-xl leading-tight text-cream">{m.name}</p>
                      <p className="mt-1 text-xs text-cream/40">{m.desc}</p>
                      <p className="mt-2 text-sm text-goldsoft">{thb(m.price)}</p>
                    </div>
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full border border-gold/40 text-lg leading-none text-gold ${
                        qty > 0 ? "bg-gold text-ink" : ""
                      }`}
                    >
                      {qty > 0 ? qty : "+"}
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-cream/40">ไม่พบเมนูที่ค้นหา</p>
              )}
            </div>
          </section>

          {/* RIGHT: order summary */}
          <aside className="flex flex-col rounded-2xl border border-gold/20 bg-ink2 p-6 lg:sticky lg:top-5 lg:self-start">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-cream">สรุปออร์เดอร์</h2>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold/70">
                โต๊ะ {table ? String(table).padStart(2, "0") : "—"}
              </span>
            </div>

            {confirmed !== null && (
              <div className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-center text-sm text-goldsoft">
                ✓ ส่งออร์เดอร์โต๊ะ {String(confirmed).padStart(2, "0")} เข้าครัวเรียบร้อยแล้ว
              </div>
            )}

            <div className="mt-5 max-h-[340px] flex-1 space-y-4 overflow-y-auto">
              {items.length === 0 && (
                <p className="py-8 text-center text-sm text-cream/40">
                  ยังไม่มีรายการ — แตะเมนูด้านซ้ายเพื่อเพิ่มรายการ
                </p>
              )}
              {items.map(({ item, qty }) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight text-cream">{item.name}</p>
                    <p className="mt-1 text-xs text-cream/40">
                      {thb(item.price)} × {qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(item.id)}
                        aria-label="ลดจำนวน"
                        className="grid size-8 place-items-center rounded-full border border-gold/30 text-sm leading-none text-cream/60 transition-colors hover:border-gold hover:text-cream"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm text-cream">{qty}</span>
                      <button
                        onClick={() => inc(item.id)}
                        aria-label="เพิ่มจำนวน"
                        className="grid size-8 place-items-center rounded-full border border-gold/30 text-sm leading-none text-cream/60 transition-colors hover:border-gold hover:text-cream"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm text-goldsoft">{thb(item.price * qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-gold/15 pt-5 text-sm">
              <div className="flex justify-between text-cream/50">
                <span>ยอดรวม</span>
                <span>{thb(subtotal)}</span>
              </div>
              <div className="flex justify-between text-cream/50">
                <span>ภาษี 7%</span>
                <span>{thb(vat)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-cream/70">รวมทั้งหมด</span>
                <span key={popKey} className="animate-ticket-pop font-display text-3xl text-goldsoft">
                  {thb(total)}
                </span>
              </div>
            </div>

            <button
              onClick={confirm}
              disabled={!table || items.length === 0}
              className="mt-6 w-full rounded-full bg-gold py-4 font-semibold tracking-wide text-ink transition-colors hover:bg-goldsoft disabled:cursor-not-allowed disabled:opacity-40"
            >
              สรุปออร์เดอร์ {itemCount > 0 ? `· ${itemCount} รายการ` : ""}
            </button>
            <p className="mt-3 text-center text-[11px] text-cream/30">
              {table ? `ส่งเข้าครัว · โต๊ะ ${String(table).padStart(2, "0")}` : "กรุณาเลือกเลขโต๊ะก่อนยืนยัน"}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
