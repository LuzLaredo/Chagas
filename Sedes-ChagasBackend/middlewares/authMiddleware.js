import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado. Token requerido." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "tu_clave_secreta");
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};