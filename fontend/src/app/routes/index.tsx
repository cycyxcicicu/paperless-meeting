import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from '@/common/components/layout/MainLayout';
import { ProtectedRoute } from "./ProtectedRoute";

import AuditLogPage from '@/modules/audit/pages/AuditLogPage';
import CauHinhPage from '@/modules/settings/pages/CauHinhPage';
import ChucVuPage from '@/modules/positions/pages/ChucVuPage';
import DienBienPhienHopPage from '@/modules/meeting/pages/DienBienPhienHopPage';
import DonViPage from '@/modules/organization/pages/DonViPage';
import HomePage from "../pages/HomePage";
import LichHopPage from '@/modules/calendar/pages/LichHopPage';
import LoginPage from "../pages/LoginPage";
import NguoiDungPage from '@/modules/user/pages/NguoiDungPage';
import NotFoundPage from "../pages/NotFoundPage";
import PhienHopChiTietPage from '@/modules/meeting/pages/PhienHopChiTietPage';
import PhienHopPage from '@/modules/meeting/pages/PhienHopPage';

import PhongHopPage from '@/modules/meeting-rooms/pages/PhongHopPage';
import PhongHopTaiLieuPage from '@/modules/meeting/pages/PhongHopTaiLieuPage';
import TaoPhienHopPage from '@/modules/meeting/pages/TaoPhienHopPage';
import VaiTroPage from '@/modules/role/pages/VaiTroPage';

export const router = createBrowserRouter([
    {
        path: "/login",
        Component: LoginPage,
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, Component: HomePage },
            { path: "nguoi-dung", Component: NguoiDungPage },
            { path: "nguoi-dung/vai-tro", Component: VaiTroPage },
            { path: "nguoi-dung/don-vi", Component: DonViPage },
            { path: "nguoi-dung/chuc-vu", Component: ChucVuPage },
            { path: "nguoi-dung/lich-su", Component: AuditLogPage },
            { path: "lich-hop", element: <Navigate to="/phong-hop" replace /> },
            { path: "quan-tri", element: <Navigate to="/" replace /> },
            { path: "cau-hinh", Component: CauHinhPage },
            { path: "phong-hop", Component: LichHopPage },
            { path: "phong-hop/dia-diem", Component: PhongHopPage },
            { path: "phong-hop/tai-lieu", Component: PhongHopTaiLieuPage },
            { path: "phong-hop/tai-lieu/:type", Component: PhongHopTaiLieuPage },
            { path: "phien-hop", Component: PhienHopPage },
            { path: "phien-hop/tao-moi", Component: TaoPhienHopPage },
            { path: "phien-hop/:id/cap-nhat", Component: TaoPhienHopPage },

            {
                path: "phien-hop/:id/dien-bien",
                Component: DienBienPhienHopPage,
            },
            { path: "phien-hop/:id", Component: PhienHopChiTietPage },
            { path: "phien-hop/tai-lieu", Component: PhongHopTaiLieuPage },
            { path: "phien-hop/tai-lieu/:type", Component: PhongHopTaiLieuPage },
            { path: "phien-hop/phieu-lay-y-kien", Component: PhienHopPage },
            { path: "*", Component: NotFoundPage },
        ],
    },
]);
