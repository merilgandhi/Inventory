import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="flex items-center gap-2 mt-6 justify-center select-none">

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-2 rounded-md border flex items-center gap-1 transition
          ${currentPage === 1 
            ? "cursor-not-allowed opacity-50 bg-gray-200" 
            : "hover:bg-gray-100 bg-white"}
        `}
      >
        <FiChevronLeft />
        Prev
      </button>

      <div className="flex items-center gap-2">
        {pages.map((num) => (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`px-3 py-2 rounded-md border text-sm font-medium transition
              ${currentPage === num
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white hover:bg-gray-100 border-gray-300"}
            `}
          >
            {num}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-md border flex items-center gap-1 transition
          ${currentPage === totalPages
            ? "cursor-not-allowed opacity-50 bg-gray-200"
            : "hover:bg-gray-100 bg-white"}
        `}
      >
        Next
        <FiChevronRight />
      </button>
    </div>
  );
};

export default Pagination;
