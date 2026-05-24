import { z } from 'zod';

export const meetingRoomValidationSchema = z.object({
  name: z.string().min(2, 'Tên phòng họp phải từ 2 ký tự').max(120, 'Tên phòng họp tối đa 120 ký tự'),
  roomCode: z.string().min(1, 'Vui lòng nhập mã phòng họp').max(50, 'Mã phòng họp tối đa 50 ký tự'),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ').max(255, 'Địa chỉ tối đa 255 ký tự'),
  capacity: z.coerce.number().min(1, 'Sức chứa phải lớn hơn 0'),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  description: z.string().optional(),
});

export type MeetingRoomFormData = z.infer<typeof meetingRoomValidationSchema>;
