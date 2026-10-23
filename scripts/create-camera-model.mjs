import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';
// Original unbranded product illustration. No third-party mesh or texture.
globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }); } };
const scene = new THREE.Scene();
const shell = new THREE.MeshStandardMaterial({color:0xf5f2e9,roughness:.38,metalness:.12});
const trim = new THREE.MeshStandardMaterial({color:0xbeced2,roughness:.35,metalness:.5});
const glass = new THREE.MeshStandardMaterial({color:0x6c9bab,roughness:.13,metalness:.48});
const lens = new THREE.MeshStandardMaterial({color:0x315667,roughness:.1,metalness:.65});
const shine = new THREE.MeshStandardMaterial({color:0xc6ecf1,roughness:.1,metalness:.35});
const led = new THREE.MeshStandardMaterial({color:0xb9d7c9,emissive:0x44775a,emissiveIntensity:.2,roughness:.5});
function rounded(w,h,d,x,y,z,r,mat){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,r),mat);mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
function disc(r,depth,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,depth,48),mat);mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);scene.add(mesh);return mesh;}
// Soft, elongated weatherproof body and shallow visor.
rounded(1.65,1.15,2.5,0,.12,-.12,.22,shell);
rounded(1.73,.12,2.45,0,.74,.06,.05,shell);
rounded(1.58,1.07,.12,0,.12,1.14,.18,trim);
rounded(1.47,.97,.11,0,.12,1.22,.18,shell);
rounded(.94,.61,.08,0,.16,1.29,.16,glass);
// Recessed compact optics instead of an oversized black eye.
disc(.205,.035,0,.16,1.345,trim);disc(.16,.038,0,.16,1.369,lens);disc(.102,.009,0,.16,1.394,glass);
disc(.036,.01,-.046,.208,1.402,shine);disc(.026,.015,.54,-.17,1.29,led);
for(const x of [-.58,.58])for(const y of [-.22,.46]){disc(.028,.018,x,y,1.284,trim);rounded(.023,.004,.004,x,y,1.295,.001,shell)}
// Rear seam and restrained side vents.
rounded(1.57,1.07,.025,0,.12,-1.37,.2,trim);
for(let i=0;i<5;i++)rounded(.012,.16,.035,.826,.03,-.7+i*.12,.005,trim);
// Compact swivel mount with a rounded base, keeping the silhouette light.
const joint=new THREE.Mesh(new THREE.SphereGeometry(.22,24,16),trim);joint.position.set(0,-.57,-.48);scene.add(joint);
rounded(.24,.73,.28,0,-.98,-.48,.1,shell);
rounded(1.05,.13,.83,0,-1.38,-.48,.065,shell);
for(const x of [-.35,.35]){const screw=disc(.028,.014,x,-1.30,-.48,trim);screw.rotation.x=0;}
scene.rotation.set(.12,-.65,.035);
const output=await new GLTFExporter().parseAsync(scene,{binary:true});
await writeFile('public/models/cctv-concept.glb',Buffer.from(output));
console.log('Original rounded camera GLB:',output.byteLength,'bytes');
