// src/components/Layout.jsx
import React from "react";

export default function Layout({ children, title }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-400 text-xs">
        Data © OpenStreetMap contributors
      </footer>
    </div>
  );
}
