export default function Test() {
	return (
		<div
			className="relative w-full h-96 rounded-lg overflow-hidden"
			style={{ background: "linear-gradient(135deg, #ff2a2a, #0a0a0a)" }}
		>
			<div
				className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none"
				style={{
					backgroundImage:
						"radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
				}}
			></div>

			<div
				className="absolute inset-0 opacity-[0.125] mix-blend-soft-light pointer-events-none"
				style={{
					backgroundImage:
						"url('data:image/svg+xml,%3Csvg viewBox=%270 0 100 100%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%27 height=%27100%27 filter=%27url(%23noise)%27 opacity=%270.25%27/%3E%3C/svg%3E')",
				}}
			></div>

			<div className="relative z-10 p-8 text-white">
				<h1 className="text-3xl font-bold mb-4">Your Title</h1>
				<p className="text-lg opacity-90">Your subtitle or description text</p>
			</div>
		</div>
	);
}
