"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradientConfig {
	color1: string;
	color2: string;
	direction: number;
	noiseIntensity: number;
	steps: number;
	stepsEnabled: boolean;
}

export default function Home() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [config, setConfig] = useState<GradientConfig>({
		color1: "#ff2a2a",
		color2: "#0a0a0a",
		direction: 135,
		noiseIntensity: 0.25,
		steps: 7,
		stepsEnabled: true,
	});

	const [debouncedConfig, setDebouncedConfig] = useState(config);

	// Debounce color changes to improve performance
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedConfig(config);
		}, 100);

		return () => clearTimeout(timer);
	}, [config]);

	// Generate improved noise pattern using Perlin-like algorithm
	const generateNoise = useCallback(
		(width: number, height: number, intensity: number) => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d")!;
			canvas.width = width;
			canvas.height = height;

			const imageData = ctx.createImageData(width, height);
			const data = imageData.data;

			// Create a more sophisticated noise pattern
			const scale = 0.02;
			const octaves = 4;
			const persistence = 0.5;
			const lacunarity = 2.0;

			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					let amplitude = 1.0;
					let frequency = 1.0;
					let noise = 0;

					// Generate multiple octaves of noise
					for (let i = 0; i < octaves; i++) {
						const sampleX = x * scale * frequency;
						const sampleY = y * scale * frequency;

						// Simple hash-based noise function
						const hash =
							Math.sin(sampleX * 12.9898 + sampleY * 78.233) * 43758.5453;
						const value = (hash - Math.floor(hash)) * 2 - 1;

						noise += value * amplitude;
						amplitude *= persistence;
						frequency *= lacunarity;
					}

					// Normalize and apply intensity
					noise = (noise + 1) * 0.5 * intensity;
					const index = (y * width + x) * 4;

					data[index] = data[index + 1] = data[index + 2] = noise * 255;
					data[index + 3] = 255;
				}
			}

			ctx.putImageData(imageData, 0, 0);
			return canvas;
		},
		[]
	);

	// Render stepped gradient with noise
	const renderGradient = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;
		const width = canvas.width;
		const height = canvas.height;
		ctx.clearRect(0, 0, width, height);
		const { color1, color2, direction, noiseIntensity, steps, stepsEnabled } =
			debouncedConfig;

		// Helper function to convert hex to RGB
		const hexToRgb = (hex: string) => {
			const h = hex.replace("#", "");
			return [
				parseInt(h.substring(0, 2), 16),
				parseInt(h.substring(2, 4), 16),
				parseInt(h.substring(4, 6), 16),
			];
		};

		if (!stepsEnabled) {
			// Render a smooth gradient if steps are disabled
			const angleRad = (direction * Math.PI) / 180;
			const x1 = width / 2 - (Math.cos(angleRad) * width) / 2;
			const y1 = height / 2 - (Math.sin(angleRad) * height) / 2;
			const x2 = width / 2 + (Math.cos(angleRad) * width) / 2;
			const y2 = height / 2 + (Math.sin(angleRad) * height) / 2;

			const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
			gradient.addColorStop(0, color1);
			gradient.addColorStop(1, color2);
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);

			// Add noise overlay
			if (noiseIntensity > 0) {
				const noiseCanvas = generateNoise(width, height, noiseIntensity);
				ctx.globalCompositeOperation = "soft-light";
				ctx.drawImage(noiseCanvas, 0, 0);
				ctx.globalCompositeOperation = "source-over";
			}
			return;
		}

		// Calculate the direction vector
		const angleRad = (direction * Math.PI) / 180;
		const dx = Math.cos(angleRad);
		const dy = Math.sin(angleRad);

		// For each step, draw a band
		for (let i = 0; i < steps; i++) {
			const t1 = i / steps;
			const t2 = (i + 1) / steps;
			// Interpolate color
			const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
			const rgb1 = hexToRgb(color1);
			const rgb2 = hexToRgb(color2);
			const c1 = [
				Math.round(lerp(rgb1[0], rgb2[0], t1)),
				Math.round(lerp(rgb1[1], rgb2[1], t1)),
				Math.round(lerp(rgb1[2], rgb2[2], t1)),
			];
			const c2 = [
				Math.round(lerp(rgb1[0], rgb2[0], t2)),
				Math.round(lerp(rgb1[1], rgb2[1], t2)),
				Math.round(lerp(rgb1[2], rgb2[2], t2)),
			];
			// Calculate band polygon
			// Project t1 and t2 onto the canvas along the gradient direction
			const x1 = width / 2 + (t1 - 0.5) * width * dx;
			const y1 = height / 2 + (t1 - 0.5) * height * dy;
			const x2 = width / 2 + (t2 - 0.5) * width * dx;
			const y2 = height / 2 + (t2 - 0.5) * height * dy;
			ctx.save();
			ctx.beginPath();
			// Draw a parallelogram band
			ctx.moveTo(x1 - dy * height, y1 + dx * width);
			ctx.lineTo(x1 + dy * height, y1 - dx * width);
			ctx.lineTo(x2 + dy * height, y2 - dx * width);
			ctx.lineTo(x2 - dy * height, y2 + dx * width);
			ctx.closePath();
			// Create a linear gradient for the band
			const bandGradient = ctx.createLinearGradient(x1, y1, x2, y2);
			bandGradient.addColorStop(0, `rgb(${c1[0]},${c1[1]},${c1[2]})`);
			bandGradient.addColorStop(1, `rgb(${c2[0]},${c2[1]},${c2[2]})`);
			ctx.fillStyle = bandGradient;
			ctx.fill();
			// Add noise overlay for this band
			if (noiseIntensity > 0) {
				const bandNoise = generateNoise(width, height, noiseIntensity);
				ctx.globalCompositeOperation = "soft-light";
				ctx.drawImage(bandNoise, 0, 0);
				ctx.globalCompositeOperation = "source-over";
			}
			ctx.restore();
		}
	}, [debouncedConfig, generateNoise]);

	// Download canvas as image
	const downloadCanvas = (format: "png" | "svg") => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		if (format === "png") {
			const link = document.createElement("a");
			link.download = "gradient-background.png";
			link.href = canvas.toDataURL("image/png");
			link.click();
		} else {
			// Convert canvas to SVG
			const svg = `
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#gradient)"/>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="${debouncedConfig.noiseIntensity}"/>
</svg>`;

			const blob = new Blob([svg], { type: "image/svg+xml" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.download = "gradient-background.svg";
			link.href = url;
			link.click();
			URL.revokeObjectURL(url);
		}
	};

	// Update canvas when config changes
	useEffect(() => {
		renderGradient();
	}, [renderGradient]);

	// Initialize canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const resizeCanvas = () => {
			const container = canvas.parentElement;
			if (container) {
				canvas.width = container.clientWidth;
				canvas.height = container.clientHeight;
				renderGradient();
			}
		};
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		return () => window.removeEventListener("resize", resizeCanvas);
	}, [renderGradient]);

	const updateConfig = (key: keyof GradientConfig, value: any) => {
		setConfig((prev) => ({ ...prev, [key]: value }));
	};

	// Predefined color palettes
	const colorPalettes = [
		{ name: "Red/Black", color1: "#ff2a2a", color2: "#0a0a0a" },
		{ name: "Sunset", color1: "#ff6b6b", color2: "#4ecdc4" },
		{ name: "Ocean", color1: "#667eea", color2: "#764ba2" },
		{ name: "Forest", color1: "#11998e", color2: "#38ef7d" },
		{ name: "Fire", color1: "#ff416c", color2: "#ff4b2b" },
		{ name: "Purple", color1: "#8e2de2", color2: "#4a00e0" },
		{ name: "Sky", color1: "#56ccf2", color2: "#2f80ed" },
	];

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="container mx-auto p-6">
				<div className="mb-8 text-center">
					<h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
						Gradient Background Generator
					</h1>
					<p className="text-xl text-muted-foreground">
						Create stunning gradients with noise effects
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Controls Panel */}
					<div className="lg:col-span-1 space-y-6">
						<Card className="border-border/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
									Gradient Controls
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Color Palettes */}
								<div className="space-y-3">
									<Label className="text-sm font-medium">
										Quick Color Palettes
									</Label>
									<div className="grid grid-cols-3 gap-2">
										{colorPalettes.map((palette) => (
											<button
												type="button"
												key={palette.name}
												onClick={() => {
													updateConfig("color1", palette.color1);
													updateConfig("color2", palette.color2);
												}}
												className="group relative p-3 rounded-lg border border-border/50 hover:border-border transition-colors bg-card"
											>
												<div
													className="w-full h-8 rounded-md mb-2"
													style={{
														background: `linear-gradient(45deg, ${palette.color1}, ${palette.color2})`,
													}}
												/>
												<span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
													{palette.name}
												</span>
											</button>
										))}
									</div>
								</div>

								{/* Custom Color Pickers */}
								<div className="space-y-4">
									<Label className="text-sm font-medium">Custom Colors</Label>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label
												htmlFor="color1"
												className="text-xs text-muted-foreground"
											>
												Color 1
											</Label>
											<div className="relative">
												<Input
													id="color1"
													type="color"
													value={config.color1}
													onChange={(e) =>
														updateConfig("color1", e.target.value)
													}
													className="h-12 cursor-pointer border-0 p-0 bg-transparent"
												/>
												<div className="absolute inset-0 rounded-md border border-border/50 pointer-events-none" />
											</div>
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="color2"
												className="text-xs text-muted-foreground"
											>
												Color 2
											</Label>
											<div className="relative">
												<Input
													id="color2"
													type="color"
													value={config.color2}
													onChange={(e) =>
														updateConfig("color2", e.target.value)
													}
													className="h-12 cursor-pointer border-0 p-0 bg-transparent"
												/>
												<div className="absolute inset-0 rounded-md border border-border/50 pointer-events-none" />
											</div>
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="direction">
										Direction: {config.direction}°
									</Label>
									<Slider
										id="direction"
										min={0}
										max={360}
										step={1}
										value={[config.direction]}
										onValueChange={(value) =>
											updateConfig("direction", value[0])
										}
										className="w-full"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="noiseIntensity">
										Noise Intensity: {Math.round(config.noiseIntensity * 100)}%
									</Label>
									<Slider
										id="noiseIntensity"
										min={0}
										max={1}
										step={0.05}
										value={[config.noiseIntensity]}
										onValueChange={(value) =>
											updateConfig("noiseIntensity", value[0])
										}
										className="w-full"
									/>
								</div>

								{/* Steps input - only show when steps are enabled */}
								{config.stepsEnabled && (
									<div className="space-y-2">
										<Label htmlFor="steps">Steps: {config.steps}</Label>
										<Slider
											id="steps"
											min={2}
											max={20}
											step={1}
											value={[config.steps]}
											onValueChange={(value) => updateConfig("steps", value[0])}
											className="w-full"
										/>
									</div>
								)}

								<div className="flex items-center space-x-2">
									<input
										type="checkbox"
										id="stepsEnabled"
										checked={config.stepsEnabled}
										onChange={(e) =>
											updateConfig("stepsEnabled", e.target.checked)
										}
										className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
									/>
									<Label htmlFor="stepsEnabled" className="text-sm">
										Enable Steps
									</Label>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Preview */}
					<div className="lg:col-span-2">
						<Card className="border-border/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
									Preview
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-2xl">
									<canvas ref={canvasRef} className="w-full h-full" />
								</div>
							</CardContent>
						</Card>

						{/* Download Section */}
						<Card className="mt-6 border-border/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
									Download
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex gap-4">
									<Button
										onClick={() => downloadCanvas("png")}
										className="flex-1"
									>
										Download PNG
									</Button>
									<Button
										onClick={() => downloadCanvas("svg")}
										variant="outline"
										className="flex-1"
									>
										Download SVG
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
