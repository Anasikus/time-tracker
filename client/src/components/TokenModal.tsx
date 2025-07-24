import { useEffect, useRef, useState } from 'react';

interface TokenModalProps {
  onSubmit: (token: string) => void;
  onClose?: () => void;
}

const TokenModal = ({ onSubmit, onClose }: TokenModalProps) => {
  const [token, setToken] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Обработка клика вне модального окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.(); // вызвать onClose если клик вне окна
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = () => {
    if (token.trim()) {
      onSubmit(token.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-[#1a1a1a] text-white p-6 rounded shadow-lg max-w-sm w-full"
      >
        <h2 className="text-lg font-bold mb-4">Введите токен панели</h2>
        <input
          type="text"
          className="w-full border p-2 rounded mb-4 bg-gray-800 text-white border-gray-700 focus:ring-2 focus:ring-purple-600"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer токен"
        />
        <button
          onClick={handleSubmit}
          className="bg-pink-600 text-white w-full py-2 rounded hover:bg-pink-700"
        >
          Продолжить
        </button>
      </div>
    </div>
  );
};

export default TokenModal;
