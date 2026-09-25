import { writeFileSync, mkdirSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
globalThis.FileReader = class { async readAsArrayBuffer(blob) { this.result=await blob.arrayBuffer(); this.onloadend?.(); } };
const scene = new THREE.Scene();
const geometry = new THREE.PlaneGeometry(5,3.6,128,96);
const position = geometry.attributes.position;
for(let i=0;i<position.count;i++) {
 const x=position.getX(i),y=position.getY(i);
 position.setXYZ(i,x+.12*Math.sin(y*1.8),y,.38*Math.sin(x*1.5+y*.7)+.18*Math.cos(y*2.1)+.13*x*x);
}
geometry.computeVertexNormals();
const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88,side:THREE.DoubleSide});
const fabric=new THREE.Mesh(geometry,material);fabric.name='Woven cloth';scene.add(fabric);
const edges=[];
for(let i=0;i<=128;i++){const x=-2.5+i*5/128;const y=-1.8;edges.push(new THREE.Vector3(x+.12*Math.sin(y*1.8),y,.38*Math.sin(x*1.5+y*.7)+.18*Math.cos(y*2.1)+.13*x*x));}
const seam = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edges),128,.012,5,false),new THREE.MeshStandardMaterial({color:0xdce4c3,roughness:.9}));seam.name='Selvedge';scene.add(seam);
mkdirSync('public/models',{recursive:true});
const binary=await new GLTFExporter().parseAsync(scene,{binary:true});writeFileSync('public/models/woven-cloth.glb',Buffer.from(binary));
console.log('Authored cloth GLB: '+binary.byteLength+' bytes');
