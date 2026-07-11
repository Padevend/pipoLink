import { RouterProvider } from "react-router-dom";
import router from "./providers/router/routes";
import ToastProvider from "./providers/toast/toastProvider";
import { AuthProvider } from "./providers/auth/authContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>

        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>

      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App
