# Arena Codex

Website tĩnh (HTML + CSS + JS thuần) chạy trên GitHub Pages. Toàn bộ nội dung nằm trong `data.txt`; không cần sửa `app.js`. Nhân vật mẫu chỉ là dữ liệu giả.

**Chạy thử máy bạn:** `python -m http.server 8000` rồi mở `http://localhost:8000` (mở thẳng `index.html` sẽ bị chặn).
**Đăng lên GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / `(root)`.

## Thêm / sửa / xóa nhân vật
Mỗi nhân vật là một khối `{ ... }`. Sao chép một khối để thêm, sửa chữ trong dấu `" "`, xóa cả khối để xóa. Giữa các khối có dấu `,`, khối cuối thì không.

## Mẫu một nhân vật
```
{ "id":"006", "name":"Tên", "title":"Danh hiệu", "role":"Mage", "lane":["Mid"],
  "damage":"Magic", "difficulty":"Hard", "range":"Ranged", "status":"New",
  "intro":"Một câu giới thiệu.",
  "images":{"avatar":"006.png","splash":"006-splash.jpg"},
  "stats":{"Máu":"2500 (+160/cấp)","Tốc chạy":340},
  "skills":[
    {"key":"Bị động","name":"Tên","icon":"006-p.png","desc":"Mô tả."},
    {"key":"Q","name":"Tên","icon":"006-q.png","desc":"Mô tả.","cd":"8 giây","cost":"40 năng lượng"},
    {"key":"W","name":"Tên","desc":"Mô tả."},
    {"key":"R","name":"Tên","desc":"Mô tả."}],
  "story":["# Tiêu đề phần","Đoạn văn."] }
```
- `id`: chỉ chữ, số, `_`, `-`, không trùng. `status` (New / Updated) là tùy chọn, hiện nhãn trên thẻ.
- `images`: `avatar` (ảnh dọc 3:4), `splash` hoặc `bg` (ảnh nền hồ sơ). Để ảnh cùng thư mục, tên chỉ gồm chữ, số, `_`, `-` + đuôi png/jpg/webp/gif/svg. Ảnh thiếu sẽ hiện ô chữ cái.
- `stats`: tự đặt tên chỉ số bên trái, giá trị bên phải (số hoặc chữ).
- `skills`: đúng 4 mục, mục đầu là bị động. `icon`, `cd`, `cost` là tùy chọn.
- `story`: mỗi dòng là một đoạn; dòng bắt đầu bằng `# ` là tiêu đề phần.

## Cách viết để có màu
- Số tự vàng: `30`, `30/60/90`, `10%`, `1.5s`, `2 giây`; cụm như `công vật lý`, `máu tối đa`, `giáp`, `lá chắn`, `sát thương chuẩn` cũng vàng (một màu chung).
- Nhiều loại sát thương cộng nhau thì để trong ngoặc: `(30 + 10% công vật lý + 10% công phép)`.
- Khống chế đặt trong nháy kép → xanh dương: `\"Hất tung\" 1s` (trong file viết `\"` cho dấu nháy).
- Bán kính/tầm theo bản đồ viết `(x1)`, `(x2)`… → xanh ngọc.

## Kiểm tra lỗi
Trang **Dữ liệu** liệt kê lỗi, cảnh báo và ảnh thiếu. Nếu cả trang báo JSON sai, dán `data.txt` vào jsonlint.com để tìm dấu `,` hoặc ngoặc thiếu.
