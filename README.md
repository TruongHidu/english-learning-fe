# LingoFox Frontend

Frontend học tiếng Anh viết bằng React, TypeScript và Vite.

## Chạy local

Yêu cầu Node.js tương thích với Vite 8. Cài dependencies và tạo file `.env`:

```bash
npm install
cp .env.example .env
npm run dev
```

Biến môi trường bắt buộc:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Frontend không chứa và không cần VNPay secret. Mọi chữ ký, số tiền và thông tin gói thanh toán đều do backend xác thực và tạo.

## Thanh toán gói kim cương qua VNPay Sandbox

- Cửa hàng: `/shop`
- Kết quả do backend chuyển hướng về: `/payment/result`
- Lịch sử giao dịch: `/payments/history`
- Chi tiết giao dịch nội bộ: `/payments/:paymentId`

Khi người dùng xác nhận mua, frontend chỉ gửi `{ "packageId": "..." }` tới `POST /payments/vnpay/checkout`. Sau khi nhận kết quả, frontend lưu `paymentId`, `transactionCode` và thời điểm tạo vào `sessionStorage` với key `english-learning.pending-payment`, rồi chuyển trình duyệt tới `paymentUrl` bằng `window.location.assign`.

Backend xử lý Return URL và commit kết quả trước khi redirect về frontend. Trang kết quả không
tin query string để kết luận thành công; luôn gọi GET /payments/:paymentId có JWT một lần.
Không polling tự động. PENDING hoặc lỗi mạng có nút kiểm tra lại thủ công (chỉ đọc database).
SUCCESS tải lại shop và đồng bộ số dư một lần; FAILED/CANCELLED/EXPIRED không cộng số dư.
Chỉ xóa pending payment khỏi sessionStorage khi API trả trạng thái terminal.

Return mang signatureValid, returnResult (processed/invalid/not_found/error), paymentId và
transactionCode nếu hợp lệ. Các giá trị này chỉ dùng để điều hướng/cảnh báo; trạng thái
hiển thị phải đến từ API có kiểm tra quyền sở hữu. Return lỗi không được suy ra SUCCESS.

## Backend và Return URL

Trong cấu hình local mặc định:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1`

Return URL local: http://localhost:5000/api/v1/payments/vnpay/return. Trình duyệt phải chạy
trên cùng máy với backend. Không cần IPN/tunnel cho cấu hình local này. Backend xác minh
chữ ký và cập nhật giao dịch trước khi redirect về http://localhost:5173/payment/result.

Luồng chỉ dành cho môn học/sandbox. Không có IPN/queryDR/đối soát; nếu đóng tab hoặc mất mạng
trước Return, giao dịch có thể vẫn PENDING dù đã thanh toán. Không dùng cho production.

## Test thủ công với VNPay Sandbox

1. Chạy backend với cấu hình VNPay Sandbox và chạy frontend bằng `npm run dev`.
2. Đăng nhập bằng tài khoản người dùng, mở `/shop` và chọn một gói đang hoạt động.
3. Kiểm tra hộp xác nhận hiển thị đúng gói, tổng kim cương và giá; tiếp tục tới VNPay.
4. Hoàn tất, hủy hoặc để giao dịch hết hạn trên Sandbox.
5. Khi quay lại `/payment/result`, kiểm tra thông báo SUCCESS/FAILED/CANCELLED/EXPIRED theo trạng thái lấy từ API.
6. Với giao dịch thành công, kiểm tra số dư navbar/shop được tải lại từ backend; với các trạng thái khác, số dư không thay đổi.
7. Mở `/payments/history` để kiểm tra trạng thái, phân trang và màn hình chi tiết.
8. Có thể thử sửa `signatureValid`, `paymentId` hoặc `transactionCode` trên URL để xác nhận frontend không suy ra thành công từ query string.

## Kiểm tra chất lượng

```bash
npm run test
npm run lint
npm run build
```
