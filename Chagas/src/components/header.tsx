import React from "react";
import { Navbar, NavbarBrand, NavbarContent, Button, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import "./Header.css";

export const Header: React.FC = () => {
  return (
    <Navbar className="header-navbar" isBordered={false}>
      <div className="header-container">
        {/* Logo a la izquierda - IMAGEN MÁS GRANDE */}
        <NavbarBrand className="header-brand">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSbUfAHOp_dE23S-nYw-A7pLi1gP9kHbWoNA&s" 
            className="h-24" // Cambiado a h-24 (96px)
          />
        </NavbarBrand>

        {/* Iconos a la derecha */}
        <div className="header-icons-container">
          <NavbarContent className="header-icons" justify="end">
            {/* Icono de notificación con borde rectangular y sin badge */}
            <Button isIconOnly variant="light" radius="md" className="btn-notification">
              <Icon icon="lucide:bell" />
            </Button>

            {/* Icono de usuario con borde circular y fondo blanco */}
            <Button isIconOnly variant="light" radius="full" className="btn-user">
              <Icon icon="lucide:user" />
            </Button>
          </NavbarContent>
        </div>
      </div>
    </Navbar>
  );
};