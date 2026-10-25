# Azoskibidi - Trợ Lý Tự Động Hóa Quản Lý & Giải Đề Thi Azota

Azoskibidi là công cụ trợ lý học tập thông minh chạy trên nền tảng Playwright MCP (Model Context Protocol), giúp tự động hóa toàn diện quá trình theo dõi, quản lý, trích xuất và hỗ trợ giải các bài kiểm tra/đề thi trực tuyến trên nền tảng học tập Azota.

---

## Các Tính Năng Chính

- Tự động đăng nhập và duy trì phiên: Tự động đọc tài khoản từ file cấu hình và giữ phiên đăng nhập lâu dài qua trình duyệt, không bị out tài khoản bất ngờ.
- Quét danh sách đề thi 1 bước siêu tốc: Tự động kiểm tra và tổng hợp toàn bộ các đề thi chưa làm, bài tập chưa nộp trong lớp học chỉ trong vòng 1 giây.
- Hỗ trợ làm nhiều đề thi cùng lúc: Cho phép người dùng lựa chọn 1 hoặc nhiều đề theo số thứ tự (STT) để hệ thống tự động mở và xử lý song song.
- Tự động trích xuất và giải đề chuẩn xác: Nhận diện và giải đáp đầy đủ các dạng trắc nghiệm theo chương trình mới (trắc nghiệm 4 lựa chọn A, B, C, D và trắc nghiệm đúng/sai theo đoạn tư liệu).
- Tự động điền đáp án trong 30 mili-giây: Sử dụng mã script bơm trực tiếp vào giao diện web để click toàn bộ đáp án cùng lúc, tiết kiệm tối đa thời gian làm bài.
- Chống giám sát chuyển tab (Anti-Proctoring): Tự động tắt thông báo giám sát và vô hiệu hóa triệt để các trình theo dõi đổi tab, giúp học sinh có thể chuyển tab, lướt web thoải mái mà Azota vẫn ghi nhận 0 lần vi phạm.
- An toàn tuyệt đối: Hệ thống không bao giờ tự ý bấm nút "Nộp bài", người dùng luôn có quyền kiểm tra lại bài thi trên màn hình trước khi quyết định nộp.
- Tự động lưu trữ đề bài: Toàn bộ các file đề bài và lời giải trích xuất được lưu trữ cẩn thận trong thư mục DEBAI để bạn tiện xem lại và ôn tập bất cứ lúc nào.

---

## Cấu Trúc Thư Mục Dự Án

```text
Azoskibidi/
├── .gitignore                 # File cấu hình loại trừ thông tin nhạy cảm khi đưa lên Git
├── config.example.txt         # File mẫu hướng dẫn điền tài khoản đăng nhập
├── config.txt                 # File chứa tài khoản và mật khẩu thật của bạn (tự tạo)
├── storage_state.json         # File lưu trạng thái phiên đăng nhập trình duyệt
├── azota_localstorage.json    # File sao lưu thông tin LocalStorage người dùng
├── azota_selectors.json       # Bảng mã định danh và code mẫu tăng tốc độ cho Agent
├── azota_structure.md         # Tài liệu hướng dẫn cấu trúc DOM web cho AI Agent
├── README.md                  # Hướng dẫn sử dụng chi tiết dành cho người dùng
├── agent.md                   # Quy chuẩn vận hành kỹ thuật dành cho AI Agent
└── DEBAI/                     # Thư mục lưu trữ đề thi và lời giải (tiện ôn tập)
```

---

## HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC CHO NGƯỜI MỚI BẮT ĐẦU

Nếu bạn không rành về công nghệ hay câu lệnh máy tính, chỉ cần làm theo từng bước đơn giản dưới đây:

### Phần 1: Cài đặt ban đầu (CHỈ CẦN LÀM 1 LẦN DUY NHẤT ĐẦU TIÊN)

Toàn bộ các bước trong Phần 1 này bạn chỉ cần thực hiện đúng một lần duy nhất khi vừa tải dự án về máy. Từ những lần sau trở đi, bạn không cần làm lại nữa.

