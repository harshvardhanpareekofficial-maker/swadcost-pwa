import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

type Props = { color: string; paused: boolean; rotation: number; onReady: (ready: boolean) => void }
export default function ClothCanvas({ color, paused, rotation, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const inputs = useRef({ color, paused, rotation })
  useEffect(() => { inputs.current = { color, paused, rotation } }, [color, paused, rotation])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const mount = host.current
    if (!mount) return
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }) }
    catch { setFailed(true); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    mount.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 30)
    camera.position.set(0, 0, 8.8)
    scene.add(new THREE.HemisphereLight(0xf8ffe4, 0x173e39, 2.8))
    const key = new THREE.DirectionalLight(0xfff9da, 3.2); key.position.set(-3, 5, 5); scene.add(key)
    const rim = new THREE.DirectionalLight(0xb3edd9, 2); rim.position.set(4, -1, 2); scene.add(rim)
    const cloth = new THREE.Group(); scene.add(cloth)
    // Original repeatable woven-fiber texture, created locally. No remote imagery.
    const textureCanvas = document.createElement('canvas'); textureCanvas.width = textureCanvas.height = 128
    const ctx = textureCanvas.getContext('2d')!
    ctx.fillStyle = '#b2b5a9'; ctx.fillRect(0, 0, 128, 128)
    for (let y = 0; y < 128; y += 8) for (let x = 0; x < 128; x += 8) {
      const over = ((x + y) / 8) % 2 === 0
      ctx.fillStyle = over ? '#e9eadf' : '#c1c4b6'
      ctx.fillRect(x + 1, y + 1, over ? 6 : 7, over ? 7 : 6)
      ctx.fillStyle = '#ffffff30'; ctx.fillRect(x + 2, y + 2, over ? 1 : 4, over ? 4 : 1)
    }
    // Overlapping dyed warp and weft bands form a woven gingham check.
    ctx.fillStyle = 'rgba(24, 65, 54, .36)'
    ctx.fillRect(0, 0, 64, 128)
    ctx.fillRect(0, 0, 128, 64)
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(6, 4.5)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
    const material = new THREE.MeshStandardMaterial({ color: inputs.current.color, map: texture, bumpMap: texture, bumpScale: .025, roughness: .9, side: THREE.DoubleSide })
    let disposed = false, visible = true, dirty = true, previous = "", frame = 0, time = 0, last = 0, dragX = 0, downX: number | null = null
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    new GLTFLoader().load('/models/woven-cloth.glb', gltf => {
      if (disposed) { gltf.scene.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); (obj.material as THREE.Material).dispose() } }); return }
      gltf.scene.traverse(obj => { if (obj instanceof THREE.Mesh) { (obj.material as THREE.Material).dispose(); obj.material = material } })
      cloth.add(gltf.scene); dirty = true; onReady(true)
    }, undefined, () => { if (!disposed) { setFailed(true); onReady(false) } })
    const resize = () => { dirty = true; const { width, height } = mount.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.position.z = camera.aspect < .85 ? 10.6 : 8.8; camera.updateProjectionMatrix() }
    const observer = new ResizeObserver(resize); observer.observe(mount); resize()
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }); intersection.observe(mount)
    const down = (e: PointerEvent) => { downX = e.clientX; mount.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => { if (downX !== null) { dragX = Math.max(-.85, Math.min(.85, dragX + (e.clientX - downX) * .007)); downX = e.clientX } }
    const up = () => { downX = null }
    mount.addEventListener('pointerdown', down); mount.addEventListener('pointermove', move); mount.addEventListener('pointerup', up); mount.addEventListener('pointercancel', up)
    const render = (stamp: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden || !visible) { last = stamp; return }
      if (stamp - last < 32) return
      const state = `${inputs.current.color}:${inputs.current.rotation}:${dragX}`
      if ((inputs.current.paused || reduced.matches) && !dirty && state === previous) return
      previous = state; dirty = false
      const delta = Math.min((stamp - last) / 1000, .05); last = stamp
      if (!inputs.current.paused && !reduced.matches && downX === null) time += delta
      cloth.rotation.set(-.1 + Math.sin(time * 1.2) * .055, -.38 + Math.sin(time) * .16 + inputs.current.rotation + dragX, -.24)
      cloth.position.y = Math.sin(time * .35) * .055
      material.color.set(inputs.current.color)
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(render)
    const contextLost = (event: Event) => { event.preventDefault(); onReady(false); setFailed(true) }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect()
      mount.removeEventListener('pointerdown', down); mount.removeEventListener('pointermove', move); mount.removeEventListener('pointerup', up); mount.removeEventListener('pointercancel', up)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      cloth.traverse(obj => { if (obj instanceof THREE.Mesh) obj.geometry.dispose() })
      material.dispose(); texture.dispose(); renderer.dispose(); renderer.domElement.remove()
    }
  }, [onReady])
  return <div ref={host} className={`cloth-canvas ${failed ? 'cloth-unavailable' : ''}`} aria-hidden="true" />
}
