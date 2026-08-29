import { supabase } from "@/integrations/supabase/client";

export type MenuItem = {
  id: string;
  name: string;
  en: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

export const CATEGORY_OPTIONS = [
  "อาหารจานเดียว",
  "กับข้าว",
  "ของทานเล่น",
  "ของหวาน",
  "เครื่องดื่ม",
];

export const thb = (n: number) =>
  `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const SELECT = "id,name,en,description,price,category,image_url,is_available,sort_order";

export async function fetchMenuItems(onlyAvailable = false): Promise<MenuItem[]> {
  let query = supabase.from("menu_items").select(SELECT).order("sort_order").order("created_at");
  if (onlyAvailable) query = query.eq("is_available", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) })) as MenuItem[];
}

export type MenuItemInput = Omit<MenuItem, "id">;

export async function createMenuItem(input: MenuItemInput) {
  const { error } = await supabase.from("menu_items").insert(input);
  if (error) throw error;
}

export async function updateMenuItem(id: string, input: Partial<MenuItemInput>) {
  const { error } = await supabase.from("menu_items").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

/** ย่อรูปฝั่งเบราว์เซอร์แล้วแปลงเป็น data URL (เก็บลงฐานข้อมูลได้เลย) */
export function fileToResizedDataUrl(file: File, maxSize = 800, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("ไฟล์รูปไม่ถูกต้อง"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ไม่รองรับการย่อรูป"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
