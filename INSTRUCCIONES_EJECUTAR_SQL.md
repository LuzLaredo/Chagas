# 📋 Instrucciones para Ejecutar el Script SQL

## 🎯 Método 1: MySQL Workbench (Recomendado - Más Fácil)

### Pasos:
1. **Abre MySQL Workbench**
2. **Conéctate a tu servidor MySQL** (haz clic en la conexión guardada)
3. **Selecciona tu base de datos** en el panel izquierdo (haz doble clic o selecciónala)
4. **Abre el script:**
   - Ve a `File` → `Open SQL Script...`
   - Navega a la carpeta del proyecto
   - Selecciona `alter_denuncias_add_municipio.sql`
5. **Ejecuta el script:**
   - Haz clic en el botón ⚡ (Execute) en la barra de herramientas
   - O presiona `Ctrl + Shift + Enter`
6. **Verifica el resultado:**
   - Deberías ver un mensaje de éxito en la pestaña "Output"
   - Si hay errores, aparecerán en rojo

---

## 🖥️ Método 2: Línea de Comandos (MySQL CLI)

### Opción A: Ejecutar directamente

Abre PowerShell o CMD y ejecuta:

```bash
mysql -u tu_usuario -p tu_base_de_datos < alter_denuncias_add_municipio.sql
```

**Ejemplo:**
```bash
mysql -u root -p chagas_db < alter_denuncias_add_municipio.sql
```

Te pedirá la contraseña y luego ejecutará el script.

### Opción B: Usar el archivo .bat (Windows)

1. **Edita el archivo `ejecutar_script_mysql.bat`** y modifica:
   - `MYSQL_USER`: tu usuario (ej: `root`)
   - `MYSQL_PASSWORD`: tu contraseña
   - `MYSQL_DATABASE`: nombre de tu base de datos

2. **Ejecuta el archivo .bat** haciendo doble clic

---

## 🔍 Método 3: Copiar y Pegar Directamente

1. **Abre MySQL Workbench** o cualquier cliente MySQL
2. **Conéctate a tu base de datos**
3. **Abre una nueva pestaña de consulta**
4. **Copia y pega el siguiente código:**

```sql
ALTER TABLE Denuncias 
ADD COLUMN municipio_id INT NULL AFTER vivienda_id,
ADD FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id);
```

5. **Ejecuta la consulta** (⚡ o `Ctrl + Shift + Enter`)

---

## ✅ Verificar que Funcionó

Después de ejecutar el script, verifica que el campo se agregó correctamente:

```sql
DESCRIBE Denuncias;
```

O:

```sql
SHOW COLUMNS FROM Denuncias;
```

Deberías ver `municipio_id` en la lista de columnas.

---

## ⚠️ Notas Importantes

- **Backup:** Si tienes datos importantes, haz un respaldo antes de ejecutar el script
- **Permisos:** Asegúrate de tener permisos de ALTER TABLE en la base de datos
- **Clave Foránea:** El script crea una relación con la tabla `Municipios`, asegúrate de que esa tabla existe

---

## 🐛 Si Ocurre un Error

### Error: "Duplicate column name 'municipio_id'"
**Solución:** El campo ya existe. No necesitas ejecutar el script.

### Error: "Cannot add foreign key constraint"
**Solución:** Verifica que:
- La tabla `Municipios` existe
- Existe la columna `municipio_id` en la tabla `Municipios`
- Los tipos de datos coinciden (INT)

### Error: "Access denied"
**Solución:** Verifica tus credenciales de MySQL y permisos de usuario.

