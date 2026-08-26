"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type QrWithLogoProps = {
  value: string;
};

const COLOR_PRESETS: { name: string; bg: string; fg: string }[] = [
  { name: "Cream", bg: "#FAF6ED", fg: "#3E3A34" },
  { name: "White", bg: "#FFFFFF", fg: "#3E3A34" },
  { name: "Sage", bg: "#FAF6ED", fg: "#4C6B54" },
  { name: "Lavender", bg: "#FAF6ED", fg: "#6B5B95" },
  { name: "Peach", bg: "#FAF6ED", fg: "#B9652E" },
  { name: "Ink on cream", bg: "#FAF6ED", fg: "#1E1B17" },
];

// quick luminance check — warns if bg/fg are too close for a QR to scan reliably
function isTooLowContrast(bg: string, fg: string) {
  const lum = (hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  return Math.abs(lum(bg) - lum(fg)) < 0.35;
}

export default function QrWithLogo({ value }: QrWithLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [size, setSize] = useState(400);
  const [logoScale, setLogoScale] = useState(0.24);
  const [isGenerating, setIsGenerating] = useState(false);

  // Colors — bgColor is the QR background, fgColor is the dot/module color
  const [bgColor, setBgColor] = useState("#FAF6ED");
  const [fgColor, setFgColor] = useState("#3E3A34");

  const lowContrast = isTooLowContrast(bgColor, fgColor);

  // Generate QR whenever settings change
  useEffect(() => {
    if (!value || !canvasRef.current) return;

    generateQR();
  }, [value, size, logoDataUrl, logoScale, bgColor, fgColor]);

  const generateQR = async () => {
    if (!canvasRef.current || !value) return;

    setIsGenerating(true);

    const canvas = canvasRef.current;

    try {
      // Generate base QR
      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "H",

        // User-selected colors
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      // If no logo, we're done
      if (!logoDataUrl) {
        setIsGenerating(false);
        return;
      }

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      const logo = new Image();

      logo.onload = () => {
        const logoBoxSize = size * logoScale;

        // Padding around logo
        const padding = logoBoxSize * 0.16;

        const centerX = size / 2;
        const centerY = size / 2;

        // Backing plate — matches the chosen background so it blends in
        const plateSize = logoBoxSize + padding * 2;

        ctx.save();

        ctx.fillStyle = bgColor;

        roundRect(
          ctx,
          centerX - plateSize / 2,
          centerY - plateSize / 2,
          plateSize,
          plateSize,
          plateSize * 0.18
        );

        ctx.fill();

        ctx.restore();

        // Preserve logo aspect ratio
        const ratio = Math.min(
          logoBoxSize / logo.width,
          logoBoxSize / logo.height
        );

        const logoWidth = logo.width * ratio;
        const logoHeight = logo.height * ratio;

        ctx.drawImage(
          logo,
          centerX - logoWidth / 2,
          centerY - logoHeight / 2,
          logoWidth,
          logoHeight
        );

        setIsGenerating(false);
      };

      logo.onerror = () => {
        console.error("Could not load logo");
        setIsGenerating(false);
      };

      logo.src = logoDataUrl;
    } catch (error) {
      console.error("QR generation failed:", error);
      setIsGenerating(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result);
        setLogoName(file.name);
      }
    };

    reader.readAsDataURL(file);
  };

  // Remove logo
  const removeLogo = () => {
    setLogoDataUrl(null);
    setLogoName("");
  };

  // Apply a color preset
  const applyPreset = (preset: { bg: string; fg: string }) => {
    setBgColor(preset.bg);
    setFgColor(preset.fg);
  };

  // Download QR
  const download = () => {
    if (!canvasRef.current) return;

    const link = document.createElement("a");

    link.download = "review-qr-code.png";
    link.href = canvasRef.current.toDataURL("image/png");

    link.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* SETTINGS CARD */}
      <div className="bg-white border border-[#D8DED2] rounded-[14px] p-7">

        {/* COLORS */}
        <div className="mb-6">
          <label className="block font-semibold text-sm mb-2 text-[#3E3A34]">
            Colors
          </label>

          <p className="text-xs text-[#3E5158] mb-3">
            Pick a background and a QR color, or use a preset below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* BACKGROUND COLOR */}
            <div>
              <label className="block text-xs font-medium text-[#3E5158] mb-1.5">
                Background
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="
                    h-10
                    w-10
                    rounded-md
                    border
                    border-[#D8DED2]
                    cursor-pointer
                    bg-transparent
                    p-0.5
                  "
                />

                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="
                    flex-1
                    border-[1.5px]
                    border-[#D8DED2]
                    rounded-[10px]
                    px-3
                    py-2
                    text-sm
                    text-[#3E3A34]
                    bg-[#FBFCFA]
                    outline-none
                    focus:border-[#3E3A34]
                  "
                />
              </div>
            </div>

            {/* QR / FOREGROUND COLOR */}
            <div>
              <label className="block text-xs font-medium text-[#3E5158] mb-1.5">
                QR color
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="
                    h-10
                    w-10
                    rounded-md
                    border
                    border-[#D8DED2]
                    cursor-pointer
                    bg-transparent
                    p-0.5
                  "
                />

                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="
                    flex-1
                    border-[1.5px]
                    border-[#D8DED2]
                    rounded-[10px]
                    px-3
                    py-2
                    text-sm
                    text-[#3E3A34]
                    bg-[#FBFCFA]
                    outline-none
                    focus:border-[#3E3A34]
                  "
                />
              </div>
            </div>

          </div>

          {/* PRESETS */}
          <div className="flex flex-wrap gap-2 mt-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                title={preset.name}
                className="
                  flex
                  items-center
                  gap-1.5
                  border
                  border-[#D8DED2]
                  rounded-full
                  pl-1
                  pr-3
                  py-1
                  text-xs
                  text-[#3E5158]
                  hover:border-[#3E3A34]
                  transition
                "
              >
                <span
                  className="w-4 h-4 rounded-full border border-[#D8DED2]"
                  style={{ backgroundColor: preset.bg }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-[#D8DED2] -ml-2"
                  style={{ backgroundColor: preset.fg }}
                />
                {preset.name}
              </button>
            ))}
          </div>

          {lowContrast && (
            <p className="mt-3 text-xs text-[#B93E28] bg-[#FBF1DE] rounded-md px-3 py-2">
              These two colors are close in brightness — the code may not scan
              reliably. Try a lighter background or a darker QR color.
            </p>
          )}
        </div>

        {/* Logo */}
        <div className="mb-6">
          <label className="block font-semibold text-sm mb-2 text-[#3E3A34]">
            Logo
          </label>

          <p className="text-xs text-[#3E5158] mb-3">
            Upload your logo. PNG with a transparent background works best.
          </p>

          <label
            htmlFor="logo-upload"
            className="
              block
              border-[1.5px]
              border-dashed
              border-[#D8DED2]
              rounded-xl
              p-6
              text-center
              cursor-pointer
              bg-[#FBFCFA]
              hover:border-[#3E3A34]
              hover:bg-[#FAF6ED]
              transition
            "
          >
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            <span className="text-sm text-[#3E5158]">
              <strong className="text-[#3E3A34]">
                Click to upload
              </strong>{" "}
              your logo
            </span>
          </label>

          {/* Logo preview */}
          {logoDataUrl && (
            <div className="mt-3 flex items-center gap-3">

              <img
                src={logoDataUrl}
                alt="Logo preview"
                className="
                  w-10
                  h-10
                  object-contain
                  rounded-md
                  border
                  border-[#D8DED2]
                  bg-white
                "
              />

              <span className="text-xs text-[#3E5158] truncate">
                {logoName}
              </span>

              <button
                type="button"
                onClick={removeLogo}
                className="
                  ml-auto
                  text-xs
                  text-[#B93E28]
                  border
                  border-[#D8DED2]
                  rounded-md
                  px-3
                  py-1.5
                  hover:bg-[#FBF1DE]
                  transition
                "
              >
                Remove
              </button>

            </div>
          )}
        </div>

        {/* OPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* QR SIZE */}
          <div>
            <label className="block font-semibold text-sm mb-2 text-[#3E3A34]">
              QR size
            </label>

            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="
                w-full
                border-[1.5px]
                border-[#D8DED2]
                rounded-[10px]
                px-3.5
                py-3
                text-sm
                text-[#3E3A34]
                bg-[#FBFCFA]
                outline-none
                focus:border-[#3E3A34]
              "
            >
              <option value={400}>
                400 × 400 px — Small
              </option>

              <option value={800}>
                800 × 800 px — Medium
              </option>

              <option value={1600}>
                1600 × 1600 px — Large
              </option>
            </select>
          </div>

          {/* LOGO SIZE */}
          <div>
            <label className="block font-semibold text-sm mb-2 text-[#3E3A34]">
              Logo size
            </label>

            <select
              value={logoScale}
              onChange={(e) => setLogoScale(Number(e.target.value))}
              className="
                w-full
                border-[1.5px]
                border-[#D8DED2]
                rounded-[10px]
                px-3.5
                py-3
                text-sm
                text-[#3E3A34]
                bg-[#FBFCFA]
                outline-none
                focus:border-[#3E3A34]
              "
            >
              <option value={0.18}>
                Small
              </option>

              <option value={0.24}>
                Medium
              </option>

              <option value={0.30}>
                Large
              </option>
            </select>
          </div>

        </div>

      </div>

      {/* QR OUTPUT */}
      <div className="mt-7 flex flex-col items-center">

        <div className="relative">

          <canvas
            ref={canvasRef}
            style={{ backgroundColor: bgColor }}
            className="
              max-w-full
              h-auto
              rounded-[14px]
              border
              border-[#D8DED2]
            "
          />

          {isGenerating && (
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                rounded-[14px]
                text-sm
                text-[#3E5158]
              "
              style={{ backgroundColor: `${bgColor}CC` }}
            >
              Generating...
            </div>
          )}

        </div>

        {/* DOWNLOAD */}
        <button
          type="button"
          onClick={download}
          className="
            mt-5
            rounded-full
            bg-peach
            hover:bg-peach-dark
            transition-colors
            px-6
            py-2.5
            text-sm
            font-medium
            text-ink
          "
        >
          Download QR code
        </button>

        {/* NOTE */}
        <p className="mt-4 text-center text-xs leading-relaxed text-[#3E5158] max-w-md">
          Generated with high error correction so the logo doesnt
          interfere with scanning. Always{" "}
          <strong className="text-[#3E3A34]">
            test-scan it
          </strong>{" "}
          before printing in bulk.
        </p>

      </div>

    </div>
  );
}


// Rounded rectangle helper
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();

  ctx.moveTo(x + radius, y);

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    radius
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    radius
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    radius
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    radius
  );

  ctx.closePath();
}