#### Bước 1: Cài đặt Node.js và Mở dự án trong AI Agent (Ví dụ Antigravity IDE)
1. **Cài đặt Node.js:**
   - Mở trình duyệt web (Chrome, Edge, Cốc Cốc...) và truy cập vào trang: https://nodejs.org
   - Bấm vào nút tải phiên bản **LTS** (bản ổn định nhất được khuyến nghị).
   - Nhấp đúp chuột vào file tải về (đuôi `.msi`), nhấn **Next** liên tục theo mặc định, tích chọn đồng ý điều khoản, rồi nhấn **Install**. Khi cài xong, nhấn **Finish**.
2. **Cài đặt và mở dự án trong Antigravity IDE:**
   - Cài đặt và mở phần mềm **Antigravity IDE** trên máy tính của bạn.
   - Nhìn lên thanh menu góc trên cùng bên trái: Chọn **File** -> **Open Folder...** -> Chọn đúng thư mục **Azoskibidi** đã tải về.
3. **Cấu hình tối ưu trong Antigravity IDE (Khuyến nghị để đạt tốc độ cao nhất):**
   - **Bật Turbo Mode:** Trong Antigravity IDE, hãy bật tính năng **Turbo Mode** để trợ lý AI tăng tốc độ phản hồi và suy luận đề thi nhanh nhất có thể.
   - **Chỉnh Agent Behavior thành "Always Proceed":** Trong mục cài đặt hành vi của Agent (Agent Behavior / Settings), hãy chọn chế độ **Always Proceed** (hoặc tích chọn luôn cho phép) để trợ lý tự động hoàn thành các bước từ đầu đến cuối mà không dừng lại hỏi xác nhận từng thao tác nhỏ.

#### Bước 2: Tự động cài đặt Playwright MCP qua AI Agent (Không cần gõ lệnh)
Bạn hoàn toàn không cần mở Terminal hay tự gõ dòng lệnh phức tạp. Hãy để trợ lý AI tự làm:
1. Sao chép (copy) đoạn nội dung mẫu sau:
   ```text
   Cài đặt và cấu hình giúp tôi Playwright MCP cho dự án này
   ```
2. Dán (paste) đoạn nội dung trên vào khung chat của trợ lý AI (ở góc phải màn hình) rồi nhấn **Enter**.
3. **Lưu ý cực kỳ quan trọng:** Trong quá trình trợ lý AI tự động chạy lệnh cài đặt, nếu Antigravity IDE hiển thị bảng thông báo hỏi quyền phê duyệt thực thi (Approval/Permission), bạn hãy:
   - Tích chọn vào ô: **"Always allow..."** (Luôn cho phép).
   - Bấm nút: **Submit** (hoặc nút Xác nhận).
   - Trợ lý AI sẽ tự động hoàn tất việc cài đặt và cấu hình MCP từ A đến Z cho bạn.

---

### Phần 2: Cài đặt tài khoản Azota của bạn

