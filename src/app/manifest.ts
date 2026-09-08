import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Material Selection Sheet',
    short_name: 'Material Sheet',
    description: 'A professional material selection sheet for architectural and design projects.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F0F1F3',
    theme_color: '#045E7D',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
