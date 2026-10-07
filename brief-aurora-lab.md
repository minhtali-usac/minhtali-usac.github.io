# BRIEF: Nâng cấp "Web học tập Phát xạ - Cực quang" thành Lab ảo mô phỏng trực quan

**Đơn vị:** CLB Thiên văn USAC
**Tham chiếu phong cách:** Astrosphere (Hệ thống Mô phỏng Hệ tọa độ)
**Sản phẩm hiện tại:** Aurora Lab (auroralab.clbtvusac.com)

> **Lưu ý:** Brief được viết dựa trên các ảnh chụp màn hình do nhóm cung cấp (3 ảnh Aurora Lab, 1 ảnh Astrosphere). Chưa truy cập trực tiếp hai đường link. Nên đối chiếu lại với bản chạy thật trước khi giao dev.

---

## 1. Chẩn đoán hiện trạng

Aurora Lab hiện là **trang tra cứu cuộn dọc**: người học đọc thẻ, xem bảng, xem công thức. Phần mô phỏng chỉ là một banner trang trí nhỏ.

| Vấn đề | Biểu hiện |
|---|---|
| Mô phỏng chỉ để trang trí | Banner cực quang chỉ phản ứng với chuột, không liên quan đến dữ liệu bên dưới |
| Người học đọc chứ không khám phá | Phải cuộn qua danh sách thẻ, bấm toggle rồi nhìn con số đổi |
| Không có quan hệ nhân quả | Không thấy được chuỗi "electron nhận năng lượng → nhảy mức → phát photon → ra màu" |
| Các phần rời rạc | Nguồn phát xạ, phổ, thẻ vạch, máy tính photon không liên kết với nhau |
| Thiếu hướng dẫn học | Không có mục tiêu, nhiệm vụ hay kiểm tra kiến thức |
| Giao diện chưa đồng bộ thương hiệu | Khác hẳn ngôn ngữ thiết kế của Astrosphere |

## 2. Mục tiêu

Chuyển từ "trang web có mô phỏng" sang **"phòng lab ảo"**:

- Mô phỏng chiếm màn hình chính; nội dung giải thích đi kèm theo ngữ cảnh.
- Người học thay đổi một thông số và thấy hậu quả ngay.
- **Cơ bản và trực quan**: mỗi màn hình chỉ dạy một ý.
- **Giao diện đẹp, nhất quán thương hiệu USAC** như Astrosphere.
- Có chiều sâu cho người muốn học thêm (chế độ Đầy đủ).

## 3. Nguyên tắc cốt lõi: cắt bớt, không thêm

Mỗi mô phỏng trả lời đúng một câu hỏi, với 1-2 điều khiển.

| Mô phỏng | Câu hỏi nó trả lời | Điều khiển chính |
|---|---|---|
| **Nguyên tử phát photon** | Vì sao nguyên tố phát ra ánh sáng có màu? | Nút "Cấp năng lượng" + chọn nguyên tố |
| **Cực quang theo độ cao** | Vì sao cực quang có màu xanh, đỏ, tím? | Thanh trượt năng lượng hạt / gió Mặt Trời |
| **Ngọn lửa → kính phân quang** | Làm sao nhận ra nguyên tố từ ánh sáng? | Chọn muối, bấm "Qua kính phân quang" |

**Thanh phổ 380-780 nm** là yếu tố dùng chung cho cả 3 mô phỏng (thay thế quang phổ tĩnh, thẻ vạch và máy tính photon của trang cũ). Đây cũng là điểm nhận diện riêng của Aurora Lab.

**Nên bỏ ở bản đầu:** WebGL/3D, chế độ giáo viên, "phổ thiên thể bí ẩn", so sánh nhiều nguyên tố cùng lúc.

## 4. Chi tiết 3 mô phỏng (mỗi cái một khoảnh khắc "wow")

