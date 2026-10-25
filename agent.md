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
└── DEBAI/                     # Thư mục lưu trữ đề bài/đáp án đã trích xuất (giữ lại để ôn tập)
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

1. **Tối ưu tốc độ xử lý & Quy tắc kiểm tra 1 bước (One-Shot Check Rule):**
   - Đọc trước file [`azota_selectors.json`](azota_selectors.json) và [`azota_structure.md`](azota_structure.md) để nắm cấu trúc DOM cố định của Azota.
   - **Tốc độ tối đa khi kiểm tra đề:** Khi người dùng yêu cầu kiểm tra đề chưa làm (hoặc nhận lệnh `start`), Agent **tuyệt đối không** mở từng đề đơn lẻ để thăm dò. Thay vào đó, Agent **chỉ thực hiện đúng 2 lệnh duy nhất**:
     1. Gọi `browser_navigate` đến thẳng URL lớp học: `https://thptninhgiang.azota.vn/vi/student/classroom-details/2443762/1`.
     2. Gọi `browser_evaluate` chạy script `fast_script_one_shot_check_all` để click "Xem thêm" và quét toàn bộ danh sách đề thi/bài tập chưa nộp trong **1 lần duy nhất** (hoàn tất trong vòng 1-2 giây).
   - Tuyệt đối tránh gọi `browser_snapshot` lặp đi lặp lại nhiều lần gây nghẽn và làm chậm tốc độ.

2. **Quản lý Session:**
   - Ưu tiên sử dụng `storage_state.json` hoặc browser profile có sẵn tại `C:\Users\laidu\.mcp\playwright-profile` để không phải gửi request đăng nhập nhiều lần.

3. **Lưu trữ thư mục DEBAI:**
   - Giữ lại toàn bộ các file đề bài và đáp án đã trích xuất trong thư mục `DEBAI/` để người dùng có thể tra cứu, xem lại đề và ôn tập bất cứ lúc nào (không xóa sau khi làm bài).

4. **Tuyệt đối không chụp ảnh màn hình (Zero Screenshot Overhead):**
   - Không gọi công cụ `browser_take_screenshot` trong bất kỳ bước nào. Việc không chụp ảnh giúp loại bỏ độ trễ 1-2 giây, tối ưu hóa 100% tốc độ thực thi và không làm rác thư mục dự án.

5. **Xử lý bài thi có "Giám Sát" & Chặn giám sát chuyển tab (Anti-Proctoring):**
   - Khi vào giao diện làm bài, nếu xuất hiện popup *"Đây là bài thi được 'Giám Sát'..."*, Agent lập tức chạy đoạn mã JS trong `azota_structure.md` / `azota_selectors.json` để:
     - Tự động click *"Xác nhận"* đóng popup.
     - Chặn và triệt tiêu toàn bộ các sự kiện `visibilitychange`, `blur`, `pagehide`, `mouseleave`.
     - Giả lập `document.hidden = false` và `visibilityState = 'visible'` vĩnh viễn, tránh trường hợp bị hệ thống Azota ghi nhận chuyển tab hay cảnh báo gian lận.

6. **Trích xuất đề bài:**
   - Khi ấn nút vào thi, copy toàn bộ nội dung câu hỏi ra file text tương ứng trong `DEBAI/` để phục vụ suy luận giải đề.

---

## 6. Quy trình thực thi chuẩn khi nhận lệnh `start` (Standard Execution Pipeline)

Khi người dùng gửi lệnh `start` (hoặc yêu cầu bắt đầu chu trình), Agent tuân thủ nghiêm ngặt quy trình 6 bước sau:

1. **Bước 1: Tự động kết nối & Đăng nhập (Auto-Authentication)**
   - Mở Playwright MCP, kiểm tra phiên đăng nhập hiện tại tại `https://thptninhgiang.azota.vn/`.
   - Nếu chưa đăng nhập (hoặc bị chuyển hướng về `/auth/login`), tự động đọc thông tin từ `config.txt` (Dòng 1: URL, Dòng 2: username, Dòng 3: password) và thực hiện đăng nhập tự động.

2. **Bước 2: Quét toàn bộ đề thi chưa làm trong 1 lần gọi (One-Shot Exam Discovery)**
   - Truy cập thẳng URL lớp học: `https://thptninhgiang.azota.vn/vi/student/classroom-details/2443762/1`.
   - Chạy 1 lệnh JS qua `browser_evaluate` (`fast_script_one_shot_check_all`): tự động mở rộng "Xem thêm" và gom tất cả đề thi có trạng thái **"Chưa thi"** và bài tập **"Chưa nộp"** về dạng mảng dữ liệu.
   - Không chuyển hướng rời khỏi trang lớp học ở bước này.

3. **Bước 3: Hiển thị danh sách đánh số thứ tự (Interactive Selection)**
   - Trình bày danh sách đề thi chưa làm theo bảng kèm **Số thứ tự (STT)** rõ ràng (ví dụ: `1`, `2`, `3`...).
   - Chờ người dùng nhập các STT muốn làm (cho phép chọn 1 đề hoặc chọn nhiều đề cùng lúc, ví dụ: `1, 2` hoặc `1-3`).

4. **Bước 4: Mở đề thi, Vô hiệu hóa Giám sát & Trích xuất toàn văn (One-Shot Dump)**
   - Nhấn "Bắt đầu thi" cho đề thi (hoặc mở song song các tab nếu chọn nhiều đề).
   - **Xử lý Giám Sát (Bypass Proctoring):** Nếu xuất hiện thông báo *"Đây là bài thi được Giám Sát"*, tự động chạy script tắt thông báo và triệt tiêu toàn bộ các listener theo dõi chuyển tab/blur (`fast_script_bypass_supervision`).
   - **Tối ưu tốc độ:** Chạy ngay 1 lệnh trích xuất toàn bộ text của trang (`document.body.innerText`) lưu ra file text tương ứng trong `DEBAI/<ma_de>.txt`. Tuyệt đối không đọc từng câu lẻ trên web.

5. **Bước 5: Giải toàn bộ trên file text & Điền đáp án 1 lần duy nhất (Batch Solve & One-Shot Fill)**
   - Agent đọc file text, suy luận giải toàn bộ tất cả các câu trong đề một lượt duy nhất và tổng hợp thành 2 mảng đáp án: `abcdAnswers` và `tfAnswers`.
   - **Điền siêu tốc trong ~30ms:** Thực thi 1 đoạn mã JS duy nhất qua `browser_evaluate` để tự động click chọn toàn bộ đáp án vào tất cả các câu trên giao diện Azota cùng một lúc. Không click lắt nhắt từng câu.
   - Giữ nguyên bài thi (không tự ý bấm "Nộp bài" trừ khi người dùng ra lệnh).

6. **Bước 6: Báo cáo hoàn tất (Lưu trữ đề bài)**
   - Giữ nguyên các file text đề bài và đáp án trong thư mục `DEBAI/` để người dùng có thể xem lại hoặc học tập.
   - Không chụp ảnh màn hình; lập tức báo cáo trực tiếp trong chat để người dùng tự kiểm tra trên web và xác nhận nộp bài.
