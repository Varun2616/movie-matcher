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

export async function fetchPlayers(roomCode) {
  const res = await fetch(`${API_BASE}/api/room/${roomCode}/players`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch players');
  }
  return res.json();
}

export async function fetchRoomStatus(roomCode) {
  const res = await fetch(`${API_BASE}/api/room/${roomCode}/status`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch room status');
  }
  return res.json();
}

export async function updateRoomSettings(roomCode, hostSessionId, settings) {
  const res = await fetch(`${API_BASE}/api/room/${roomCode}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host_session_id: hostSessionId, ...settings })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update settings');
  }
  return res.json();
}

export async function startRoom(roomCode, hostSessionId) {
  const res = await fetch(`${API_BASE}/api/room/${roomCode}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host_session_id: hostSessionId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to start room');
  }
  return res.json();
}

export async function fetchLeaderboard(roomCode) {
  const res = await fetch(`${API_BASE}/api/room/${roomCode}/leaderboard`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch leaderboard');
  }
  return res.json();
}
