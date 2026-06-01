-- =================================================================================
-- KỊCH BẢN SQL CHÈN DỮ LIỆU CUỘC HỌP KIỂM THỬ (TEST LỊCH HỌP)
-- =================================================================================
-- Hướng dẫn sử dụng:
-- 1. Kịch bản này tự động chèn dữ liệu kiểm thử cho cả 2 tài khoản:
--    - 'admin.hp' (Chủ tịch UBND thành phố)
--    - 'vpubnd.manager0' (Trưởng Phòng Tổng hợp)
--    Mật khẩu đăng nhập mặc định của cả hai tài khoản là: 12345678
-- 2. Chạy toàn bộ file SQL này trong Database Client (DBeaver, Navicat, Heidisql...)
--    kết nối tới Database `paperless_meeting` (Port 4406).
-- =================================================================================

USE paperless_meeting;

-- 1. TRUY VẤN CÁC KHÓA NGOẠI TỰ ĐỘNG CHO 2 USER TEST
SET @user_id_1 = (SELECT id FROM users WHERE username = 'admin.hp' AND is_deleted = b'0' LIMIT 1);
SET @user_id_2 = (SELECT id FROM users WHERE username = 'vpubnd.manager0' AND is_deleted = b'0' LIMIT 1);

SET @dept_id = (SELECT department_id FROM users WHERE username = 'vpubnd.manager0' AND is_deleted = b'0' LIMIT 1);
SET @location_id = (SELECT id FROM locations WHERE is_active = b'1' LIMIT 1);

-- Kiểm tra xem các ID có tìm thấy hợp lệ hay không
SELECT 
    @user_id_1 AS 'ID admin.hp', 
    @user_id_2 AS 'ID vpubnd.manager0', 
    @dept_id AS 'Dept ID sử dụng', 
    @location_id AS 'Location ID sử dụng';

-- 2. XÓA DỮ LIỆU KIỂM THỬ CŨ TRÙNG LẶP (ĐỂ TRÁNH DỮ LIỆU RÁC KHI CHẠY NHIỀU LẦN)
DELETE FROM meeting_participants 
WHERE meeting_id IN (
    SELECT id FROM meetings WHERE title LIKE '%(Test Lịch Họp)%'
);
DELETE FROM meetings WHERE title LIKE '%(Test Lịch Họp)%';


-- 3. CHÈN CUỘC HỌP 1: SẮP DIỄN RA (UPCOMING) & CHƯA XÁC NHẬN (PENDING)
-- Thời gian: Bắt đầu sau 2 tiếng, kết thúc sau 3.5 tiếng so với thời điểm hiện tại.
SET @meeting_id_1 = UUID();
INSERT INTO meetings (
    id, title, start_time, end_time, status, content, 
    created_by, location_id, dept_id, is_deleted, createdAt
) VALUES (
    @meeting_id_1, 
    'Họp rà soát tiến độ tuần mới (Test Lịch Họp)', 
    DATE_ADD(NOW(), INTERVAL 2 HOUR), 
    DATE_ADD(NOW(), INTERVAL 210 MINUTE), 
    'UPCOMING', 
    'Cuộc họp kiểm thử trạng thái Sắp diễn ra và chưa phản hồi lời mời (Pending). Thư mời hiển thị icon màu vàng hổ phách (Amber).', 
    @user_id_1, @location_id, @dept_id, b'0', NOW()
);

-- Thêm admin.hp làm thành viên cuộc họp với trạng thái PENDING
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_1, @user_id_1, 'PARTICIPANT', 'PENDING', 
    'NOT_CHECKED_IN', b'0', NOW(), NOW()
);

-- Thêm vpubnd.manager0 làm thành viên cuộc họp với trạng thái PENDING
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_1, @user_id_2, 'PARTICIPANT', 'PENDING', 
    'NOT_CHECKED_IN', b'0', NOW(), NOW()
);


-- 4. CHÈN CUỘC HỌP 2: ĐANG HỌP (IN_PROGRESS) & ĐÃ XÁC NHẬN (ACCEPTED)
-- Thời gian: Bắt đầu trước 1 tiếng, kết thúc sau 1.5 tiếng so với thời điểm hiện tại.
SET @meeting_id_2 = UUID();
INSERT INTO meetings (
    id, title, start_time, end_time, status, content, 
    created_by, location_id, dept_id, is_deleted, createdAt
) VALUES (
    @meeting_id_2, 
    'Hội nghị Chuyên đề Chuyển đổi số (Test Lịch Họp)', 
    DATE_SUB(NOW(), INTERVAL 1 HOUR), 
    DATE_ADD(NOW(), INTERVAL 90 MINUTE), 
    'IN_PROGRESS', 
    'Đánh giá tiến độ triển khai hạ tầng số và các ứng dụng dùng chung toàn thành phố. Trạng thái Đang họp (màu xanh lá) và đã xác nhận tham dự (icon màu Indigo).', 
    @user_id_1, @location_id, @dept_id, b'0', NOW()
);

