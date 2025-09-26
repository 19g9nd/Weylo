"use client";
import React from "react";

interface YellowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
}

export default function YellowButton({
  children,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
}: YellowButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        ${fullWidth ? "w-full" : ""}
        bg-yellow hover:bg-yellow/90 
        text-main-text 
        px-6 py-3 
        rounded-lg 
        font-medium 
        transition-all duration-200 
        shadow-sm hover:shadow
        ${className}
      `}
    >
      {children}
    </button>
  );
}
