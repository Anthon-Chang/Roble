// Permite el paso solo a los roles indicados. Debe ir después de verificarTokenJWT.
export const permitirRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({ msg: "Acción no permitida para tu rol" })
  }
  next()
}

// Solo carpinteros cuyo perfil fue aprobado por el administrador (HU-002).
export const carpinteroAprobado = (req, res, next) => {
  if (req.user?.rol !== "carpintero") {
    return res.status(403).json({ msg: "Acción no permitida para tu rol" })
  }
  if (req.user.estadoAprobacion !== "aprobado") {
    return res.status(403).json({
      msg: "Tu perfil aún no ha sido aprobado por el administrador",
      estadoAprobacion: req.user.estadoAprobacion,
    })
  }
  next()
}
