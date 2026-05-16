export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    '/',
    '/nguoi-dung',
    '/nguoi-dung/*',
    '/cau-hinh',
    '/phong-hop',
    '/phong-hop/*',
    '/phien-hop',
    '/phien-hop/*'
  ],
  MANAGER: [
    '/',
    '/phong-hop',
    '/phong-hop/*',
    '/phien-hop',
    '/phien-hop/*'
  ],
  USER: [
    '/',
    '/phien-hop',
    '/phien-hop/*'
  ]
};
