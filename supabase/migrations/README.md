# Migrations

Chạy các file SQL trong thư mục này qua **Supabase Dashboard → SQL Editor** nếu database của bạn thiếu cột/cấu trúc tương ứng.

- **20260203000000_add_bg_opacity_to_categories.sql**: Thêm cột `bg_opacity` vào bảng `categories`. Cuối file có `NOTIFY pgrst, 'reload schema'` để API nhận cột mới (tránh lỗi PGRST204).

**Nếu đã thêm cột mà vẫn báo PGRST204:** chạy riêng lệnh sau trong SQL Editor để reload schema cache:
```sql
NOTIFY pgrst, 'reload schema';
```
