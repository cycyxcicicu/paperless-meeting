package vn.acme.paperless_meeting.service.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

public class ErrorLogger {

    // Đường dẫn file vẫn giữ nguyên
    private static final String LOG_FILE_PATH = System.getProperty("user.home") + "/Documents/traveling-error.log";

    public static void logError(Exception e) {
        // Sử dụng phương thức log chính đã được cập nhật để ghi UTF-8
        try (PrintWriter pw = getUtf8PrintWriter()) {

            pw.println("[" + LocalDateTime.now() + "] ERROR");
            pw.println("Type : " + e.getClass().getName());
            pw.println("Message : " + e.getMessage());

            Throwable cause = findRootCause(e);
            if (cause != e) {
                pw.println("Root cause : " + cause.getClass().getName() + " - " + cause.getMessage());
            }

            pw.println(); // dòng trống cho dễ đọc

        } catch (IOException io) {
            io.printStackTrace(); // fallback
        }
    }

    public static void logMessage(String message) {
        // Sử dụng phương thức log chính đã được cập nhật để ghi UTF-8
        try (PrintWriter pw = getUtf8PrintWriter()) {

            pw.println("[" + LocalDateTime.now() + "] INFO");
            pw.println(message);
            pw.println();

        } catch (IOException io) {
            io.printStackTrace();
        }
    }

    /**
     * Helper method để tạo PrintWriter ghi với mã hóa UTF-8.
     */
    private static PrintWriter getUtf8PrintWriter() throws IOException {
        File file = new File(LOG_FILE_PATH);

        // Tạo thư mục cha nếu chưa có
        File parentDir = file.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs();
        }

        // Tạo file nếu chưa có
        if (!file.exists()) {
            file.createNewFile();
        }

        FileOutputStream fos = new FileOutputStream(file, true);
        OutputStreamWriter osw = new OutputStreamWriter(fos, StandardCharsets.UTF_8);

        return new PrintWriter(osw);
    }

    private static Throwable findRootCause(Throwable t) {
        Throwable cause = t;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause;
    }
}