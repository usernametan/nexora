import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace } from 'three'

const textureCache = new Map()
const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value))
const fract = (value) => value - Math.floor(value)
const mix = (start, end, amount) => start + (end - start) * amount

function hash(x, y, seed) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453)
}

function smoothstep(value) {
  return value * value * (3 - 2 * value)
}

function valueNoise(x, y, period, seed) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = x0 + 1
  const y1 = y0 + 1
  const wrappedX0 = ((x0 % period) + period) % period
  const wrappedX1 = ((x1 % period) + period) % period
  const tx = smoothstep(x - x0)
  const ty = smoothstep(y - y0)
  const top = mix(hash(wrappedX0, y0, seed), hash(wrappedX1, y0, seed), tx)
  const bottom = mix(hash(wrappedX0, y1, seed), hash(wrappedX1, y1, seed), tx)
  return mix(top, bottom, ty)
}

function fbm(u, v, seed, octaves = 4) {
  let value = 0
  let amplitude = 0.55
  let frequency = 4
  let normalization = 0

  for (let octave = 0; octave < octaves; octave += 1) {
    value += valueNoise(u * frequency, v * frequency * 0.58, frequency, seed + octave * 13) * amplitude
    normalization += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return value / normalization
}

function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function setPixel(data, index, color, alpha = 255) {
  data[index] = color[0]
  data[index + 1] = color[1]
  data[index + 2] = color[2]
  data[index + 3] = alpha
}

function buildTexture(type) {
  const width = type === 'earth' ? 512 : 384
  const height = width / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const image = context.createImageData(width, height)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width
      const v = y / height
      const index = (y * width + x) * 4
      const primary = fbm(u, v, 17, 5)
      const detail = fbm(u + 0.17, v - 0.09, 43, 3)
      let color

      if (type === 'earth') {
        const elevation = primary * 0.78 + detail * 0.22
        if (elevation < 0.47) {
          const depth = clamp((0.47 - elevation) * 7)
          color = [mix(22, 5, depth), mix(72, 23, depth), mix(112, 52, depth)]
        } else if (elevation < 0.495) {
          color = [67, 113, 105]
        } else {
          const landHeight = clamp((elevation - 0.495) * 4.5)
          const dry = clamp((v - 0.28) * 2.8) * clamp(1 - Math.abs(v - 0.48) * 4)
          color = [
            mix(38, 112, landHeight) + dry * 20,
            mix(83, 111, landHeight) + dry * 4,
            mix(65, 76, landHeight) - dry * 12,
          ]
        }
        if (v < 0.035 || v > 0.965) color = [210, 222, 220]
      } else if (type === 'moon') {
        const shade = 128 + primary * 58 + (detail - 0.5) * 42
        const maria = clamp((0.37 - primary) * 5)
        color = [shade * (1 - maria * 0.34), shade * (1 - maria * 0.36), shade * (1 - maria * 0.3)]
      } else if (type === 'mars') {
        const rust = primary * 0.68 + detail * 0.32
        color = [mix(96, 201, rust), mix(37, 94, rust), mix(24, 57, rust)]
        if (v < 0.06 || v > 0.94) color = [190, 160, 136]
      } else if (type === 'saturn') {
        const band = Math.sin(v * 76 + primary * 5.5) * 0.5 + 0.5
        const softBand = Math.sin(v * 23 - detail * 3) * 0.5 + 0.5
        const warmth = primary * 0.28 + band * 0.42 + softBand * 0.3
        color = [mix(126, 224, warmth), mix(91, 190, warmth), mix(57, 132, warmth)]
      } else if (type === 'jupiter') {
        const band = Math.sin(v * 64 + primary * 7) * 0.5 + 0.5
        const fineBand = Math.sin(v * 148 + detail * 8) * 0.5 + 0.5
        const tone = primary * 0.32 + band * 0.48 + fineBand * 0.2
        color = [mix(88, 221, tone), mix(64, 191, tone), mix(51, 156, tone)]
        if (v > 0.61 && v < 0.67) color = [174, 91, 61]
      } else if (type === 'neptune') {
        const cloud = Math.sin(v * 45 + detail * 4) * 0.5 + 0.5
        color = [mix(24, 68, primary * 0.65 + cloud * 0.35), mix(61, 126, primary * 0.65 + cloud * 0.35), mix(112, 205, primary * 0.65 + cloud * 0.35)]
      } else {
        const shade = 92 + primary * 76 + (detail - 0.5) * 34
        color = [shade, shade * 0.96, shade * 0.9]
      }

      setPixel(image.data, index, color)
    }
  }

  context.putImageData(image, 0, 0)

  if (type === 'moon') {
    const random = seededRandom(91)
    for (let index = 0; index < 46; index += 1) {
      const x = random() * width
      const y = height * (0.08 + random() * 0.84)
      const radius = 1.5 + random() * 7
      context.beginPath()
      context.ellipse(x, y, radius * (1.2 + random()), radius, 0, 0, Math.PI * 2)
      context.fillStyle = `rgba(44, 48, 53, ${0.08 + random() * 0.16})`
      context.fill()
      context.beginPath()
      context.ellipse(x - radius * 0.16, y - radius * 0.18, radius * 0.82, radius * 0.78, 0, 0, Math.PI * 2)
      context.strokeStyle = 'rgba(225, 225, 216, 0.11)'
      context.lineWidth = 0.8
      context.stroke()
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.anisotropy = 4
  texture.minFilter = LinearFilter
  return texture
}

function buildCloudTexture() {
  const width = 384
  const height = 192
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const image = context.createImageData(width, height)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width
      const v = y / height
      const cloud = fbm(u, v, 71, 5) * 0.7 + fbm(u * 1.7, v * 0.72, 19, 3) * 0.3
      const density = clamp((cloud - 0.55) * 3.6)
      const wisps = Math.sin(v * 41 + cloud * 8) * 0.5 + 0.5
      setPixel(image.data, (y * width + x) * 4, [230, 239, 241], density * (0.45 + wisps * 0.55) * 205)
    }
  }

  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.minFilter = LinearFilter
  return texture
}

export function getPlanetTexture(type) {
  if (!textureCache.has(type)) textureCache.set(type, buildTexture(type))
  return textureCache.get(type)
}

export function getCloudTexture() {
  if (!textureCache.has('earth-clouds')) textureCache.set('earth-clouds', buildCloudTexture())
  return textureCache.get('earth-clouds')
}
