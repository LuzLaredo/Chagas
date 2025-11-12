import React from "react";
import { Navbar, NavbarContent, NavbarItem, Link } from "@heroui/react";
import { useLocation } from "react-router-dom";
import "./Navigation.css";

export const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { name: "Inicio", href: "/", active: location.pathname === "/" },
    { name: "Sobre Nosotros", href: "#", active: false },
    { name: "Denuncia", href: "#", active: false },
    { name: "Estadísticas", href: "#", active: false },
    { name: "Monitoreo", href: "#", active: false },
  ];

  return (
    <Navbar className="navbar-navigation" isBordered={false}>
      <NavbarContent className="navbar-content">
        {navItems.map((item) => (
          <NavbarItem key={item.name}>
            <Link 
              href={item.href}
              className={item.active ? "active" : ""}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>
    </Navbar>
  );
};
