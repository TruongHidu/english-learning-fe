# Tích hợp SePay frontend

## Phạm vi và kiến trúc

- React 19 + TypeScript, React Router, React Query, Axios dùng chung; kiểm thử bằng Vitest và Testing Library. Repository chưa có framework E2E hoặc formatter riêng.
- VNPay vẫn là lựa chọn mặc định. `checkout()` giữ endpoint `/payments/vnpay/checkout`, payload `{ packageId }`, metadata sessionStorage và `browserNavigation.assign(paymentUrl)`. Có thêm alias `checkoutVnpay()`; component cũ tiếp tục dùng `checkout()` để giữ tương thích.
- Trang `PaymentResultPage.tsx` và toàn bộ kiểm tra `signatureValid`, `returnResult`, `paymentId`, `transactionCode` không thay đổi. SePay không chuyển hướng vào callback VNPay.
- SePay dùng `/payments/sepay/checkout`, chỉ gửi `packageId`. Type riêng và type guard kiểm tra metadata, HTTPS URL, số tiền nguyên dương, thông tin ngân hàng trước khi mở QR. Retry được phân nhánh theo phương thức của giao dịch; không dùng QR response làm URL redirect.
- Axios hiện có tiếp tục gắn Bearer token, gửi cookie và xử lý refresh token. Không có client thứ hai hoặc thay đổi backend.

## Pending, retry và lưu trữ

Shop lấy pending từ backend; pending chặn checkout mới và hiển thị phương thức, gói, giá, thời hạn. Nút **THANH TOÁN HOẶC HỦY** mở lịch sử để người dùng tiếp tục/hủy giao dịch. Khi checkout gặp `PAYMENT_PENDING_EXISTS`, frontend tải lại pending rồi mở lịch sử kèm thông báo.

Nút **Thanh toán lại** gọi retry chỉ khi người dùng bấm. VNPay kiểm tra URL rồi redirect theo luồng cũ. SePay kiểm tra paymentId/transactionCode không đổi rồi mở QR và expiresAt mới từ retry. Hủy luôn cần xác nhận.

Dữ liệu SePay chỉ tồn tại trong bộ nhớ, gắn với tài khoản hiện tại. Không ghi QR/thông tin ngân hàng vào sessionStorage hoặc localStorage. Sau reload, shop lấy lại pending và người dùng chủ động tiếp tục để nhận QR mới. Đổi tài khoản/logout đóng QR, xóa state và abort request; query pending/history có userId trong key để không dùng dữ liệu tài khoản trước.

## Polling và số dư

`useSepayPolling` gọi detail ngay khi mở QR, rồi đặt timeout 3 giây sau khi request trước hoàn tất. Không chồng request; lỗi mạng tăng khoảng chờ 6/12/24/30 giây. Detail request có timeout 15 giây. Tab ẩn dừng lịch gọi tiếp theo, tab hiện lại kiểm tra ngay. Terminal status, 404, lỗi xác thực cuối cùng, tài khoản không hoạt động hoặc detail sai cấu trúc dừng polling. Không phát toast cho từng lần poll lỗi.

Countdown dùng Date.now và expiresAt của server qua hook hiện có. Deadline kích hoạt kiểm tra detail thêm một lần; frontend không tự kết luận EXPIRED. Sau deadline, ẩn thông tin chuyển khoản và chờ trạng thái thực tế. Nút **Tôi đã chuyển khoản** chỉ refetch detail.

SUCCESS dừng polling/countdown, tải `/shop`, cập nhật React Query cache và `updateCachedUser({ stats: shop.user })` để đồng bộ kim cương navbar/shop. Nếu tải số dư lỗi, hiển thị nút tải lại. Khi unmount, timers/listener và request đang chạy được cleanup. Các phản hồi muộn không cập nhật state/cache của màn hình đã đóng.

## File thay đổi

- `src/types/payment.types.ts`
- `src/services/payment.service.ts`
- `src/services/shop.service.ts`
- `src/utils/checkout-validation.ts`
- `src/utils/payment-errors.ts`
- `src/hooks/useSepayPolling.ts`
- `src/components/payment/SepayCheckout.tsx`
- `src/components/payment/SepayCheckout.css`
- `src/pages/shop/ShopPage.tsx`
- `src/pages/payment/PaymentHistoryPage.tsx`
- `src/services/payment.service.test.ts`
- `src/utils/checkout-validation.test.ts`
- `src/components/payment/SepayCheckout.test.tsx`
- `src/pages/shop/ShopPage.test.tsx`
- `src/pages/payment/PaymentHistoryPage.test.tsx`
- `src/test/payment-fixtures.ts`
- `README.md`
- `docs/sepay-integration.md`

