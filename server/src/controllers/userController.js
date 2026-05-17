export async function getUsers(req, res) {
  res.json([]);
}

export async function createUser(req, res) {
  res.status(501).json({ error: 'Not implemented' });
}

export async function updateUser(req, res) {
  res.status(501).json({ error: 'Not implemented' });
}

export async function deleteUser(req, res) {
  res.status(501).json({ error: 'Not implemented' });
}
