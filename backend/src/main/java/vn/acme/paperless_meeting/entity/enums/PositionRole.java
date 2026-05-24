package vn.acme.paperless_meeting.entity.enums;

public enum PositionRole {
    // UBND thành phố
    CHAIRMAN_CITY,                  // Chủ tịch UBND TP
    VICE_CHAIRMAN_CITY,             // Phó Chủ tịch UBND TP
    MEMBER_CITY_COMMITTEE,          // Ủy viên UBND TP

    // Cấp Sở / cơ quan tương đương Sở
    HEAD_OF_DEPARTMENT_LEVEL,       // Giám đốc Sở / Chánh VP / Chánh Thanh tra / Trưởng ban
    DEPUTY_OF_DEPARTMENT_LEVEL,     // Phó Giám đốc / Phó Chánh VP / Phó Chánh Thanh tra / Phó Trưởng ban

    // Cấp Chi cục / đơn vị trực thuộc Sở
    HEAD_OF_SUB_DEPARTMENT,         // Chi cục trưởng / Giám đốc trung tâm trực thuộc Sở
    DEPUTY_OF_SUB_DEPARTMENT,       // Phó Chi cục trưởng / Phó Giám đốc trung tâm

    // Cấp phòng chuyên môn
    HEAD_OF_DIVISION,               // Trưởng phòng
    DEPUTY_OF_DIVISION,             // Phó trưởng phòng

    // Chức vụ đặc thù trong đơn vị sự nghiệp/trung tâm
    HEAD_OF_PUBLIC_UNIT,            // Giám đốc trung tâm / Hiệu trưởng / Viện trưởng
    DEPUTY_OF_PUBLIC_UNIT,          // Phó Giám đốc trung tâm / Phó Hiệu trưởng

    // Nhân sự chuyên môn
    SENIOR_SPECIALIST,              // Chuyên viên chính / chuyên viên cao cấp
    SPECIALIST,                     // Chuyên viên
    STAFF                           // Nhân viên / cán sự / hợp đồng / văn thư
}
