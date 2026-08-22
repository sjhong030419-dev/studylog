export interface ShopPreviewAssets {
  thumbnail: string
  banner: string
  icon: string
}

export const SHOP_PREVIEW_ASSETS: Readonly<Record<string, ShopPreviewAssets>> = {
  'skin-sakura-uniform-girl': {
    thumbnail: '/sprites/shop/sakura-uniform/thumbnail.webp',
    banner: '/sprites/shop/sakura-uniform/banner.webp',
    icon: '/sprites/shop/sakura-uniform/icon.webp',
  },
  'skin-moonlight-academy': {
    thumbnail: '/sprites/shop/moonlight-academy/thumbnail.webp',
    banner: '/sprites/shop/moonlight-academy/banner.webp',
    icon: '/sprites/shop/moonlight-academy/icon.webp',
  },
  'skin-rainy-study-cafe': {
    thumbnail: '/sprites/shop/rainy-study-cafe/thumbnail.webp',
    banner: '/sprites/shop/rainy-study-cafe/banner.webp',
    icon: '/sprites/shop/rainy-study-cafe/icon.webp',
  },
}
