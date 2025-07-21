import type { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ children }: ModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-xl w-full max-w-md relative">
        {children}
      </div>
    </div>
  );
};

export default Modal;
