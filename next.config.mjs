/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [        //allowing images to be served from the specified external source
            {
                protocol: "https",
                hostname: "ucarecdn.com",
            }
        ],
    }
}

export default nextConfig