### 4.1. Nguyên tử phát photon (làm đầu tiên)
- Vẽ mô hình mức năng lượng/Bohr của nguyên tố đang chọn (H, Na, O...).
- Bấm "Cấp năng lượng": electron nhảy lên mức cao, đứng một nhịp, rồi rơi xuống và **bắn ra một photon** có màu đúng λ.
- Photon bay thẳng xuống thanh phổ và **để lại một vạch sáng**, nên quang phổ được "vẽ" dần.
- Hiển thị ΔE = hc/λ ngay trên bước nhảy đó (gộp máy tính photon cũ vào đây).

### 4.2. Cực quang theo độ cao
- Mặt cắt đứng: Mặt Trời, gió Mặt Trời, từ quyển, hạt chạy theo đường sức từ, khí quyển phân tầng theo độ cao.
- Thanh trượt năng lượng hạt: kéo lên thì dải sáng **hạ thấp** và đổi màu.
- Màu theo tầng (số liệu cần đối chiếu nguồn, xem mục 8):
  - O 557.7 nm (xanh lục): khoảng 100-150 km
  - O 630 nm (đỏ): trên khoảng 200 km
  - N₂⁺ 391.4 / 427.8 nm (tím-lam): tầng thấp, khoảng 90-110 km
- Thanh phổ phía dưới phản ứng theo: tăng năng lượng thì các vạch tương ứng sáng lên.
- Tùy chọn: toggle "góc nhìn từ mặt đất" và "mặt cắt khí quyển".

### 4.3. Ngọn lửa → kính phân quang
- Chọn muối kim loại (Na, Cu, Sr, Ba, K, Li, Ca), thả vào lửa, lửa đổi màu.
- Kéo kính phân quang qua: màu lửa **tách thành các vạch riêng lẻ**.
- Đây là cách trực quan nhất để giải thích "dấu vân tay ánh sáng".
- Thử thách: "Đoán nguyên tố từ ngọn lửa này".

## 5. Liên kết giữa các mô phỏng

Dùng **một trạng thái chung** (nguyên tố đang chọn, λ đang chọn, mức năng lượng).
Ví dụ: chọn O ở tab Cực quang rồi chuyển sang tab Nguyên tử thì thấy đúng bước nhảy 557.7 nm. Trang cũ chưa có điều này.

## 6. Giao diện: học theo "thương hiệu USAC" của Astrosphere

### 6.1. Đặc điểm nhận diện cần dùng lại
- **Header cố định:** logo kính thiên văn bên trái; dòng nhỏ "CLB Thiên văn USAC" phía trên, tên công cụ in đậm phía dưới. Bên phải: Đặt lại, USACodex, Trợ giúp, Giới thiệu.
- **Công tắc "Cơ bản / Đầy đủ":** Cơ bản chỉ có mô phỏng và vài điều khiển; Đầy đủ mở thêm dữ liệu, bảng vạch phổ, bài tập. Đây là cách giải quyết bài toán "cơ bản mà vẫn đủ sâu".
- **Bố cục:** canvas lớn bên trái, panel điều khiển bên phải **đánh số 1, 2, 3** theo thứ tự thao tác (ví dụ "1. Chọn nguyên tố", "2. Cấp năng lượng", "3. Hiện trên mô phỏng").
- **Thanh trạng thái dưới canvas:** một dòng kết quả to (ví dụ "λ = 557,7 nm · ΔE = 2,22 eV") và một dòng gợi ý thao tác nhỏ bên phải.
- **Màu sắc:** nền đen gần thuần, nhấn cam cho điều khiển (thanh trượt, ô tick); mỗi đối tượng trong mô phỏng có màu riêng. Với Aurora Lab, màu riêng là **màu của từng vạch phổ**, giao diện tự đổi màu nhấn theo nguyên tố đang chọn.
- **Nhãn trực tiếp trên canvas:** tên, góc, đường tham chiếu ghi ngay trên hình.
- **Chân trang:** khẩu hiệu "khoa học cho mọi người", email góp ý, link về trang CLB, mascot nhỏ ở góc dưới phải.

### 6.2. Bố cục đề xuất

