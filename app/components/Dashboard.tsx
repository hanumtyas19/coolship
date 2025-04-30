import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome to CoolShip</h1>
        <button className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </header>
      <div className="flex space-x-8">
        <div className="bg-white shadow-md rounded-lg p-6 flex-1">
          <h2 className="text-xl font-bold mb-4">Overall is Good!</h2>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="text-4xl font-bold">-18°C</div>
              <div className="text-gray-500">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold">85%</div>
              <div className="text-gray-500">Humidity</div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 flex-1">
          <h2 className="text-xl font-bold mb-4">Temperature & Humidity Chart</h2>
          {/* Placeholder for chart */}
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
} 