import React from 'react';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const TestModal: React.FC<TestModalProps> = ({ isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl heading mb-4">{title}</h2>
        <p className="mb-4">This is a test modal to verify rendering works.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 border-0 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
