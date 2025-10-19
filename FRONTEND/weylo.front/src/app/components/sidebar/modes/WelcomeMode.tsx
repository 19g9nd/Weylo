import React from "react";
import { SidebarMode } from "../../../types/sidebar";

interface WelcomeModeProps {
  onSwitchMode: (mode: SidebarMode) => void;
}

const WelcomeMode: React.FC<WelcomeModeProps> = ({ onSwitchMode }) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-6xl mb-4">🗺️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Welcome to Weylo
      </h2>
      <p className="text-gray-600 mb-6">
        Start by selecting a country to explore or create your travel route
      </p>
      <div className="space-y-3">
        <button
          onClick={() => onSwitchMode(SidebarMode.COUNTRY_EXPLORATION)}
          className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
        >
          🌍 Explore countries
        </button>
        <button
          onClick={() => onSwitchMode(SidebarMode.FAVOURITES)}
          className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
        >
          ⭐ My favourites
        </button>
        <button
          onClick={() => onSwitchMode(SidebarMode.MY_ROUTES)}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          📅 My routes
        </button>
      </div>
    </div>
  </div>
);

export default WelcomeMode;
