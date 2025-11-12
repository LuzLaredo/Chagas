import React from "react";
import "../css/AboutUs.css";

function AboutUs() {
  return (
    <div className="about-container">
      {/* Título principal */}
      <h1 className="about-title">SEDES COCHABAMBA CONTRA EL CHAGAS</h1>

      {/* Imagen centrada */}
      {/* Subtítulo */}
      <div className="card-black">
        <h2>¿Quiénes somos?</h2>
      </div>
      <div className="card-white">
        <p>
          La <b>Fundación CEADES</b> es una organización que trabaja en los
          ámbitos de salud y medio ambiente. Implementa acciones a través de
          una estrategia que contiene cuatro líneas de acción: atención médica,
          formación/capacitación de profesionales, desarrollo de protocolos de
          investigación y acciones de educación comunitaria.
        </p>
        <p>
          Sus acciones en el ámbito sanitario tienen el objetivo de aportar al
          conocimiento y la solución de los problemas de salud pública, control
          de enfermedades tropicales desatendidas y el control de enfermedades
          emergentes y reemergentes.
        </p>
        <p>
          En el ámbito del medio ambiente busca desarrollar acciones en la
          preservación y cuidados del medio ambiente, realizar estudios sobre
          cambio climático, contaminación ambiental y su repercusión en la
          salud de la población.
        </p>
      </div>

      {/* Misión */}
      <div className="card-black">
        <h2>Misión</h2>
      </div>
      <div className="card-white">
        <p>
          Desarrollar una filosofía de protección a la salud de las personas y
          su medio ambiente, basados en la cultura y los derechos humanos que
          promueve la generación de actitudes y conductas personales y
          comunitarias.
        </p>
      </div>

      {/* Visión */}
      <div className="card-black">
        <h2>Visión</h2>
      </div>
      <div className="card-white">
        <p>
          Una sociedad que participa en forma activa en el cuidado y protección
          de su salud y medio ambiente, en respeto a los derechos humanos, sus
          costumbres y usando para su desarrollo los mejores recursos
          tecnológicos disponibles.
        </p>
      </div>

      {/* Principios */}
      <div className="card-black">
        <h2>Principios</h2>
      </div>
      <div className="card-white large-text">
        <p>
          Pluralidad de aptitudes y capacidades en un marco de participación
          democrática. <br />
          Tolerancia y respeto a las diferencias creativas. <br />
          Sentido de la realidad y atención prioritaria a las problemáticas
          sociales, políticas y culturales. <br />
          Conocimiento de la realidad boliviana con nuevas estrategias y
          acciones colectivas. <br />
          Solidaridad y autoayuda entre las comunidades. <br />
          Respeto a las características socioculturales y del medio ambiente.{" "}
          <br />
          Comunicación permanente entre las instancias organizativas. <br />
          Racionalidad en las decisiones con información completa y crítica.{" "}
          <br />
          Sentido de justicia en todas las acciones de la organización.
        </p>
      </div>
    </div>
  );
}

export default AboutUs;
