import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Thêm dòng này để định dạng URL dạng /posts/[id]/ thay vì /posts/[id]
	trailingSlash: true,

	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.supabase.co',
			},
		],
	},
};

export default nextConfig;