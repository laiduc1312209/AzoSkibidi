# Azoskibidi - Azota Automation & Student Assistant Project

## 1. Giới thiệu dự án (Overview)
Dự án **Azoskibidi** được thiết kế để tự động hóa việc tương tác, theo dõi thông tin học tập và quản lý bài kiểm tra/bài tập trên nền tảng **Azota** (trường THPT Ninh Giang: `https://thptninhgiang.azota.vn/`) thông qua giao thức **Model Context Protocol (Playwright MCP)**.

Mục tiêu chính:
- Tự động hóa đăng nhập và duy trì phiên làm việc (Session Persistence) qua cookies và `localStorage`.
- Truy xuất thông tin học sinh, danh sách lớp học, bài kiểm tra và bài tập.
- Rà soát, thống kê và cảnh báo các bài tập/đề thi chưa làm ("Chưa thi", "Chưa nộp bài") kèm thời hạn.

---

## 2. Công nghệ & Cấu hình môi trường (Tech Stack)

- **Platform:** Node.js (v24+), Windows PowerShell.
- **Agent Environment:** Antigravity IDE.
- **Automation Engine:** Playwright MCP (`@playwright/mcp`).
- **MCP Configuration (`~/.gemini/config/mcp_config.json`):**
  - **Command:** `C:\Program Files\nodejs\node.exe`
  - **Script:** `C:\Users\laidu\AppData\Roaming\npm\node_modules\@playwright\mcp\cli.js`
  - **Cờ quan trọng:**
    - `--user-data-dir C:\Users\laidu\.mcp\playwright-profile`: Lưu profile trình duyệt cố định (không bị mất login khi tắt).
    - `--allow-unrestricted-file-access`: Cho phép đọc/ghi file ảnh chụp và log trực tiếp vào workspace.

---

## 3. Cấu trúc thư mục & Tệp tin chính (File Structure)

```text
Azoskibidi/
├── config.txt                 # File cấu hình thông tin đăng nhập gốc
├── config.example.txt         # File mẫu cấu hình đăng nhập
├── storage_state.json         # Phiên đăng nhập Playwright (Cookies + LocalStorage)
├── azota_localstorage.json    # Bản sao lưu token và thông tin người dùng từ LocalStorage
├── azota_selectors.json       # Bảng quy chuẩn Selectors & Code mẫu tăng tốc độ cho Agent
├── azota_structure.md         # Sổ tay kiến trúc DOM & Snippets siêu tốc cho AI Agent
├── README.md                  # Hướng dẫn sử dụng cho người dùng & cộng đồng
├── agent.md                   # Tài liệu hướng dẫn cho Agent / Developer
├── ANH/                       # Thư mục lưu trữ toàn bộ ảnh chụp màn hình
└── DEBAI/                     # Thư mục tạm lưu trữ đề bài/đáp án (tự động xóa sau khi điền)
```

### Chi tiết các tệp tin dữ liệu:
1. **`config.txt`**:
   - Dòng 1: URL hệ thống (`https://thptninhgiang.azota.vn/`)
   - Dòng 2: Tên tài khoản / Mã định danh học sinh
   - Dòng 3: Mật khẩu tài khoản
2. **`storage_state.json`**:
   - Chứa state đầy đủ của browser context (gồm token JWT `user_token`, `user_obj`, `rememberToken` và các cookie xác thực).
   - Dùng để inject hoặc tự động khôi phục session đăng nhập mà không cần gõ lại mật khẩu.

---

## 4. Các luồng công việc đã hoàn thành (Implemented Workflows)

### A. Đăng nhập & Lưu trữ phiên (Authentication & Persistence)
1. Đọc thông tin tài khoản từ `config.txt`.
2. Mở trình duyệt qua `browser_navigate` đến trang login.
3. Điền trường đăng nhập qua `browser_type` và submit.
4. Xuất và lưu `storageState` để các phiên tiếp theo tự động đăng nhập.

### B. Kiểm tra hồ sơ học tập (Profile Student)
- **URL:** `https://thptninhgiang.azota.vn/vi/student/profile-student/2443762/66443054?backTo=%2Fstudent%2Fclassroom%2F0`
- Cho phép tra cứu điểm số các bài đã thi, danh sách các đề thi gần đây và bài tập đã/chưa nộp.

### C. Liệt kê danh sách đề thi lớp học (Classroom Exams)
- **URL:** `https://thptninhgiang.azota.vn/vi/student/classroom-details/2443762/1?backto=%2Fstudent%2Fclassroom%2F0`
- Tự động mở rộng danh sách ("Xem thêm") và phân loại trạng thái:
  - **Chưa thi:** Liệt kê tên đề, hạn vào thi, liên kết trực tiếp.
  - **Đã thi:** Ghi nhận điểm số đã đạt hoặc trạng thái chấm điểm.

---

## 5. Nguyên tắc hoạt động & Quy định an toàn (Agent Guidelines)

Khi các AI Agent khác hoặc kỹ sư tiếp quản dự án này, cần tuân thủ các quy định sau:

