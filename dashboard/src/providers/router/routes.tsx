import Loader from "@/share/components/loader";
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

// Layout
const ErrorLoyout = lazy(() => import("../layouts/ErrorLoyout"));
const RootLayout = lazy(() => import("../layouts/RootLayout"));

// Pages
const LoginPage = lazy(() => import("@/pages/login/ui/loginPage"));
const HomePage = lazy(() => import("@/pages/home/ui/homePage"));
const UsersPage = lazy(() => import("@/pages/users/ui/usersPage"));
const DocumentsPage = lazy(() => import("@/pages/documents/ui/documentsPage"));
const SubscriptionsPage = lazy(() => import("@/pages/subscriptions/ui/subscriptionsPage"));
const PaymentsPage = lazy(() => import("@/pages/payments/ui/paymentsPage"));

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
                    }
                ]
            }
        ]
    }
]);

export default router;