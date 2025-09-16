
interface ProgressionViewProps {
  progression: number;
  onProgressionChange: (value: number) => void;
  colorPalette: string[];
  onColorChange: (index: number, color: string) => void;
  onAddColor: () => void;
  onRemoveColor: () => void;
}

export function ProgressionView({
  progression,
  onProgressionChange,
  colorPalette,
  onColorChange,
  onAddColor,
  onRemoveColor
}: ProgressionViewProps) {
  const validateHexColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Progression Slider */}
      <div className="flex items-center justify-center gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
        <label htmlFor="progression-slider" className="font-bold text-gray-800 text-lg">
          Muscle Progression (0-100):
        </label>
        <input
          id="progression-slider"
          type="range"
          min="0"
          max="100"
          value={progression}
          onChange={(e) => onProgressionChange(parseInt(e.target.value))}
          className="w-80 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="bg-blue-500 text-white px-3 py-2 rounded-full font-bold min-w-[50px] text-center">
          {progression}
        </span>
      </div>

      {/* Color Palette Editor */}
      <div>
        <h3 className="text-center text-gray-800 mb-6 text-xl font-bold">
          Color Palette Editor
        </h3>
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          {colorPalette.map((color, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-800 shadow-md"
                style={{ backgroundColor: color }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (validateHexColor(value)) {
                    onColorChange(index, value);
                  } else if (value.startsWith('#') && value.length <= 7) {
                    // Allow partial typing
                    onColorChange(index, value);
                  }
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md w-20 font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                maxLength={7}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={onAddColor}
            className="px-6 py-3 font-bold border-2 border-green-500 rounded-lg bg-white text-green-500 cursor-pointer transition-all hover:bg-green-500 hover:text-white hover:-translate-y-1"
          >
            Add Color
          </button>
          <button
            onClick={onRemoveColor}
            disabled={colorPalette.length <= 2}
            className="px-6 py-3 font-bold border-2 border-red-500 rounded-lg bg-white text-red-500 cursor-pointer transition-all hover:bg-red-500 hover:text-white hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-red-500 disabled:hover:translate-y-0"
          >
            Remove Color
          </button>
        </div>
      </div>
    </div>
  );
}