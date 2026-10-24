# ⚡ Azota DOM Structure & Ultra-Fast Execution Guide for AI Agents

> **Mục đích:** File này cung cấp sơ đồ cấu trúc DOM, mã định danh (selectors) và các đoạn mã Javascript thực thi tức thời trên trình duyệt qua MCP `browser_evaluate`. Nhờ các cấu trúc này, Agent không cần phải mất thời gian snapshot thăm dò từng bước, giúp tốc độ quét, giải đề và điền đáp án tăng **gấp 5 - 10 lần** mà không lo sai lệch phần tử.

---

## 💡 Triết Lý Tối Ưu Tốc Độ: "Batch Solve & One-Shot Fill"

Thay vì thao tác thủ công, chậm chạp (đọc câu 1 $\rightarrow$ giải câu 1 $\rightarrow$ click web $\rightarrow$ đọc câu 2...), quy trình tối ưu của Agent phải thực hiện theo mô hình gom cụm (Batching):
1. **DUMP ĐỀ (1 bước):** Khi vừa vào giao diện thi, lấy toàn bộ text của trang qua `document.body.innerText` và ghi ra file `DEBAI/<ten_de>.txt`.
2. **GIẢI TOÀN BỘ TRÊN FILE TEXT (Ngoại tuyến):** Agent phân tích toàn bộ nội dung file text trong bộ nhớ/suy luận, chuẩn bị sẵn 2 mảng đáp án:
   - `abcdAnswers = ['A', 'B', 'C', 'A', ...]` (cho 30 câu Phần I)
   - `tfAnswers = ['Đúng', 'Sai', 'Đúng', ...]` (cho 20 ý Phần II)
3. **ONE-SHOT INJECT (1 lệnh JS duy nhất ~30ms):** Bơm toàn bộ 2 mảng đáp án vào trang web qua hàm JS tự động click tất cả các nút cùng lúc.
4. **CLEANUP (Dọn dẹp):**
   - Xóa ngay file txt trong `DEBAI/` sau khi điền xong đáp án.
   - Xóa bỏ các ảnh chụp màn hình trung gian/tạm thời không cần thiết trong `ANH/` để giải phóng dung lượng.


---

## 🗺️ Bản Đồ Luồng Trang (Page Flow Map)

```text
[1. Login] ─────────► [2. Classroom Details] ─────────► [3. Exam Entry] ─────────► [4. Take Test]
(/vi/auth/login)     (/student/classroom-details)       (/vi/de-thi/:hash)        (/vi/test/take-test)
```

---

## 📌 Bảng Selectors & Thao Tác Chi Tiết Theo Từng Trang

### 1. Trang Đăng Nhập (`/vi/auth/login`)
- **Username Input:** `input[placeholder*='điện thoại'], input[placeholder*='email'], input[placeholder*='username']`
- **Password Input:** `input[type='password']`
- **Nút Submit:** `button:has-text('Đăng nhập')`
- **Code thực thi tức thì:**
  ```javascript
  (() => {
    const user = document.querySelector("input[placeholder*='điện thoại'], input[placeholder*='email'], input[placeholder*='username']");
    const pass = document.querySelector("input[type='password']");
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Đăng nhập'));
    if (user && pass && btn) {
      user.value = "<USERNAME>";
      user.dispatchEvent(new Event('input', { bubbles: true }));
      pass.value = "<PASSWORD>";
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      btn.click();
    }
  })();
  ```

---

### 2. Trang Danh Sách Đề Thi Lớp Học (`/vi/student/classroom-details/:classId/1`)
- **Nút Xem thêm:** `button:has-text('Xem thêm')` (Cần click nút này trước khi quét để mở rộng toàn bộ đề thi chưa làm).
- **Thẻ chứa đề thi:** Thẻ `<a>` có liên kết `href` chứa `/vi/de-thi/`.
- **Dấu hiệu đề chưa làm:** Trong thẻ chứa text `"Điểm của bạn: Chưa thi"`.
- **Code quét toàn bộ đề chưa thi trong 1 lần gọi duy nhất:**
  ```javascript
  () => {
    const viewMore = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Xem thêm');
    if (viewMore) viewMore.click();
    
    return Array.from(document.querySelectorAll("a[href*='/vi/de-thi/']"))
      .filter(a => a.innerText.includes('Chưa thi'))
      .map(a => {
        const lines = a.innerText.split('\n').map(s => s.trim()).filter(Boolean);
        return {
          title: lines[0],
          deadline: lines.find(l => l.includes('Thời gian') || l.includes('Thi trước')) || 'Không thời hạn',
          url: a.href
        };
      });
  }
  ```

