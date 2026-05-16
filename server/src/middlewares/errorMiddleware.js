export default function errorHandler(err, req, res, next) {
  console.error(err.stack);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Image trop lourde ou format non accepté.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
  });
}