```
Header: [logo] CLB Thiên văn USAC / Lab ảo Phát xạ - Cực quang
        [Cơ bản|Đầy đủ] [Đặt lại] [USACodex] [Trợ giúp] [Giới thiệu]
────────────────────────────────────────────────────────────────
 Tab: Nguyên tử | Cực quang | Ngọn lửa
┌──────────────────────────────────┬───────────────────────────┐
│                                  │ 1. Chọn nguyên tố         │
│        CANVAS MÔ PHỎNG           │ 2. Cấp năng lượng         │
│                                  │ 3. Hiện trên mô phỏng     │
│                                  │ (thẻ giải thích ngắn)     │
├──────────────────────────────────┴───────────────────────────┤
│ λ = 557,7 nm · ΔE = 2,22 eV          Kéo để xoay · bấm vạch  │
└──────────────────────────────────────────────────────────────┘
        THANH PHỔ 380 - 780 nm (dùng chung, đồng bộ canvas)
Footer: khoa học cho mọi người · email góp ý · link CLB · mascot
```

### 6.3. Nguyên tắc làm đẹp
- Một màn hình, không cuộn; canvas chiếm khoảng 70% diện tích.
- Nền không gian có sao, màu nhấn lấy từ vạch phổ của nguyên tố đang chọn.
- **Hiệu ứng glow:** `shadowBlur` hoặc blend mode `lighter` cho photon, vạch phổ, lửa.
- Chuyển động mượt: easing khi electron nhảy, fade khi đổi tab; tránh giật.
- Chữ ít: mỗi mô phỏng một dòng gợi ý và một thẻ giải thích ngắn; lý thuyết dài chuyển vào "Tìm hiểu thêm".
- Phông: một phông tiêu đề có cá tính, một phông sạch cho nội dung, phông mono cho công thức.
- Mobile: panel điều khiển thành bottom sheet kéo lên.

## 7. Học tập nhẹ, không nặng nề

- Mỗi module có **một thử thách nhỏ** (ví dụ "Làm cho cực quang chuyển sang màu đỏ", "Đoán nguyên tố từ ngọn lửa").
- 3 câu quiz cuối mỗi module; không cần hệ thống điểm hay cấp độ phức tạp.
- Tooltip khoa học khi hover: thuật ngữ + giải thích một câu.

## 8. Cơ sở lý thuyết: lấy từ đâu, trình bày thế nào

### 8.1. Tận dụng nội dung sẵn có (khoảng 60%)
Công thức ΔE = hc/λ, hằng số h, c, bảng vạch phổ (λ, eV, độ cao), phần ứng dụng. Chỉ cần chia lại theo từng mô phỏng thay vì một khối dài.

### 8.2. Nguồn tham khảo gợi ý
- **NIST Atomic Spectra Database** (physics.nist.gov/asd): bước sóng và mức năng lượng chuẩn của từng nguyên tố.
- **Giáo trình Vật lý đại cương / Hóa học đại cương**: cấu trúc nguyên tử, mô hình Bohr, quang phổ vạch.
- **Tài liệu cực quang** của NOAA Space Weather Prediction Center, NASA, Geophysical Institute (Đại học Alaska Fairbanks): độ cao phát xạ, gió Mặt Trời, chỉ số Kp.
- ***Astronomy* (OpenStax, miễn phí):** quang phổ học trong thiên văn.

> **Cảnh báo kiểm chứng:** các nguồn trên được gợi ý từ kiến thức sẵn có, không được tra cứu trực tiếp và có thể sai tên hoặc đường dẫn. Cần tự kiểm tra từng nguồn. Đặc biệt đối chiếu lại **số liệu vạch phổ và độ cao phát xạ** trong bảng cũ với NIST và tài liệu cực quang, đừng chỉ dựa vào bảng trong ảnh.

### 8.3. Ba lớp trình bày

