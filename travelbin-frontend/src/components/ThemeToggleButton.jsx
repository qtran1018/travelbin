import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/ThemeToggleButton.css';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <label className="theme-switch">
      <input
        type="checkbox"
        checked={theme === 'dark'}
        onChange={toggleTheme}
      />
      <span className="slider">
        <img
          src="../../sun.png"
          alt="Light Mode"
          className="icon sun-icon"
        />
        <img
          src="../../moon.png"
          alt="Dark Mode"
          className="icon moon-icon"
        />
      </span>
    </label>
  );
};

export default ThemeToggleButton;
