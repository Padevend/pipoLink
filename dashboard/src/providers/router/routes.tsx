import Loader from "@/components/loader";
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

// Layout
const ErrorLoyout = lazy(() => import("../layouts/ErrorLoyout"));
const RootLayout = lazy(() => import("../layouts/RootLayout"));

// Pages
const LoginPage = lazy(() => import("@/pages/login/ui/login_page"));
const HomePage = lazy(() => import("@/pages/home/ui/home_page"));
const UsersPage = lazy(() => import("@/pages/users/ui/users_page"));
const DocumentsPage = lazy(() => import("@/pages/documents/ui/documents_page"));
const SubscriptionsPage = lazy(() => import("@/pages/subscriptions/ui/subscriptions_page"));
const PaymentsPage = lazy(() => import("@/pages/payments/ui/payments_page"));
const UpdatesPage = lazy(() => import("@/pages/updates/ui/updates_page"));
const NotificationsPage = lazy(() => import("@/pages/notifications/ui/notifications_page"));

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />
    },
    {
        path: "/",
        element: <Loader />,
        errorElement: <ErrorLoyout />,
        children: [
            {
                path: "",
                element: <RootLayout />,
                children: [
                    {
                        index: true,
                        element: <HomePage />
                    },
                    {
                        path: "users",
                        element: <UsersPage />
                    },
                    {
                        path: "documents",
                        element: <DocumentsPage />
                    },
                    {
                        path: "subscriptions",
                        element: <SubscriptionsPage />
                    },
                    {
                        path: "payments",
                        element: <PaymentsPage />
                    },
                    {
                        path: "updates",
                        element: <UpdatesPage />
                    },
                    {
                        path: "notifications",
                        element: <NotificationsPage />
                    }
                ]
            }
        ]
    }
]);

export default router;