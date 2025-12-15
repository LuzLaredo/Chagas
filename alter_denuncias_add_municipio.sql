-- =====================================
-- AGREGAR CAMPO municipio_id A TABLA Denuncias
-- =====================================
-- Este script agrega el campo municipio_id a la tabla Denuncias
-- para relacionar las denuncias directamente con los municipios

ALTER TABLE Denuncias 
ADD COLUMN municipio_id INT NULL AFTER vivienda_id,
ADD FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id);

-- Nota: Se permite NULL para mantener compatibilidad con registros existentes
-- Si deseas hacerlo obligatorio en el futuro, puedes ejecutar:
-- ALTER TABLE Denuncias MODIFY COLUMN municipio_id INT NOT NULL;

