// Giả định nghiệp vụ đặt phòng CHƯA CHỐT — gom một chỗ để đổi (docs/2026-10-12-booking-engine-db-phase0.md).
// Cọc % và thời gian giữ phòng KHÔNG ở đây: theo DepositPolicy của từng gói (admin sửa).

/** Trẻ dưới tuổi này ngủ chung không tính phụ thu (PITO: 1 trẻ < 6 tuổi). Vẫn tính vào sức chứa. */
export const FREE_CHILD_AGE = 6

/** MVP: một booking = một hạng phòng × tối đa N phòng. */
export const MAX_ROOMS_PER_BOOKING = 5

/** Một khách tối đa N booking đang chờ thanh toán cùng lúc (chống giữ hết phòng rồi bỏ). */
export const MAX_PENDING_PER_USER = 3

/** Tiền về sau khi hết giữ phòng: còn phòng thì tự xác nhận; hết phòng thì needsRefund + Refund chờ xử lý tay. */
export const CONFIRM_LATE_PAYMENT_IF_AVAILABLE = true

/** Gửi email báo booking mới tới Hotel.notifyEmail (bỏ qua nếu trống). */
export const NOTIFY_HOTEL = true
