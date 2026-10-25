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

Nếu bạn không rành về công nghệ hay lập trình, chỉ cần làm theo từng bước đơn giản dưới đây:

### Phần 1: Cài đặt phần mềm cần thiết (Chỉ cần làm 1 lần duy nhất)

#### Bước 1: Cài đặt Node.js
1. Mở trình duyệt web (Chrome, Edge, Cốc Cốc...) và truy cập vào trang: https://nodejs.org
2. Bấm vào nút tải phiên bản **LTS** (phiên bản ổn định được khuyến nghị).
3. Sau khi tải về file cài đặt (có đuôi `.msi`), bạn nhấp đúp chuột vào file để mở lên.
4. Nhấn nút **Next** liên tục theo mặc định, tích chọn đồng ý điều khoản, rồi nhấn **Install**. Khi cài xong, nhấn **Finish**.

#### Bước 2: Cài đặt Playwright MCP
1. Nhấn tổ hợp phím **Windows + R** trên bàn phím.
2. Nhập chữ `powershell` rồi nhấn phím **Enter**.
3. Trong cửa sổ màu xanh hiện lên, bạn sao chép và dán dòng lệnh sau vào:
   ```bash
   npm install -g @playwright/mcp
   ```
4. Nhấn phím **Enter** và đợi khoảng 10 - 20 giây cho máy tự động cài đặt xong.

---

### Phần 2: Cài đặt tài khoản Azota của bạn

1. Mở thư mục **Azoskibidi** trên máy tính của bạn.
2. Tìm file có tên là `config.example.txt`.
3. Bấm chuột phải vào file đó, chọn **Copy** rồi bấm **Paste** ngay tại đó (hoặc bấm phím F2 để đổi tên file thành `config.txt`).
4. Nhấp đúp chuột vào file `config.txt` để mở bằng phần mềm **Notepad** có sẵn trên máy tính.
5. Bạn sẽ thấy 3 dòng, hãy sửa lại theo đúng thông tin cá nhân của bạn:
   - **Dòng 1:** Giữ nguyên link web trường của bạn (ví dụ: `https://thptninhgiang.azota.vn/`).
   - **Dòng 2:** Điền tên đăng nhập hoặc số điện thoại tài khoản Azota của bạn.
   - **Dòng 3:** Điền mật khẩu tài khoản Azota của bạn.
   - *Ví dụ mẫu:*
     ```text
     https://thptninhgiang.azota.vn/
     nguyenvana12b
     MatKhau123@
     ```
6. Nhấn tổ hợp phím **Ctrl + S** trên bàn phím để lưu file lại, sau đó đóng cửa sổ Notepad.

---

### Phần 3: Hướng dẫn sử dụng hàng ngày

Mỗi khi cần kiểm tra đề thi hoặc làm bài, bạn chỉ cần thực hiện 5 bước sau:

#### Bước 1: Mở dự án trong Antigravity IDE (hoặc công cụ AI bạn sử dụng)
1. Mở phần mềm **Antigravity IDE**.
2. Vào menu trên cùng: chọn **File** -> **Open Folder...** -> Chọn thư mục **Azoskibidi** trên máy tính của bạn.

#### Bước 2: Gõ lệnh bắt đầu
1. Nhìn vào khung chat của trợ lý AI ở góc phải màn hình.
2. Gõ đúng 1 từ duy nhất:
   ```text
   start
   ```
3. Nhấn phím **Enter**.

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