1. Mở cửa sổ **Terminal** trong Antigravity IDE (bằng cách vào menu trên cùng chọn **Terminal** -> **New Terminal**, hoặc nhấn tổ hợp phím **Ctrl + `** trên bàn phím).
2. Dán dòng lệnh sau vào Terminal và nhấn phím **Enter**:
   ```bash
   copy config.example.txt config.txt
   ```
3. Mở file `config.txt` vừa được tạo (bấm trực tiếp vào tên file `config.txt` ở cột danh sách file bên trái của Antigravity IDE, hoặc mở bằng Notepad).
4. Bạn sẽ thấy 3 dòng, hãy sửa lại theo đúng thông tin cá nhân của bạn:
   - **Dòng 1:** Điền địa chỉ trang web Azota trường bạn theo định dạng `https://<link_truong>.azota.vn/` (thay `<link_truong>` bằng tên trường của bạn, ví dụ: `https://thptninhgiang.azota.vn/`).
   - **Dòng 2:** Điền tên đăng nhập hoặc số điện thoại tài khoản Azota của bạn.
   - **Dòng 3:** Điền mật khẩu tài khoản Azota của bạn.
   - *Ví dụ mẫu:*
     ```text
     https://<link_truong>.azota.vn/
     nguyenvana12b
     MatKhau123@
     ```
5. Nhấn tổ hợp phím **Ctrl + S** trên bàn phím để lưu file lại.

---

### Phần 3: Hướng dẫn sử dụng hàng ngày (Từ lần thứ 2 trở đi)

Mỗi khi cần kiểm tra đề thi hoặc làm bài thi, bạn chỉ cần thực hiện 5 bước đơn giản:

#### Bước 1: Mở dự án trong Antigravity IDE
Mở phần mềm **Antigravity IDE**, mở thư mục **Azoskibidi**.

#### Bước 2: Gõ lệnh bắt đầu
1. Nhìn vào khung chat của trợ lý AI ở góc phải màn hình.
2. Gõ đúng 1 từ duy nhất:
   ```text
   start
   ```
3. Nhấn phím **Enter**.
4. **Lưu ý cực kỳ quan trọng:** Nếu Antigravity IDE có hiển thị bảng thông báo hỏi quyền phê duyệt thực thi (Approval/Permission), bạn hãy:
   - Tích chọn vào ô: **"Always allow..."** (Luôn cho phép).
   - Bấm nút: **Submit** (hoặc nút Xác nhận).
   - Trợ lý AI sẽ tự động đăng nhập, quét đề và thực hiện toàn bộ quy trình cho bạn.

#### Bước 3: Xem danh sách và chọn đề cần làm
1. Trợ lý sẽ tự động đăng nhập vào Azota và quét toàn bộ danh sách đề chưa làm trong lớp chỉ trong 1 giây.
2. Trợ lý sẽ hiển thị bảng danh sách đề thi được đánh số thứ tự rõ ràng, ví dụ:
   ```text
   Danh sách đề thi chưa làm:
   1. BÀI 3.docx (Đang mở)
   2. BÀI 4.docx (Đang mở)
   3. BÀI 5.docx (Đang mở)
   ```
3. Bạn chỉ cần nhắn lại số thứ tự đề bạn muốn làm:
   - Muốn làm đề số 1: Nhắn `1`
   - Muốn làm cùng lúc đề 1 và đề 2: Nhắn `1, 2`
   - Muốn làm tất cả các đề còn hạn: Nhắn `all`

#### Bước 4: Chờ hệ thống tự động làm bài
1. Trợ lý sẽ tự động mở đề thi, vô hiệu hóa các cảnh báo giám sát.
2. Trích xuất toàn bộ câu hỏi, suy luận đáp án và tự động tích chọn hết tất cả các câu trên màn hình chỉ trong 30 mili-giây.
3. Sau khi điền xong, file đề bài và lời giải sẽ được lưu lại trong thư mục DEBAI để bạn có thể xem lại khi cần ôn thi.

#### Bước 5: Kiểm tra lại và Bấm Nộp bài
1. Trợ lý sẽ thông báo cho bạn biết bài thi đã được điền xong.
2. Bạn mở cửa sổ trình duyệt lên, kiểm tra lại các câu đã được tích đáp án.
3. Khi đã hoàn toàn hài lòng, bạn chỉ cần tự tay bấm vào nút **Nộp bài** trên màn hình.

---

### Phần 4: Tính năng vượt qua "Giám Sát" chuyển tab

Trong trường hợp đề thi được giáo viên bật tính năng *"Giám Sát"* (hiện thông báo không được chuyển tab):
- Hệ thống sẽ tự động can thiệp vào trình duyệt để khóa hoàn toàn bộ đếm chuyển tab của Azota.
- Bạn có thể thoải mái chuyển sang tab khác (mở Google tra cứu, mở Zalo, xem Youtube...) hoặc bấm Alt + Tab thu nhỏ trình duyệt mà **Azota vẫn ghi nhận 0 lần vi phạm**.

---

## Lưu Ý Quan Trọng Về Bảo Mật

1. **Không chia sẻ file cá nhân:** Tuyệt đối không gửi file `config.txt`, file `storage_state.json` hay `azota_localstorage.json` cho bất kỳ ai vì các file này chứa mật khẩu và phiên đăng nhập trực tiếp vào tài khoản cá nhân của bạn.
2. **Chế độ an toàn khi chia sẻ:** File `.gitignore` đã được cấu hình sẵn để tự động khóa không cho phép tải file mật khẩu lên mạng khi bạn sử dụng Git.