---

### 3. Trang Xác Nhận Bắt Đầu Thi (`/vi/de-thi/:examHash`)
- **Nút Bắt đầu thi:** `button:has-text('Bắt đầu thi')`
- **Code nhấn vào thi:**
  ```javascript
  () => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Bắt đầu thi');
    if (btn) btn.click();
  }
  ```

---

### 4. Trang Làm Bài Thi (`/vi/test/take-test/...`)

#### A. Quy tắc cấu trúc nút bấm đáp án:
Azota không sử dụng thẻ `<input type="radio">` thông thường mà sử dụng toàn bộ thẻ `<button>`:
1. **Phần I (Trắc nghiệm 4 lựa chọn $A, B, C, D$):**
   - Các nút đáp án là thẻ `<button>` có nội dung text chính xác là `'A'`, `'B'`, `'C'`, `'D'`.
   - Mỗi câu gồm 4 nút liên tiếp.
   - Công thức index: Câu thứ `q` (0-indexed) có các nút ở vị trí `[q*4, q*4 + 1, q*4 + 2, q*4 + 3]`.
2. **Phần II (Trắc nghiệm Đúng / Sai theo đoạn tư liệu):**
   - Các nút đáp án là thẻ `<button>` có text chứa `'Đúng'` hoặc `'Sai'`.
   - Mỗi ý ($a, b, c, d$) gồm 2 nút liên tiếp `['Đúng', 'Sai']`.
   - Công thức index: Ý thứ `k` (0-indexed) có nút 'Đúng' ở vị trí `k*2` và nút 'Sai' ở vị trí `k*2 + 1`.
3. **Trạng thái đã chọn:** Khi một nút được bấm, nó sẽ tự động nhận thêm class:
   ```css
   .selected-answer.border-selected-answer
   ```

---

#### B. Đoạn code trích xuất toàn bộ câu hỏi (1 lần gọi):
```javascript
() => ({
  title: document.title,
  fullText: document.body.innerText,
  abcdCount: Array.from(document.querySelectorAll('button')).filter(b => ['A', 'B', 'C', 'D'].includes(b.textContent.trim())).length / 4,
  tfSubCount: Array.from(document.querySelectorAll('button')).filter(b => ['Đúng', 'Sai'].includes(b.textContent.trim())).length / 2
})
```

---

#### C. Đoạn code TỰ ĐỘNG ĐIỀN TOÀN BỘ ĐÁP ÁN (Chạy siêu tốc trong ~30ms):
Agent chỉ cần truyền mảng đáp án `abcdAnswers` (ví dụ `['A', 'B', ...]`) và `tfAnswers` (ví dụ `['Đúng', 'Sai', ...]`), code sẽ tự click chính xác 100% tất cả các câu:

```javascript
((abcdAnswers, tfAnswers) => {
  const allButtons = Array.from(document.querySelectorAll('button'));
  const abcdButtons = allButtons.filter(b => ['A', 'B', 'C', 'D'].includes(b.textContent.trim()));
  const tfButtons = allButtons.filter(b => ['Đúng', 'Sai'].includes(b.textContent.trim()));

  // 1. Điền phần trắc nghiệm ABCD
  for (let q = 0; q < abcdAnswers.length; q++) {
    const target = abcdAnswers[q];
    const group = abcdButtons.slice(q * 4, q * 4 + 4);
    const btn = group.find(b => b.textContent.trim() === target);
    if (btn) btn.click();
  }

  // 2. Điền phần Đúng/Sai
  for (let k = 0; k < tfAnswers.length; k++) {
    const target = tfAnswers[k];
    const group = tfButtons.slice(k * 2, k * 2 + 2);
    const btn = group.find(b => b.textContent.trim() === target);
    if (btn) btn.click();
  }

  return {
    totalSelected: document.querySelectorAll('.selected-answer').length
  };
})(/* abcdAnswers */, /* tfAnswers */);
```

---

## 🚫 Những Điều Tuyệt Đối Không Làm
- **KHÔNG** click vào nút có text `"Nộp bài"`: Giữ nguyên để học sinh tự quyết định thời điểm nộp bài.
- **KHÔNG** lặp lại thao tác quét `browser_snapshot` tốn nhiều token và làm chậm thời gian phản hồi khi đã có sẵn cấu trúc DOM ở trên.
