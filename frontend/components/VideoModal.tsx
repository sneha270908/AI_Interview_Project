'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 aspect-video bg-bg-secondary rounded-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-blue/10 to-accent-purple/10">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-accent-blue flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform">
              <div className="w-0 h-0 border-l-[20px] border-l-accent-blue border-y-[12px] border-y-transparent ml-1" />
            </div>
            <p className="text-gray-400 text-sm">Demo video placeholder</p>
            <p className="text-gray-600 text-xs mt-1">Connect your video URL in production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