-- Thêm admin.hp làm Chủ trì cuộc họp (CHAIR) với trạng thái ACCEPTED
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_2, @user_id_1, 'CHAIR', 'ACCEPTED', 
    'PRESENT', b'0', NOW(), NOW()
);

-- Thêm vpubnd.manager0 làm thành viên cuộc họp với trạng thái ACCEPTED
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_2, @user_id_2, 'PARTICIPANT', 'ACCEPTED', 
    'PRESENT', b'0', NOW(), NOW()
);


-- 5. CHÈN CUỘC HỌP 3: ĐÃ KẾT THÚC (CLOSED) & TỪ CHỐI THAM GIA (DECLINED)
-- Thời gian: Diễn ra ngày hôm qua.
SET @meeting_id_3 = UUID();
INSERT INTO meetings (
    id, title, start_time, end_time, status, content, 
    created_by, location_id, dept_id, is_deleted, createdAt
) VALUES (
    @meeting_id_3, 
    'Họp Sơ kết hoạt động quý I (Test Lịch Họp)', 
    DATE_SUB(NOW(), INTERVAL 1 DAY), 
    DATE_SUB(DATE_ADD(NOW(), INTERVAL 2 HOUR), INTERVAL 1 DAY), 
    'CLOSED', 
    'Đã kết thúc (màu đỏ) và người dùng từ chối tham gia (icon màu đỏ Rose/hồng).', 
    @user_id_1, @location_id, @dept_id, b'0', NOW()
);

-- Thêm admin.hp làm thành viên cuộc họp với trạng thái DECLINED
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_3, @user_id_1, 'PARTICIPANT', 'DECLINED', 
    'ABSENT', b'0', NOW(), NOW()
);

-- Thêm vpubnd.manager0 làm thành viên cuộc họp với trạng thái DECLINED
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_3, @user_id_2, 'PARTICIPANT', 'DECLINED', 
    'ABSENT', b'0', NOW(), NOW()
);


-- 6. CHÈN CUỘC HỌP 4: SẮP DIỄN RA (UPCOMING) & ĐÃ XÁC NHẬN (ACCEPTED)
-- Thời gian: Diễn ra ngày mai.
SET @meeting_id_4 = UUID();
INSERT INTO meetings (
    id, title, start_time, end_time, status, content, 
    created_by, location_id, dept_id, is_deleted, createdAt
) VALUES (
    @meeting_id_4, 
    'Thảo luận Đồ án quy hoạch đô thị mới (Test Lịch Họp)', 
    DATE_ADD(NOW(), INTERVAL 1 DAY), 
    DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), 
    'UPCOMING', 
    'Sắp diễn ra (màu xanh dương) và người dùng đã xác nhận tham dự (icon màu Indigo).', 
    @user_id_1, @location_id, @dept_id, b'0', NOW()
);

-- Thêm admin.hp làm thành viên cuộc họp với trạng thái ACCEPTED
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_4, @user_id_1, 'PARTICIPANT', 'ACCEPTED', 
    'NOT_CHECKED_IN', b'0', NOW(), NOW()
);

-- Thêm vpubnd.manager0 làm thành viên cuộc họp với trạng thái ACCEPTED
INSERT INTO meeting_participants (
    id, meeting_id, user_id, participant_role, invite_status, 
    attendance_status, is_deleted, created_at, updated_at
) VALUES (
    UUID(), @meeting_id_4, @user_id_2, 'PARTICIPANT', 'ACCEPTED', 
    'NOT_CHECKED_IN', b'0', NOW(), NOW()
);

-- =================================================================================
-- KIỂM TRA LẠI DỮ LIỆU VỪA CHÈN
-- =================================================================================
SELECT m.title, m.status, m.start_time, m.end_time, mp.user_id, u.username, mp.invite_status
FROM meetings m
JOIN meeting_participants mp ON m.id = mp.meeting_id
JOIN users u ON mp.user_id = u.id
WHERE m.title LIKE '%(Test Lịch Họp)%'
ORDER BY m.start_time;
