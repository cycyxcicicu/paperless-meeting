package vn.acme.paperless_meeting.service.User;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import vn.acme.paperless_meeting.dto.request.user.UserCreateRequest;
import vn.acme.paperless_meeting.dto.request.user.UserUpdateRequest;
import vn.acme.paperless_meeting.dto.response.user.UserResponse;
import vn.acme.paperless_meeting.entity.User;
import vn.acme.paperless_meeting.entity.enums.UserStatus;
import vn.acme.paperless_meeting.exceptions.AppException;
import vn.acme.paperless_meeting.exceptions.ErrorCode;
import vn.acme.paperless_meeting.mapper.user.UserMapper;
import vn.acme.paperless_meeting.repository.UserRepository;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    public void register(UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new AppException(ErrorCode.USER_EXISTED);

        if (userRepository.existsByEmail(request.getEmail()))
            throw new AppException(ErrorCode.EMAIL_EXISTED);

        if (userRepository.existsByPhone(request.getPhone()))
            throw new AppException(ErrorCode.PHONE_EXISTED);
        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPasswordHash()));
        userRepository.save(user);
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse findById(UUID id) {
        return userMapper.toResponse(getUser(id));
    }

    public UserResponse create(UserCreateRequest request) {
        validateDuplicatedFields(request.getUsername(), request.getEmail(), request.getPhone(), null);

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPasswordHash()));

        return userMapper.toResponse(userRepository.save(user));
    }

    public UserResponse update(UUID id, UserUpdateRequest request) {
        User user = getUser(id);

        validateDuplicatedFields(request.getUsername(), request.getEmail(), request.getPhone(), id);

        userMapper.updateEntity(request, user);
        if (request.getPasswordHash() != null && !request.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPasswordHash()));
        }

        return userMapper.toResponse(userRepository.save(user));
    }

    public void delete(UUID id) {
        User user = getUser(id);
        userRepository.delete(user);
    }

    public User getUserByUsername() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByUsernameAndStatus(username, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return user;
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private void validateDuplicatedFields(String username, String email, String phone, UUID id) {
        boolean existedUsername = id == null
                ? userRepository.existsByUsername(username)
                : userRepository.existsByUsernameAndIdNot(username, id);
        if (existedUsername) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        boolean existedEmail = id == null
                ? userRepository.existsByEmail(email)
                : userRepository.existsByEmailAndIdNot(email, id);
        if (existedEmail) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        boolean existedPhone = id == null
                ? userRepository.existsByPhone(phone)
                : userRepository.existsByPhoneAndIdNot(phone, id);
        if (existedPhone) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
    }

}
