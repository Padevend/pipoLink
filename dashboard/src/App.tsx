import { RouterProvider } from "react-router-dom"
import router from "./providers/router/routes"
import ToastProvider from "./providers/toast/toastProvider"

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}

export default App