| Lớp | Nội dung | Hiện ở đâu |
|---|---|---|
| Ghi chú nhanh | 1-2 câu, đổi theo thao tác | Thanh trạng thái dưới canvas |
| Giải thích | Vài đoạn ngắn kèm hình | Panel bên phải / chế độ Đầy đủ |
| Chuyên sâu | Công thức, bài tập, số liệu | Mục riêng (ví dụ USACodex) |

### 8.4. Kiểm duyệt
Nhờ thành viên CLB có chuyên môn rà soát nội dung trước khi đăng, vì đây là web giáo dục.

## 9. Gợi ý kỹ thuật

- Canvas 2D (hoặc p5.js) cho bản đầu; hạt dùng particle system.
- Một file JSON duy nhất cho nguyên tố và vạch phổ.
- State chung nhẹ (store tự viết hoặc Zustand) để đồng bộ các tab và thanh phổ.
- Hiệu năng: giới hạn số hạt, dùng `requestAnimationFrame`, tạm dừng khi tab ẩn.

## 10. Lộ trình

1. **Giai đoạn 1:** Khung giao diện: header USAC, công tắc Cơ bản/Đầy đủ, 3 tab, canvas, panel đánh số, thanh trạng thái, thanh phổ, state chung.
2. **Giai đoạn 2:** Mô phỏng Nguyên tử phát photon (hiệu ứng ăn tiền nhất, dạy nền tảng).
3. **Giai đoạn 3:** Mô phỏng Cực quang theo độ cao.
4. **Giai đoạn 4:** Mô phỏng Ngọn lửa → kính phân quang.
5. **Giai đoạn 5:** Thử thách, quiz, lý thuyết 3 lớp, chỉnh mobile, rà soát nội dung.

## 11. Giữ lại từ bản cũ

- Theme tối và màu nhấn theo nguyên tố.
- Dữ liệu vạch phổ làm cơ sở dữ liệu cho mô phỏng (sau khi đối chiếu NIST).
- Phần "Nguyên lý vật lý" và "Ứng dụng" chuyển thành panel thông tin hoặc popup "Tìm hiểu thêm".

## 12. Tiêu chí hoàn thành

- Người mới vào hiểu cách dùng trong dưới 10 giây, không cần đọc hướng dẫn.
- Mỗi thao tác cho phản hồi thấy ngay trên canvas và thanh phổ.
- Không cuộn trang ở chế độ Cơ bản trên desktop.
- Giao diện nhìn là nhận ra cùng hệ với Astrosphere.
- Số liệu khoa học đã được đối chiếu nguồn và có người chuyên môn duyệt.

## 13. Câu lệnh mẫu để giao cho dev/AI

> "Chuyển trang học tập phát xạ hiện tại thành ứng dụng mô phỏng một màn hình theo phong cách Astrosphere của CLB Thiên văn USAC: header cố định có công tắc Cơ bản/Đầy đủ; 3 tab (Nguyên tử phát photon, Cực quang theo độ cao, Ngọn lửa → kính phân quang); canvas mô phỏng bên trái, panel điều khiển đánh số 1-2-3 bên phải; thanh trạng thái dưới canvas; thanh phổ 380-780 nm dùng chung phía dưới, cập nhật theo thời gian thực. Các tab dùng chung một state (nguyên tố, bước sóng đang chọn). Giữ theme tối, màu nhấn theo màu vạch phổ, hiệu ứng glow. Dùng dữ liệu vạch phổ hiện có (cần đối chiếu NIST). Bản đầu chưa cần WebGL, chế độ giáo viên hay so sánh nhiều nguyên tố."

## 14. Việc cần làm tiếp

- [ ] Xác nhận bố cục và 3 mô phỏng với nhóm.
- [ ] Gửi thêm ảnh/quay màn hình Astrosphere (chuyển tab, panel, mobile) để chỉnh sát hơn.
- [ ] Đối chiếu bảng vạch phổ với NIST và tài liệu cực quang.
- [ ] Chọn người rà soát nội dung khoa học.
- [ ] Dựng prototype: khung giao diện + Nguyên tử phát photon + thanh phổ.
