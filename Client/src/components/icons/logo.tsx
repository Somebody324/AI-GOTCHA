import type React from 'react';

// AI·GOTCHA Logo SVG
// This is an approximation of the provided image.
// The dark blue elements will use `currentColor` (e.g., theme's primary color).
// The light blue element uses a hardcoded color.
export const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 100 100" // Defines the coordinate system
      xmlns="http://www.w3.org/2000/svg"
      {...props} // Passes className, width, height, etc.
    >
      {/* Icon part - two stylized figures */}
      {/* Right figure (light blue, drawn first to be potentially "behind") */}
      <g transform="translate(5, 0)"> {/* Group to easily move elements */}
        <circle fill="#4AA6DE" cx="65" cy="25" r="12" />
        {/* Simplified curved body for right figure */}
        <path
          d="M65,37 C85,40 80,70 60,70 C45,70 40,55 55,45"
          stroke="#4AA6DE"
          strokeWidth="11" // Adjusted stroke width
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Left figure (darker blue, uses currentColor) */}
      <g transform="translate(-5, 0)"> {/* Group to easily move elements */}
        <circle fill="currentColor" cx="35" cy="25" r="12" />
        {/* Simplified curved body for left figure, attempting to look intertwined */}
        <path
          d="M35,37 C15,40 20,70 40,70 C55,70 60,55 45,45"
          stroke="currentColor"
          strokeWidth="11" // Adjusted stroke width
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Text "AI·GOTCHA" */}
      <text
        x="50" // Centered
        y="93" // Positioned below the icon
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="16" // Adjusted for visibility in small sizes
        fontFamily="Arial, sans-serif" // Using a common sans-serif font
        fontWeight="bold"
        fill="currentColor" // Uses the theme color
      >
        AI·GOTCHA
      </text>
    </svg>
  );
};
