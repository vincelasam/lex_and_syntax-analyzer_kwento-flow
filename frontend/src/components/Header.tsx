import React, { useState } from "react";
import logo from "../assets/logo.png";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative w-full bg-parchment px-4 md:px-8 py-4 flex justify-between items-center border-b-2 border-(--kwento-gold) z-50">
      {/* Left Side: Logo and Titles */}
      <div className="flex gap-4 items-center">
        {/* Logo Image - Always visible, slightly smaller on mobile */}
        <img
          src={logo}
          alt="KwentoFlow Logo"
          className="w-12 h-12 md:w-16 md:h-auto object-contain"
        />

        {/* Desktop Title: Hidden on mobile, visible on md screens and up */}
        <div className="hidden md:flex flex-col justify-center">
          <h1 className="font-serif font-bold text-2xl text-(--kwento-ink) leading-tight">
            KwentoFlow: Lexical Analyzer
          </h1>
          <p className="font-serif text-(--kwento-ink) italic opacity-80">
            Weaving Code into Narrative
          </p>
        </div>

        {/* Mobile Title: Visible ONLY on small screens */}
        <div className="md:hidden">
          <h1 className="font-serif font-bold text-xl text-(--kwento-ink)">
            KwentoFlow
          </h1>
        </div>
      </div>

      {/* Desktop Navigation: Hidden on mobile */}
      <nav className="hidden md:flex items-center gap-8 mt-2 font-serif font-bold text-(--kwento-ink)">
        <a
          href="https://github.com/vincelasam/lex-analyzer_kwento-flow"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
        >
          Github
        </a>
        <a href="#" className="hover:opacity-70 transition-opacity">
          KwentoFlow PDF
        </a>

        {/* The Help Icon Circle */}
        <button
          aria-label="Help"
          className="bg-(--kwento-ink) text-parchment rounded-full w-8 h-8 flex items-center justify-center font-bold hover:bg-opacity-90 transition-colors"
        >
          ?
        </button>
      </nav>

      {/* Mobile Hamburger Button: Hidden on desktop */}
      <button
        className="md:hidden text-(--kwento-ink) p-2 cursor-pointer"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        {/* Simple Hamburger / X Icon SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8"
        >
          {isMenuOpen ? (
            // 'X' Icon
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            // Hamburger Icon
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-parchment border-b-2 border-(--kwento-gold) bg-(--kwento-bg) shadow-lg flex flex-col items-center py-6 gap-6 font-serif font-bold text-(--kwento-ink) md:hidden z-40">
          <a
            href="https://github.com/vincelasam/lex-analyzer_kwento-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg hover:opacity-70"
            onClick={() => setIsMenuOpen(false)}
          >
            Github
          </a>
          <a
            href="#"
            className="text-lg hover:opacity-70"
            onClick={() => setIsMenuOpen(false)}
          >
            KwentoFlow PDF
          </a>
          {/* Mobile Help Button */}
          <button
            aria-label="Help"
            className="bg-(--kwento-ink) text-white rounded-full w-10 h-10 flex items-center justify-center font-bold"
            onClick={() => setIsMenuOpen(false)}
          >
            ?
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
