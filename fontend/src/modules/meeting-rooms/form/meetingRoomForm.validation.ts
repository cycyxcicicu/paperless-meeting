import { z } from 'zod';

export const meetingRoomValidationSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phòng họp'),
  code: z.string().min(1, 'Vui lòng nhập mã phòng họp'),
  building: z.string().min(1, 'Vui lòng nhập tên tòa nhà'),
  floor: z.string().min(1, 'Vui lòng nhập tầng'),
  capacity: z.coerce.number().min(1, 'Sức chứa phải lớn hơn 0'),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional(),
});

export type MeetingRoomFormData = z.infer<typeof meetingRoomValidationSchema>;
