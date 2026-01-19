import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { RoomPage } from './pages/RoomPage';
type AppState = {
  view: 'landing' | 'room';
  roomId: string;
  username: string;
  isAdmin: boolean;
};
export function App() {
  const [state, setState] = useState<AppState>({
    view: 'landing',
    roomId: '',
    username: '',
    isAdmin: false
  });
  const handleJoin = (roomId: string, username: string, isAdmin: boolean) => {
    setState({
      view: 'room',
      roomId,
      username,
      isAdmin
    });
  };
  const handleLeave = () => {
    setState({
      view: 'landing',
      roomId: '',
      username: '',
      isAdmin: false
    });
  };
  return     <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Main content */}
      <div className="flex-1">
        {state.view === 'landing' ? (
          <LandingPage onJoin={handleJoin} />
        ) : (
          <RoomPage
            roomId={state.roomId}
            username={state.username}
            isAdmin={state.isAdmin}
            onLeave={handleLeave}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-800">
        Made with ❤️ by R for G
      </footer>
    </div>

}