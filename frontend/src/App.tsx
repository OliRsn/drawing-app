import { Route, Routes } from "react-router-dom";

import DrawerPage from "@/pages/drawer";
import AdminPage from "@/pages/admin";

function App() {
  return (
    <Routes>
      <Route element={<DrawerPage />} path="/" />
      <Route element={<AdminPage />} path="/admin" />
    </Routes>
  );
}

export default App;
