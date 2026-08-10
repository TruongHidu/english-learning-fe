import { BrowserRouter, Route, Routes } from 'react-router-dom'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <main className="flex min-h-screen items-center justify-center">
              <h1 className="text-4xl font-bold">English Learning</h1>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
