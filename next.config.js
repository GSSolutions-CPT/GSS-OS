/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Dangerously allow production builds to succeed even if there are type errors.
        // Type errors are caught by CI lint checks instead.
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig;
