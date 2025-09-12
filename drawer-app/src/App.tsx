import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DrawerPage from "@/pages/drawer";
import BlogPage from "@/pages/admin";
import AboutPage from "@/pages/about";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DrawerPage />} path="/drawer" /> 
      <Route element={<BlogPage />} path="/admin" />
      <Route element={<AboutPage />} path="/about" />
    </Routes>
  );
}

export default App;
