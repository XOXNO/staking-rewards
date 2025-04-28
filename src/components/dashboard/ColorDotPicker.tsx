import React, { useState } from 'react';
import { CHART_COLORS } from '@/lib/constants/chartColors';

interface IColorDotPickerProps {
  color: string;
  onChange: (color: string) => void;
  size?: number;
}

export const ColorDotPicker: React.FC<IColorDotPickerProps> = ({ color, onChange, size = 18 }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-label="Change wallet color"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px #ccc',
          cursor: 'pointer',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: size + 6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            minWidth: 120,
          }}
        >
          {CHART_COLORS.categorical.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Select color ${c}`}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: c,
                border: c === color ? '2px solid #000' : '1px solid #ccc',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: c === color ? '0 0 0 2px #888' : undefined,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 