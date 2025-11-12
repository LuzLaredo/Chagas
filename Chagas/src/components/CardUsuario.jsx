export default function CardUsuario({ usuario }) {
  return (
    <div className="bg-red-200 rounded-lg p-4 my-2 shadow-md">
      <h2 className="font-bold">Datos generales</h2>
      <p><b>Jefe de familia:</b> {usuario.nombre}</p>
      <p><b>N° de vivienda:</b> {usuario.vivienda}</p>
      <p><b>N° de habitantes:</b> {usuario.habitantes}</p>
      <p><b>Descripción:</b> {usuario.descripcion}</p>
    </div>
  );
}
