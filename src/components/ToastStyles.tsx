import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

export const SuccessToast = ({ message }: { message: string }) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setClosing(true), 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        ${closing ? "toast-slide-out" : "toast-slide-in"}
        relative overflow-hidden backdrop-blur-xl
        px-5 py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        flex items-center gap-4 
        bg-linear-to-br from-emerald-50/80 to-emerald-200/80 
        border border-emerald-300/50
      `}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center 
                      bg-linear-to-br from-emerald-300 to-emerald-500 
                      shadow-md border border-emerald-600/30">
        <FiCheck size={20} className="text-white" />
      </div>

      <span className="font-semibold text-emerald-900 text-sm tracking-wide">
        {message}
      </span>

      <div
        className="toast-progress absolute bottom-0 left-0 bg-emerald-600/80"
        style={{ animationDuration: "1.5s" }}
      />
    </div>
  );
};

export const ErrorToast = ({ message }: { message: string }) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setClosing(true), 1300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        ${closing ? "toast-slide-out" : "toast-slide-in"}
        relative overflow-hidden backdrop-blur-xl
        px-5 py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15)]
        flex items-center gap-4 
        bg-linear-to-br from-red-50/80 to-red-200/60 
        border border-red-300/50
      `}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center 
                      bg-linear-to-br from-red-300 to-red-500 
                      shadow-md border border-red-600/30">
        <FiX size={20} className="text-white" />
      </div>

      <span className="font-semibold text-red-900 text-sm tracking-wide">
        {message}
      </span>

      <div
        className="toast-progress absolute bottom-0 left-0 bg-red-600/80"
        style={{ animationDuration: "1.5s" }}
      />
    </div>
  );
};
