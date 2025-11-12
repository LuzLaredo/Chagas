import Navbar from "../pages/NavBar"; 
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Navbar />
      <main className="p-4">
        <Outlet /> {/* Aquí se mostrarán las páginas */}
      </main>
    </div>
  );
}

export default Layout;
