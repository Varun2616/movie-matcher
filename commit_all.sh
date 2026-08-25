#!/bin/bash

echo "Committing Dependencies & Socket Client..."
git add package.json package-lock.json src/socket.js
git commit -m "build: setup socket.io client and frontend dependencies"

echo "Committing API definitions..."
git add src/api.js
git commit -m "feat: enhance api service for leaderboard and host settings"

echo "Committing Database & Advanced Host Configuration..."
git add backend/models.py backend/routes/room.py src/components/WaitingRoom.jsx
git commit -m "feat: implement advanced host configuration UI and TMDB query filters"

echo "Committing Tiebreaker & Lobby Loop Sockets..."
git add backend/sockets.py src/App.jsx
git commit -m "feat: implement return to lobby and tiebreaker socket workflows"

echo "Committing Deck & Leaderboard UI Upgrades..."
git add src/components/SwipeDeck.jsx src/components/SwipeCard.jsx src/components/Leaderboard.jsx
git commit -m "feat: add tiebreaker swipe constraints and host controls to leaderboard"

echo "Committing Tooling..."
git add commit_all.sh
git commit -m "chore: update git deployment script"

echo "Pushing changes..."
git push
