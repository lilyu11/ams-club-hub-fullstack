import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'localhost',
				port: '8000',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'placehold.co',
			},
		],
	},
};

export default nextConfig;
