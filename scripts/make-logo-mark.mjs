import sharp from 'sharp'

// Same crop as the navbar badge, as a real file: the V mark without the tiny wordmark
const src = 'public/images/logo.png'
const out = 'public/images/logo-mark.png'
const meta = await sharp(src).metadata()
const size = Math.round(Math.min(meta.width, meta.height) * 0.4875)
const left = Math.round(meta.width * 0.25625)
const top = Math.round(meta.height * 0.23125)

await sharp(src).extract({ left, top, width: size, height: size }).resize(256, 256).png().toFile(out)
console.log('Wrote', out)