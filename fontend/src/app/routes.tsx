import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import NguoiDungPage from './pages/NguoiDungPage';
import VaiTroPage from './pages/VaiTroPage';
import DonViPage from './pages/DonViPage';
import LichHopPage from './pages/LichHopPage';
import CauHinhPage from './pages/CauHinhPage';
import PhongHopPage from './pages/PhongHopPage';
import PhienHopPage from './pages/PhienHopPage';
import TaoPhienHopPage from './pages/TaoPhienHopPage';
import PhienHopChiTietPage from './pages/PhienHopChiTietPage';
import PhienHopSapDienRaPage from './pages/PhienHopSapDienRaPage';
import DienBienPhienHopPage from './pages/DienBienPhienHopPage';
import BieuQuyetPage from './pages/BieuQuyetPage';
import TaiLieuPage from './pages/TaiLieuPage';
import ChucVuPage from './pages/ChucVuPage';
import AuditLogPage from './pages/AuditLogPage';
import NotFoundPage from './pages/NotFoundPage';
import ComponentShowcase from './pages/ComponentShowcase';
import ComponentShowcasePage from './pages/ComponentShowcasePage';
import LoginPage from './pages/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'nguoi-dung', Component: NguoiDungPage },
      { path: 'nguoi-dung/vai-tro', Component: VaiTroPage },
      { path: 'nguoi-dung/don-vi', Component: DonViPage },
      { path: 'nguoi-dung/chuc-vu', Component: ChucVuPage },
      { path: 'nguoi-dung/lich-su', Component: AuditLogPage },
      { path: 'lich-hop', element: <Navigate to="/phong-hop" replace /> },
      { path: 'quan-tri', element: <Navigate to="/" replace /> },
      { path: 'cau-hinh', Component: CauHinhPage },
      { path: 'phong-hop', Component: LichHopPage },
      { path: 'phong-hop/dia-diem', Component: PhongHopPage },
      { path: 'phien-hop', Component: PhienHopPage },
      { path: 'phien-hop/tao-moi', Component: TaoPhienHopPage },
      { path: 'phien-hop/:id/cap-nhat', Component: TaoPhienHopPage },
      { path: 'phien-hop/:id/sap-dien-ra', Component: PhienHopSapDienRaPage },
      { path: 'phien-hop/:id/dien-bien', Component: DienBienPhienHopPage },
      { path: 'phien-hop/:id', Component: PhienHopChiTietPage },
      { path: 'bieu-quyet', Component: BieuQuyetPage },
      { path: 'tai-lieu', Component: TaiLieuPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
  {
    path: '/components-old',
    Component: ComponentShowcase,
  },
  {
    path: '/components',
    Component: ComponentShowcasePage,
  },
]);