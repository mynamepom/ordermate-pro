CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update menu items" ON public.menu_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete menu items" ON public.menu_items FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.menu_items (name, en, description, price, category, sort_order) VALUES
('ผัดไทยกุ้งสด','Pad Thai','เส้นจันท์ · กุ้งสด · ถั่วงอก',130,'อาหารจานเดียว',1),
('กะเพราหมูสับไข่ดาว','Krapao Moo','พริกกะเพราสด · ไข่ดาวกรอบ',90,'อาหารจานเดียว',2),
('ข้าวมันไก่','Khao Man Gai','ไก่ต้มนุ่ม · น้ำจิ้มเต้าเจี้ยว',75,'อาหารจานเดียว',3),
('ข้าวหน้าเป็ด','Khao Naa Ped','เป็ดย่างซอสแดง · ไข่ต้ม',110,'อาหารจานเดียว',4),
('ต้มยำกุ้งน้ำข้น','Tom Yum Kung','กุ้งแม่น้ำ · เห็ดฟาง',250,'กับข้าว',5),
('แกงเขียวหวานไก่','Green Curry','กะทิสด · มะเขือเปราะ',150,'กับข้าว',6),
('ปลาทอดน้ำปลา','Fried Fish','ปลากะพงทอดกรอบ · น้ำปลาพริก',180,'กับข้าว',7),
('ไก่ทอดน้ำปลา','Crispy Chicken','ทอดกรอบ · น้ำจิ้มแจ่ว',120,'ของทานเล่น',8),
('ปอเปี๊ยะทอด','Spring Rolls','สาหร่ายทะเล · ซอสพลัม',95,'ของทานเล่น',9),
('ข้าวเหนียวมะม่วง','Mango Sticky Rice','กะทิข้น · งาทอง',100,'ของหวาน',10),
('บัวลอยมะพร้าวอ่อน','Bua Loy','กะทิอ่อน · ไข่หวาน',60,'ของหวาน',11),
('น้ำมะพร้าวเผา','Coconut Water','มะพร้าวน้ำหอมแช่เย็น',70,'เครื่องดื่ม',12),
('ชาเย็น','Thai Iced Tea','ชาไทยหอมมัน · นมข้น',55,'เครื่องดื่ม',13),
('น้ำมะนาวโซดา','Lime Soda','มะนาวสด · น้ำผึ้ง',65,'เครื่องดื่ม',14);