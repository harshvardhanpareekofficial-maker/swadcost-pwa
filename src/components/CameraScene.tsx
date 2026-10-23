import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export default function CameraScene() {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [motionReduced, setMotionReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => { const query = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setMotionReduced(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  const [rotation, setRotation] = useState(0)
  const [reset, setReset] = useState(0)
  const controls = useRef({ paused, rotation, reset })
  useEffect(() => { controls.current = { paused, rotation, reset } }, [paused, rotation, reset])
  useEffect(() => {
    const mount = host.current!
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }) } catch { return }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setClearColor(0, 0)
    mount.appendChild(renderer.domElement)
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .1, 50)
    camera.position.set(0, .15, 8)
    scene.add(new THREE.HemisphereLight(0xf0f5ff, 0x657278, 2.2))
    const key = new THREE.DirectionalLight(0xfff8ed, 2.5); key.position.set(3, 5, 6); scene.add(key)
    const rim = new THREE.DirectionalLight(0xc8e5ff, 1.8); rim.position.set(-4, 1, 2); scene.add(rim)
    const group = new THREE.Group(); group.rotation.set(.12,-.65,.035); scene.add(group)
    let disposed = false, frame = 0, time = 0, last = 0, drag = 0, pointer: number | null = null
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const disposeModel = (model: THREE.Object3D) => model.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()) } })
    new GLTFLoader().load('/models/cctv-concept.glb', gltf => {
      if (disposed) { disposeModel(gltf.scene); return }
      group.add(gltf.scene); setReady(true)
    }, undefined, () => { if (!disposed) setReady(false) })
    const resize = () => { const { width, height } = mount.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(1, height); camera.position.z = camera.aspect < 1 ? 9 : 7.6; camera.updateProjectionMatrix() }
    const observer = new ResizeObserver(resize); observer.observe(mount); resize()
    const down = (e: PointerEvent) => { pointer = e.clientX; mount.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => { if (pointer !== null) { drag += (e.clientX - pointer) * .008; pointer = e.clientX } }
    const up = () => { pointer = null }
    mount.addEventListener('pointerdown', down); mount.addEventListener('pointermove', move); mount.addEventListener('pointerup', up); mount.addEventListener('pointercancel', up)
    let oldState = '', resetSeen = 0
    const render = (stamp: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden || stamp - last < 32) return
      if (controls.current.reset !== resetSeen) { drag = 0; time = 0; resetSeen = controls.current.reset; oldState = "" }
      const state = `${controls.current.rotation}:${drag}:${mount.clientWidth}:${mount.clientHeight}:${group.children.length}`
      if ((controls.current.paused || reduced.matches) && oldState === state) return
      oldState = state
      if (!controls.current.paused && !reduced.matches) time += Math.min((stamp-last)/1000,.05)
      last = stamp; group.rotation.y = -.65 + Math.sin(time*.45)*.16 + drag + controls.current.rotation
      group.position.y = Math.sin(time*.7)*.08
      renderer.render(scene,camera)
    }
    frame = requestAnimationFrame(render)
    const lost = (e: Event) => { e.preventDefault(); setReady(false) }
    renderer.domElement.addEventListener('webglcontextlost', lost)
    return () => { disposed=true; cancelAnimationFrame(frame); observer.disconnect(); mount.removeEventListener('pointerdown',down); mount.removeEventListener('pointermove',move); mount.removeEventListener('pointerup',up); mount.removeEventListener('pointercancel',up); renderer.domElement.removeEventListener('webglcontextlost',lost); disposeModel(group); renderer.dispose(); renderer.domElement.remove() }
  }, [])
  return <div className="camera-stage">
    {!ready && <svg className="camera-poster" viewBox="0 0 400 280" aria-hidden="true"><path d="m245 170 5 58h-65" stroke="#dce6e7" strokeWidth="18" strokeLinecap="round" fill="none"/><path d="m110 75 130-25q18-3 23 14l28 90q4 16-13 21l-120 25Z" fill="#c8d5d9"/><rect x="92" y="72" width="121" height="124" rx="16" fill="#f3f3e8"/><rect x="116" y="104" width="73" height="57" rx="10" fill="#83aab8"/><circle cx="152" cy="132" r="16" fill="#416b7b"/><circle cx="148" cy="127" r="6" fill="#c1e8ec"/><path d="m91 70 130-26 57 7" fill="none" stroke="#eff3ec" strokeWidth="12" strokeLinecap="round"/></svg>}
    <div ref={host} className="camera-canvas" aria-hidden="true" />
    <div className="object-controls"><span>Illustrative camera</span><button onClick={()=>setRotation(r=>r-.4)} aria-label="Rotate camera left">↶</button><button onClick={()=>{setRotation(0);setReset(r=>r+1)}} aria-label="Reset camera rotation">Reset</button><button onClick={()=>setRotation(r=>r+.4)} aria-label="Rotate camera right">↷</button><button disabled={motionReduced} title={motionReduced?"Motion reduced by device preference":undefined} onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play camera motion':'Pause camera motion'}>{paused?'Play':'Pause'}</button></div>
  </div>
}
