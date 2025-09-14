import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DrawerPage from "@/pages/drawer";
import ClassroomsPage from "@/pages/classrooms";
import AboutPage from "@/pages/about";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DrawerPage />} path="/drawer" /> 
      <Route element={<ClassroomsPage />} path="/classrooms" />
      <Route element={<AboutPage />} path="/about" />
    </Routes>
  );
}

export default App;