Assertions regression VNPay cũ được giữ nguyên. Test history bổ sung auth mock vì trang nay cần nhận biết tài khoản để cleanup SePay.

## Kiểm tra tự động

- Baseline: 62 tests qua.
- Sau thay đổi: 97 tests / 16 files qua, bao gồm regression trang kết quả VNPay, endpoint/payload, redirect, pending/retry, double click, malformed response, QR/copy, polling/backoff/deadline, terminal status, hủy có xác nhận, số dư và cleanup khi unmount/đổi tài khoản/logout.
- `npx.cmd tsc -b`: qua; production build cũng chạy typecheck.
- `npm.cmd run lint`: qua, còn cảnh báo có sẵn về dependency `onChange` trong `src/components/lesson/OrderSentenceQuestion.tsx:51`.
- `npm.cmd run build`: qua; Vite cảnh báo bundle chính lớn hơn 500 kB.
- Quét source, environment và bundle không thấy cấu hình secret SePay/HMAC hay endpoint webhook SePay.
- `git diff --check`: qua. Không có formatter script/config riêng để chạy.

## Cấu hình và kiểm thử thủ công

Frontend chỉ cần biến hiện có:

```dotenv
VITE_API_BASE_URL=https://hiducourse.click/api/v1
```

Không cần biến SePay riêng. Không đưa khóa bí mật của server vào frontend. Origin frontend cần được backend hiện có cho phép theo cấu hình CORS/cookie.

1. Cấu hình API base URL trên môi trường kiểm thử, chạy `npm.cmd run dev`, đăng nhập và mở `/shop`.
2. Chọn gói; xác nhận giá/tổng kim cương lấy từ shop, VNPay được chọn mặc định. Bấm tiếp tục, kiểm tra Network gọi endpoint VNPay cũ với chỉ packageId và redirect đến paymentUrl. Kiểm tra callback/result và số dư như trước.
3. Quay lại shop khi không còn pending. Chọn SePay: đổi radio chưa được gọi checkout. Bấm tiếp tục hai lần nhanh: chỉ có một request checkout, không redirect.
4. Kiểm tra QR, ngân hàng, tài khoản, chủ tài khoản, tiền, nội dung chuyển khoản, copy, alt text, ảnh lỗi, thời gian còn lại. Kiểm tra bàn phím Tab/Shift+Tab/Escape và màn hình mobile.
5. Khi chưa chuyển tiền, bấm **Tôi đã chuyển khoản**: chỉ gọi detail và vẫn chờ. Ẩn/hiện tab để kiểm tra polling; tắt/bật mạng để kiểm tra backoff và phục hồi.
6. Nếu thực hiện thanh toán kiểm thử được cho phép, chuyển đúng tiền/nội dung, chờ backend trả SUCCESS. Xác nhận thông báo thành công, số dư navbar/shop, không còn polling/countdown và có nút trở về cửa hàng.
7. Reload khi pending: chỉ lấy pending, không tự retry. Mở lịch sử rồi bấm **Thanh toán lại**: SePay nhận QR/expiry từ retry; VNPay vẫn redirect. Kiểm tra paymentId/transactionCode không đổi.
8. Thử hủy: phải có xác nhận trước POST cancel. Kiểm tra FAILED/CANCELLED/EXPIRED qua fixture/mock hoặc trạng thái backend tương ứng. Khi hết countdown, detail quyết định trạng thái, không có request gửi EXPIRED.
9. Tạo pending ở tab khác rồi checkout để kiểm tra 409: được đưa đến quản lý giao dịch cũ, không tạo thêm giao dịch. Kiểm tra SePay chưa cấu hình vẫn cho phép chọn VNPay.
10. Rời trang, logout hoặc đổi tài khoản trong lúc chờ: không còn poll ngầm, không hiển thị QR/số dư từ tài khoản trước.

Chưa chạy giao dịch ngân hàng thật hoặc xác nhận trên production; automated tests dùng mock. Chưa có kiểm thử E2E trong trình duyệt hoặc xác nhận trực quan trên thiết bị thật. Không deploy production và không sửa backend.
