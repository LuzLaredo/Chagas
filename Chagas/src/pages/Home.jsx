import React from 'react';
import "../css/Home.css";
import BackgroundImg from "../assets/images/Cochabamba-Bolivia.png";
import QueEsChagasImg from "../assets/images/QueEsChagas.png";
import VinchucaImg from "../assets/images/vinchuca.png";
import SangreImg from "../assets/images/transfusion-sangre.png";
import CongenitoImg from "../assets/images/congenito.png";
import Diagnostico1Img from "../assets/images/diagnostico1.png";
import Diagnostico2Img from "../assets/images/diagnostico2.png";
import Diagnostico3Img from "../assets/images/diagnostico3.png";
import Tratamiento1Img from "../assets/images/tratamiento1.png";
import Tratamiento2Img from "../assets/images/tratamiento2.png";
import VinchucaAccion1Img from "../assets/images/vinchuca1.png"; // Asegúrate de tener estas imágenes
import VinchucaAccion2Img from "../assets/images/vinchuca2.png";
import VinchucaAccion3Img from "../assets/images/vinchuca3.png";
import { useAuth } from './AuthContext';

function Home() {
  const { userType, usuario, isAuthenticated } = useAuth();
  return (
    <div className="home-container">
      {/* Sección 1: Título principal */}
      <h1 className="home-title">CHAGAS</h1>

      {/* Sección 2: Imagen centrada */}
      <div className="image-container">
        <img src={QueEsChagasImg} alt="¿Qué es Chagas?" className="home-image" />
      </div>

      {/* Sección 3: Qué es el Chagas */}
      <div className="card-black">
        <h2>¿Qué es el Chagas?</h2>
      </div>
      <div className="card-white">
        <p>
          Es una enfermedad infecciosa y potencialmente mortal, producida por el parásito <b>Trypanosoma cruzi</b>. 
          Es endémica en zonas rurales y puede afectar principalmente al corazón y los intestinos.
        </p>
      </div>

      {/* Sección 4: Formas de transmisión (título) */}
      <h1 className="home-title">FORMAS DE TRANSMISIÓN DE LA ENFERMEDAD DE CHAGAS</h1>

      {/* Contenedor de TRES columnas para las transmisiones */}
      <div className="transmission-row">
        {/* Columna 1: Transmisión vectorial */}
        <div className="transmission-column">
          <div className="image-container">
            <img src={VinchucaImg} alt="Transmisión por vínchuca" className="home-image" />
          </div>
          <div className="card-black">
            <h2>Por transmisión vectorial</h2>
          </div>
          <div className="card-white">
            <p>
              La vínchuca pica a las personas para alimentarse, en el momento de la picadura deja sus heces en la piel de las personas. 
              Al rascarnos la picadura, los parásitos que están en las heces de las vínchucas entran en el cuerpo de la persona.
            </p>
          </div>
        </div>

        {/* Columna 2: Transmisión por sangre */}
        <div className="transmission-column">
          <div className="image-container">
            <img src={SangreImg} alt="Transmisión por sangre" className="home-image" />
          </div>
          <div className="card-black">
            <h2>Por transmisión de sangre</h2>
          </div>
          <div className="card-white">
            <p>
              Si una persona recibe sangre que no haya sido controlada debidamente, puede contraer la enfermedad de Chagas.
            </p>
          </div>
        </div>

        {/* Columna 3: Transmisión congénita */}
        <div className="transmission-column">
          <div className="image-container">
            <img src={CongenitoImg} alt="Transmisión congénita" className="home-image" />
          </div>
          <div className="card-black">
            <h2>Transmisión congénita</h2>
          </div>
          <div className="card-white">
            <p>
              Una mujer con Chagas puede transmitir la enfermedad a su bebé durante el embarazo o el parto. 
              Esto se llama chagas congénito.
            </p>
          </div>
        </div>
      </div>

      {/* Sección 5: Diagnóstico de Chagas */}
      <h1 className="home-title">¿CÓMO SE REALIZA EL DIAGNÓSTICO DE CHAGAS?</h1>

      {/* Contenedor de TRES imágenes para el diagnóstico */}
      <div className="image-row">
        <div className="image-item">
          <img src={Diagnostico1Img} alt="Diagnóstico 1" className="diagnostico-image" />
        </div>
        <div className="image-item">
          <img src={Diagnostico2Img} alt="Diagnóstico 2" className="diagnostico-image" />
        </div>
        <div className="image-item">
          <img src={Diagnostico3Img} alt="Diagnóstico 3" className="diagnostico-image" />
        </div>
      </div>

      {/* Bloque de texto extenso sobre diagnóstico */}
      <div className="card-white large-text">
        <p>
          - El diagnóstico de la enfermedad de Chagas, consiste en realizar 2 pruebas de laboratorio en sangre. Si los resultados de las pruebas de laboratorio son positivas, se debe iniciar el tratamiento médico para curar la enfermedad de Chagas.<br/><br/>
          - El diagnóstico y tratamiento están disponibles en todos los establecimientos de salud de todo el departamento.
        </p>
      </div>

      {/* Sección 6: Tratamiento de Chagas en 2 columnas */}
      <h1 className="home-title">¿CÓMO SE REALIZA EL TRATAMIENTO DE CHAGAS?</h1>

      {/* Fila con 2 columnas para el tratamiento */}
      <div className="treatment-row">
        {/* Columna 1: Información del tratamiento */}
        <div className="treatment-column">
          <div className="image-container">
            <img src={Tratamiento1Img} alt="Tratamiento de Chagas" className="home-image" />
          </div>
          <div className="card-white">
            <p>
              El tratamiento consiste en una toma de medicamento 2 veces al día durante 60 días, dependiendo el peso y edad debe ser indicado y supervisado por el personal médico.
            </p>
          </div>
        </div>

        {/* Columna 2: Información de gratuidad y efectos */}
        <div className="treatment-column">
          <div className="image-container">
            <img src={Tratamiento2Img} alt="Tratamiento gratuito" className="home-image" />
          </div>
          <div className="card-white">
            <p>
              Los medicamentos que se utilizan para el tratamiento pueden producir reacciones adversas que se producen generalmente al inicio del tratamiento, por esto es importante el control y seguimiento médico.
            </p>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: ¿Qué debo hacer si hay vinchuca? - 3 columnas */}
      <h1 className="home-title">¿QUÉ DEBO HACER SI HAY VINCHUCA EN MI CASA?</h1>

      <div className="transmission-row">
        {/* Columna 1 */}
        <div className="transmission-column">
          <div className="image-container">
            <img src={VinchucaAccion1Img} alt="Capturar vinchuca" className="home-image" />
          </div>
          <div className="card-white">
            <p>
              <b>1.</b> Captura la vínchuca con una bolsa plástica y colócala en una caja de fósforo o un frasco seco.
            </p>
          </div>
        </div>

        {/* Columna 2 */}
        <div className="transmission-column">
          <div className="image-container">
            <img src={VinchucaAccion2Img} alt="Escribir información" className="home-image" />
          </div>
          <div className="card-white">
            <p>
              <b>2.</b> Escribe en una hoja el nombre, dirección y teléfono de la casa (si es posible croquis).
            </p>
          </div>
        </div>

        {/* Columna 3 */}
        <div className="transmission-column">
          <div className="image-container">
            <img src={VinchucaAccion3Img} alt="Llevar al centro de salud" className="home-image" />
          </div>
          <div className="card-white">
            <p>
              <b>3.</b> Lleva al centro de salud próximo a tu domicilio o a oficinas del Programa de control vectorial del Sedes.
            </p>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Limpieza de vivienda - 3 columnas */}
