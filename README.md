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

Trang kết quả không tin query string để kết luận thanh toán thành công. Trang luôn gọi `GET /payments/:paymentId`; trạng thái `PENDING` được kiểm tra lại mỗi 2 giây, tối đa 15 lần hoặc 30 giây. Khi backend xác nhận `SUCCESS`, frontend tải lại shop và đồng bộ số dư toàn cục đúng một lần. Hết thời gian chờ không đồng nghĩa với thất bại; người dùng có thể kiểm tra lại hoặc mở lịch sử.

## Backend, callback và tunnel

Trong cấu hình local mặc định:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1`

Frontend không cần public tunnel. Nếu VNPay cần gọi IPN từ Internet, tunnel phải trỏ tới callback/IPN của backend; backend chịu trách nhiệm cấu hình URL callback, xác minh chữ ký và redirect trình duyệt về frontend.

## Test thủ công với VNPay Sandbox

1. Chạy backend với cấu hình VNPay Sandbox và chạy frontend bằng `npm run dev`.
2. Đăng nhập bằng tài khoản người dùng, mở `/shop` và chọn một gói đang hoạt động.
3. Kiểm tra hộp xác nhận hiển thị đúng gói, tổng kim cương và giá; tiếp tục tới VNPay.
4. Hoàn tất, hủy hoặc để giao dịch hết hạn trên Sandbox.
5. Khi quay lại `/payment/result`, kiểm tra giao diện chờ nếu IPN chưa tới và trạng thái cuối lấy từ API.
6. Với giao dịch thành công, kiểm tra số dư navbar/shop được tải lại từ backend; với các trạng thái khác, số dư không thay đổi.
7. Mở `/payments/history` để kiểm tra trạng thái, phân trang và màn hình chi tiết.
8. Có thể thử sửa `signatureValid`, `paymentId` hoặc `transactionCode` trên URL để xác nhận frontend không suy ra thành công từ query string.

## Kiểm tra chất lượng

```bash
npm run test
npm run lint
npm run build
```
