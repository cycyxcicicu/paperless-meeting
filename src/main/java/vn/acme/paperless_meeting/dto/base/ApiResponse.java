package vn.acme.paperless_meeting.dto.base;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ApiResponse là lớp generic đại diện cho cấu trúc chuẩn của phản hồi từ API.
 *
 * <p>Mục đích:</p>
 * <ul>
 *   <li>Đảm bảo tất cả API đều trả về cùng một format.</li>
 *   <li>Giúp frontend dễ dàng parse và xử lý response.</li>
 * </ul>
 *
 * <p>Cấu trúc JSON ví dụ:</p>
 * <pre>
 * {
 *   "code": "SUCCESS",
 *   "message": "Lấy dữ liệu thành công",
 *   "data": {
 *     "id": 1,
 *     "name": "Nguyen Van A"
 *   }
 * }
 * </pre>
 *
 * @param <T> Kiểu dữ liệu của trường {@code data}. Sử dụng class trong DTO để đảm bảo tính ổn định.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse<T> {
    private boolean success;
    private int code;     
    private String message;  
    private T data;          

    // factory methods tiện dùng
    /**
     * Tạo phản hồi thành công.
     * @param data Dữ liệu trả về (Payload)
     * @return Đối tượng ApiResponse chứa dữ liệu và trạng thái thành công
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, 67, null, data);
    }

    /**
     * Tạo phản hồi lỗi.
     * @param code Mã lỗi hệ thống/nghiệp vụ
     * @param message Thông báo lỗi chi tiết
     * @return Đối tượng ApiResponse chứa thông tin lỗi
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(false, code, message, null);
    }
}

