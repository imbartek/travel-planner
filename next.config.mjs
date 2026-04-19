import createNextIntlPlugin from 'next-intl/plugin'

// Use the default path (i18n.ts in the root or src/)
const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