1. **Tối ưu tốc độ xử lý (High-Speed Execution):**
   - Đọc trước file [`azota_selectors.json`](azota_selectors.json) và [`azota_structure.md`](azota_structure.md) để nắm cấu trúc DOM cố định của Azota.
   - Ưu tiên sử dụng trực tiếp các đoạn mã JS mẫu qua công cụ `browser_evaluate` thay vì gọi `browser_snapshot` lặp đi lặp lại nhiều lần gây nghẽn và làm chậm tốc độ của Agent.

2. **Quản lý Session:**
   - Ưu tiên sử dụng `storage_state.json` hoặc browser profile có sẵn tại `C:\Users\laidu\.mcp\playwright-profile` để không phải gửi request đăng nhập nhiều lần.

3. **Dọn dẹp thư mục DEBAI:**
   - Sau khi hoàn thành giải và điền đáp án xong cho một bài kiểm tra/đề thi, luôn phải xóa các file liên quan (đề bài, đáp án) trong thư mục `DEBAI/` để giữ thư mục làm việc luôn gọn gàng.

4. **Dọn dẹp hình ảnh không cần thiết (ANH/):**
   - Sau khi dùng xong hoặc báo cáo xong cho người dùng, xóa bỏ các ảnh chụp màn hình trung gian/tạm thời không cần thiết trong thư mục `ANH/`, chỉ giữ lại tối thiểu ảnh kết quả hoặc dọn sạch theo yêu cầu của người dùng để tránh tốn dung lượng.

5. **Trích xuất đề bài:**
   - Khi ấn nút vào thi, copy toàn bộ nội dung câu hỏi ra file text tương ứng trong `DEBAI/` để phục vụ suy luận giải đề.

---

## 6. Quy trình thực thi chuẩn khi nhận lệnh `start` (Standard Execution Pipeline)

Khi người dùng gửi lệnh `start` (hoặc yêu cầu bắt đầu chu trình), Agent tuân thủ nghiêm ngặt quy trình 6 bước sau:

1. **Bước 1: Tự động kết nối & Đăng nhập (Auto-Authentication)**
   - Mở Playwright MCP, kiểm tra phiên đăng nhập hiện tại tại `https://thptninhgiang.azota.vn/`.
   - Nếu chưa đăng nhập (hoặc bị chuyển hướng về `/auth/login`), tự động đọc thông tin từ `config.txt` (Dòng 1: URL, Dòng 2: username, Dòng 3: password) và thực hiện đăng nhập tự động.

2. **Bước 2: Quét & Phân loại đề thi (Exam Discovery)**
   - Truy cập trang danh sách bài tập/đề thi lớp học (`/student/classroom-details/...`).
   - Tự động click "Xem thêm" để quét hết toàn bộ danh sách.
   - Lọc và tổng hợp tất cả các đề thi có trạng thái **"Chưa thi"** (chưa hoàn thành), kèm thời hạn mở/đóng.

3. **Bước 3: Hiển thị danh sách đánh số thứ tự (Interactive Selection)**
   - Trình bày danh sách đề thi chưa làm theo bảng kèm **Số thứ tự (STT)** rõ ràng (ví dụ: `1`, `2`, `3`...).
   - Chờ người dùng nhập các STT muốn làm (cho phép chọn 1 đề hoặc chọn nhiều đề cùng lúc, ví dụ: `1, 2` hoặc `1-3`).

4. **Bước 4: Mở đề thi & Trích xuất toàn văn (One-Shot Dump)**
   - Nhấn "Bắt đầu thi" cho đề thi (hoặc mở song song các tab nếu chọn nhiều đề).
   - **Tối ưu tốc độ:** Chạy ngay 1 lệnh trích xuất toàn bộ text của trang (`document.body.innerText`) lưu ra file text tương ứng trong `DEBAI/<ma_de>.txt`. Tuyệt đối không đọc từng câu lẻ trên web.

5. **Bước 5: Giải toàn bộ trên file text & Điền đáp án 1 lần duy nhất (Batch Solve & One-Shot Fill)**
   - Agent đọc file text, suy luận giải toàn bộ tất cả các câu trong đề một lượt duy nhất và tổng hợp thành 2 mảng đáp án: `abcdAnswers` và `tfAnswers`.
   - **Điền siêu tốc trong ~30ms:** Thực thi 1 đoạn mã JS duy nhất qua `browser_evaluate` để tự động click chọn toàn bộ đáp án vào tất cả các câu trên giao diện Azota cùng một lúc. Không click lắt nhắt từng câu.
   - Giữ nguyên bài thi (không tự ý bấm "Nộp bài" trừ khi người dùng ra lệnh).

6. **Bước 6: Dọn dẹp dứt điểm (Cleanup)**
   - Ngay sau khi đã điền xong đáp án, tự động xóa sạch file text đề bài và đáp án liên quan trong thư mục `DEBAI/`.
   - Chụp 1 ảnh màn hình hoàn tất lưu vào `ANH/` để báo cáo cho người dùng.
   - Khi phiên làm việc kết thúc hoặc người dùng đã xác nhận, tự động dọn sạch các ảnh chụp màn hình trung gian/không cần thiết trong thư mục `ANH/`.
