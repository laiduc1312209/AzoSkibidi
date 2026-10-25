# 🚀 Azoskibidi - Trợ Lý Tự Động Hóa Quản Lý & Giải Đề Thi Azota

> **Azoskibidi** là công cụ trợ lý học tập thông minh chạy trên nền tảng **Playwright MCP** (Model Context Protocol), giúp tự động hóa toàn diện quá trình theo dõi, quản lý, trích xuất và hỗ trợ giải các bài kiểm tra/đề thi trực tuyến trên nền tảng học tập **Azota**.

---

## 🌟 Tính Năng Nổi Bật

- 🔐 **Tự động đăng nhập & Duy trì phiên:** Tự động đọc cấu hình tài khoản từ `config.txt` và lưu giữ phiên làm việc lâu dài qua trình duyệt Playwright, không bị đăng xuất phiền toái.
- 📋 **Quét & Phân loại đề thi thông minh:** Tự động tìm kiếm toàn bộ các đề thi/bài tập còn hạn, chưa hoàn thành ("Chưa thi") trong lớp học và sắp xếp theo số thứ tự (STT) rõ ràng.
- ⚡ **Hỗ trợ chọn & làm đa đề song song:** Cho phép người dùng chọn 1 hoặc nhiều đề thi cùng lúc theo STT. Hệ thống xử lý song song trên nhiều tab mà không lo xung đột phiên.
- 🧠 **Tự động trích xuất & Giải đề chính xác:** Nhận diện và giải đáp đầy đủ các dạng bài thi trắc nghiệm theo chương trình giáo dục mới:
  - Trắc nghiệm 4 phương án lựa chọn ($A, B, C, D$).
  - Trắc nghiệm lựa chọn Đúng / Sai (các ý $a, b, c, d$ phân tích theo đoạn tư liệu).
- 🖱️ **Tự động điền đáp án trực tiếp:** Tự động click chọn các đáp án đã giải trên giao diện bài thi của Azota.
- 🛡️ **Tự động xử lý bài thi "Giám Sát" (Anti-Proctoring):** Tự động đóng popup thông báo giám sát và vô hiệu hóa triệt để các event listener theo dõi chuyển tab, mất focus, rời màn hình (`visibilitychange`, `blur`, `mouseleave`), đảm bảo không bị Azota ghi nhận số lần chuyển tab.
- 🔒 **An toàn tuyệt đối:** Bot **KHÔNG** tự ý bấm nút *"Nộp bài"*, học sinh luôn có quyền kiểm tra, rà soát lại toàn bộ câu trả lời trước khi chính thức nộp.
- 🧹 **Tự động dọn dẹp sạch sẽ & Tối ưu tốc độ:** Tự động dọn sạch các file đề bài và đáp án tạm thời trong thư mục `DEBAI/`. Hoàn toàn không chụp ảnh màn hình thừa, giúp tiết kiệm dung lượng và đẩy tốc độ xử lý lên cao nhất.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
Azoskibidi/
├── .gitignore                 # Bỏ qua các file nhạy cảm và token khi upload Git
├── config.example.txt         # File mẫu cấu hình đăng nhập
├── config.txt                 # File tài khoản & mật khẩu cá nhân (tự tạo từ file mẫu)
├── storage_state.json         # Cookie & Session phiên làm việc của trình duyệt
├── azota_localstorage.json    # LocalStorage sao lưu thông tin tài khoản
├── azota_selectors.json       # Bảng quy chuẩn Selectors & Snippets JSON giúp Agent tăng tốc
├── azota_structure.md         # Sổ tay kiến trúc DOM & Code thực thi siêu tốc cho AI Agent
├── README.md                  # Hướng dẫn sử dụng cho người dùng & cộng đồng
├── agent.md                   # Tài liệu quy chuẩn kỹ thuật dành cho AI Agent
└── DEBAI/                     # Thư mục tạm chứa đề bài (tự động xóa sau khi làm xong)
```

---

## 🛠️ Yêu Cầu Cài Đặt (Prerequisites)

1. **Môi trường:**
   - Đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18+ hoặc 22+ LTS).
   - Trình soạn thảo/Môi trường AI Agent: [Antigravity IDE](https://antigravity.google) (hoặc các AI Assistant hỗ trợ MCP như Cursor, Claude Desktop, OpenCode).

2. **Cài đặt Playwright MCP:**
   Mở Terminal hoặc PowerShell trên máy tính và chạy lệnh:
   ```bash
   npm install -g @playwright/mcp
   ```

3. **Cấu hình MCP (`mcp_config.json`):**
   Đảm bảo MCP Server `playwright` đã được khai báo trong cấu hình MCP của môi trường (ví dụ `~/.gemini/config/mcp_config.json`):
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "node",
         "args": [
           "C:/Users/<Username>/AppData/Roaming/npm/node_modules/@playwright/mcp/cli.js",
           "--user-data-dir", "C:/Users/<Username>/.mcp/playwright-profile",
           "--allow-unrestricted-file-access"
         ]
       }
     }
   }
   ```

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh

### Bước 1: Cấu hình thông tin tài khoản
Tạo một bản sao từ file `config.example.txt` và đổi tên thành `config.txt`:
```bash
copy config.example.txt config.txt
```
Mở file `config.txt` và điền đúng 3 dòng thông tin của bạn:
```text
https://thptninhgiang.azota.vn/
<ten_tai_khoan_hoac_sdt>
<mat_khau_tai_khoan>
```
*(Thay thế URL trên bằng địa chỉ trang Azota trường học của bạn nếu cần).*

### Bước 2: Chạy lệnh bắt đầu
Trong cửa sổ chat của AI Agent (Antigravity IDE), bạn chỉ cần gõ:
```text
start
```

### Bước 3: Chọn đề thi muốn làm
Hệ thống sẽ tự động đăng nhập, quét lớp học và gửi lại bảng danh sách đề thi chưa làm đánh số thứ tự (STT):
```text
Danh sách đề thi chưa làm:
1. BÀI 3.docx (Đang mở)
2. BÀI 4.docx (Đang mở)
3. BÀI 5.docx (Đang mở)
...
```
Bạn chỉ cần nhắn lại số thứ tự đề bạn muốn làm:
- Nhập `1` nếu chỉ muốn làm đề số 1.
- Nhập `1, 2` nếu muốn làm đồng thời cả đề 1 và đề 2.
- Nhập `all` nếu muốn làm tất cả các đề còn hạn.

### Bước 4: Kiểm tra & Nộp bài
- Bot sẽ mở đề, trích xuất nội dung, suy luận đáp án chính xác và tự động tick chọn trên giao diện Azota siêu tốc trong ~30ms.
- Sau khi điền xong, bot sẽ tự động xóa sạch dữ liệu tạm trong `DEBAI/`.
- Bạn vào trình duyệt kiểm tra lại bài thi và bấm **Nộp bài**.

---

## 🔒 Lưu Ý Bảo Mật & Đóng Góp

- **Bảo mật tài khoản:** Tuyệt đối **không** gửi hoặc đẩy file `config.txt`, `storage_state.json`, `azota_localstorage.json` lên mạng hoặc Git công khai để bảo vệ thông tin cá nhân.
- File `.gitignore` đã được cấu hình sẵn để ngăn việc vô tình tải thông tin nhạy cảm lên kho lưu trữ.
- Mọi thắc mắc và đóng góp phát triển vui lòng mở Issue hoặc Pull Request trên repository dự án!