<h1 className="home-title">LIMPIEMOS NUESTRA VIVIENDA PARA EVITAR LA VINCHUCA</h1>

<div className="prevention-row">
  {/* Columna 1 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>1.</b> ENTRE LAS FRAZADAS Y ROPA</p>
    </div>
    <div className="card-white">
      <p><b>2.</b> DEBAJO DEL COLCHÓN</p>
    </div>
    <div className="card-white">
      <p><b>3.</b> ENTRE LAS MADERAS DE LA CAMA</p>
    </div>
    <div className="card-white">
      <p><b>4.</b> DETRÁS DE LOS CUADROS O CALENDARIOS DE LA PARED</p>
    </div>
  </div>

  {/* Columna 2 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>5.</b> SACUDE Y MIRA ENTRE LA ROPA QUE ESTÁ DENTRO TU CUARTO</p>
    </div>
    <div className="card-white">
      <p><b>6.</b> MIRA DEBAJO DE LA MESA Y LA SILLA</p>
    </div>
    <div className="card-white">
      <p><b>7.</b> MIRA DETRÁS DEL ROPERO Y EN LOS CAJONES</p>
    </div>
    <div className="card-white">
      <p><b>8.</b> MIRA DEBAJO Y DENTRO DEL BAÚL</p>
    </div>
  </div>

  {/* Columna 3 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>9.</b> REVISA EN LAS GRIETAS Y AGUJEROS DEL TECHO DE TU DORMITORIO</p>
    </div>
    <div className="card-white">
      <p><b>10.</b> REVISA LAS GRIETAS QUE HAY ALREDEDOR DE TUS VENTANAS</p>
    </div>
    <div className="card-white">
      <p><b>11.</b> OBSERVA LAS GRIETAS Y AGUJEROS DE LA PARED</p>
    </div>
    <div className="card-white">
      <p><b>12.</b> REVISA EN EL MARCO DE LA PUERTA DE TU DORMITORIO</p>
    </div>
  </div>
</div>

{/* NUEVA SECCIÓN: Recomendaciones generales - 2 columnas */}
<h1 className="home-title">LA ENFERMEDAD DE CHAGAS ES MORTAL - RECOMENDACIONES</h1>

