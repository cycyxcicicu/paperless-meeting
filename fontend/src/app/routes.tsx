import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import AuditLogPage from "./pages/AuditLogPage";
import CauHinhPage from "./pages/CauHinhPage";
import ChucVuPage from "./pages/ChucVuPage";
import DienBienPhienHopPage from "./pages/DienBienPhienHopPage";
import DonViPage from "./pages/DonViPage";
import HomePage from "./pages/HomePage";
import LichHopPage from "./pages/LichHopPage";
import LoginPage from "./pages/LoginPage";
import NguoiDungPage from "./pages/NguoiDungPage";
import NotFoundPage from "./pages/NotFoundPage";
import PhienHopChiTietPage from "./pages/PhienHopChiTietPage";
import PhienHopPage from "./pages/PhienHopPage";
import PhienHopSapDienRaPage from "./pages/PhienHopSapDienRaPage";
import PhongHopPage from "./pages/PhongHopPage";
import PhongHopTaiLieuPage from "./pages/PhongHopTaiLieuPage";
import TaoPhienHopPage from "./pages/TaoPhienHopPage";
import VaiTroPage from "./pages/VaiTroPage";

export const router = createBrowserRouter([
    {
        path: "/login",
        Component: LoginPage,
    },
    {
        path: "/",
        Component: MainLayout,
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
                path: "phien-hop/:id/sap-dien-ra",
                Component: PhienHopSapDienRaPage,
            },
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
