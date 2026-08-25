const API_BASE = 'http://localhost:5000';

export async function createRoom() {
  const res = await fetch(`${API_BASE}/api/room/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create room');
  }
  return res.json();
}

export async function joinRoom(roomCode, displayName) {
  const res = await fetch(`${API_BASE}/api/room/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_code: roomCode, display_name: displayName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to join room');
  }
  return res.json();
}

export async function fetchMovies(roomCode) {
  const res = await fetch(`${API_BASE}/api/room/${roomCode}/movies`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch movies');
  }
  return res.json();
}