<div className="recommendation-row">
  {/* Columna 1 */}
  <div className="recommendation-column">
    <div className="card-white">
      <p>CUBRE Y REVOCA PAREDES O TECHOS PARA QUE LAS VINCHUCAS NO PUEDAN ENTRAR</p>
    </div>
    <div className="card-white">
      <p>LIMPIA CON FRECUENCIA TU PATIO Y EVITA AMONTONAR OBJETOS</p>
    </div>
    <div className="card-white">
      <p>EVITA QUE ENTREN ANIMALES A TU CASA, EN ESPECIAL AL DORMITORIO</p>
    </div>
  </div>

  {/* Columna 2 */}
  <div className="recommendation-column">
    <div className="card-white">
      <p>LIMPIA Y MANTÉN LOS CORRALES ALEJADOS DE LA VIVIENDA PARA EVITAR QUE LA VINCHUCA INGRESE AL DOMICILIO</p>
    </div>
    <div className="card-white">
      <p>COLOCA MALLAS MILIMÉTRICAS, SELLA PUERTAS Y VENTANAS</p>
    </div>
    <div className="card-white">
      <p>REVISA CADA DÍAS CAMAS, MUEBLES Y DEPÓSITOS DONDE PUEDAN ESCONDERSE LAS VINCHUCAS</p>
    </div>
  </div>
</div>

{/* SECCIÓN ORIGINAL: Prevención de Chagas - 4 columnas (mantenida) */}
<h1 className="home-title">¿QUÉ HACER PARA PREVENIR LA ENFERMEDAD DE CHAGAS?</h1>

<div className="prevention-row">
  {/* Columna 1 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>1)</b> Mantener la casa limpia y ordenada, sacudir la ropa y las camas.</p>
    </div>
  </div>

  {/* Columna 2 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>2)</b> Los animales deben estar en corrales limpios y alejados de la casa.</p>
    </div>
  </div>

  {/* Columna 3 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>3)</b> Tapar las grietas y revocar las paredes, techos de las vivienda.</p>
    </div>
  </div>

  {/* Columna 4 */}
  <div className="prevention-column">
    <div className="card-white">
      <p><b>4)</b> Si recibe transfusión de sangre, debe pedir que la sangre sea controlada para el Chagas.</p>
    </div>
  </div>
</div>
    </div>
  );
}

export default Home;