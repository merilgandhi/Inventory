import React, { useState } from "react";
import { calcBoxes } from "../utils/orderCalculations";

type OrderVariantCellProps = {
  quantity: number;
  variation: {
    boxQuantity: number;
  };
  onChange: (value: number) => void;
  disabled?: boolean;
  maxQuantity?: number; 
};

const OrderVariantCell: React.FC<OrderVariantCellProps> = ({
  quantity,
  variation,
  disabled = false,
  onChange,
  maxQuantity,
}) => {
  const [error, setError] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const subCalculation = calcBoxes(quantity, variation.boxQuantity);

  const validateQuantity = (value: number): string => {
    if (value < 0) {
      return "Quantity cannot be negative";
    }
    if (maxQuantity && value > maxQuantity) {
      return `Maximum quantity is ${maxQuantity}`;
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/^0+(?=\d)/, "");

    const numValue = value === "" ? 0 : Number(value);
    const validationError = validateQuantity(numValue);

    setError(validationError);
    onChange(numValue);
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validateQuantity(quantity);
    setError(validationError);
  };

  const showError = touched && error;

  return (
    <>
      {/* Quantity */}
      <td className="align-middle px-2 py-2">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={disabled}
            value={quantity === 0 ? "" : quantity}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`
              w-full rounded-sm border px-2 py-1 text-right text-xs
              tabular-nums
              ${showError ? "border-red-500" : ""}
              ${disabled
                ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                : "bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"}
            `}
          />
          {showError && (
            <div className="absolute left-0 top-full mt-1 text-xs text-red-500 whitespace-nowrap z-10">
              {error}
            </div>
          )}
        </div>
      </td>

      {/* Boxes */}
      <td className=" align-middle px-2 py-2">
        <input
          type="text"
          disabled
          value={subCalculation.boxes}
          className="
            w-full rounded-sm border px-2 py-1 text-right text-xs
            tabular-nums bg-slate-50 text-slate-600
          "
        />
      </td>

      {/* Remaining */}
      <td className=" align-middle px-2 py-2">
        <input
          type="text"
          disabled
          value={subCalculation.remaining}
          className="
            w-full rounded-sm border px-2 py-1 text-right text-xs
            tabular-nums bg-slate-50 text-slate-600
          "
        />
      </td>
    </>
  );
};

export default OrderVariantCell;