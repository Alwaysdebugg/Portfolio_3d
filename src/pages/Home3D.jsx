import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Suspense, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// cities
const CITIES = [
    {
        name: "Vancouver",
        lat: 49.2827,
        lng: -123.1207,
        color: "#000000",
        scale: 1.2  // 可以为重要城市设置更大的标记
    }
];

// 经纬度转换为3D坐标
function latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
  
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
  
    return new THREE.Vector3(x, y, z);
  }

// 城市标记组件
function CityMarker({ position, color, name, onClick, scale, lat, lng }) {
    const [hovered, setHovered] = useState(false);
    
    return (
      <group
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* 城市点 */}
        <mesh>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {/* 连接线 */}
        <line>
          <bufferGeometry
            attach="geometry"
            {...new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(0, 0.2, 0.2)
            ])}
          />
          <lineBasicMaterial
            attach="material"
            color={color}
            linewidth={2}
            opacity={0.6}
            transparent
          />
        </line>
        
        {/* 永久可见的标签 */}
        <Html
          position={[0, 0.2, 0.2]}
          center
          style={{
            background: color,
            padding: '4px 8px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
            transform: 'scale(0.8)',
            whiteSpace: 'nowrap',
            opacity: hovered ? 1 : 0.8
          }}
        >
          {name}
        </Html>

        {/* 悬停时显示的详细信息 */}
        {hovered && (
          <Html
            position={[0, 0.3, 0.2]}
            center
            style={{
              background: 'rgba(0,0,0,0.8)',
              padding: '8px 12px',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>{name}</div>
              <div>经度: {lng.toFixed(2)}°</div>
              <div>纬度: {lat.toFixed(2)}°</div>
            </div>
          </Html>
        )}

        {/* 点击效果圆环 */}
        <mesh>
          <ringGeometry args={[0.03, 0.04, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={hovered ? 0.8 : 0.4}
          />
        </mesh>
      </group>
    );
  }

function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const sunLightRef = useRef();


  const handleCityClick = (city) => {
    console.log('Clicked city:', city.name);
    // 可以添加点击动画效果
    const targetPosition = latLngToVector3(city.lat, city.lng, 1.5);
    // 这里可以添加相机动画，聚焦到选中的城市
  }
  
  useFrame(({ clock }) => {
    // 地球自转
    earthRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    cloudsRef.current.rotation.y = clock.getElapsedTime() * 0.12;

    // 太阳光移动效果
    if (sunLightRef.current) {
      // 让太阳光围绕地球旋转，创造日夜交替效果
      const angle = clock.getElapsedTime() * 0.05; // 控制太阳移动速度
      sunLightRef.current.position.x = Math.cos(angle) * 3;
      sunLightRef.current.position.z = Math.sin(angle) * 3;
    }
  });

  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.1} />

      {/* 主光源 - 模拟太阳光 */}
      <directionalLight
        ref={sunLightRef}
        position={[3, 0, 0]}
        intensity={5}
        color="#ffffff"
        castShadow
      />

      {/* 辅助太阳光 - 增加背光效果 */}
      <directionalLight
        position={[-3, 0, 0]}
        intensity={0.5}
        color="#ffddaa" // 暖色调的补光
      />

      {/* 地球本体 */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={new THREE.TextureLoader().load("/textures/earth_map.jpg")}
          bumpMap={new THREE.TextureLoader().load("/textures/earth_bump.jpg")}
          bumpScale={0.1}
          //   specularMap={new THREE.TextureLoader().load('/textures/earth_spec.jpg')}
          //   specular={new THREE.Color('grey')}
          // 添加夜间纹理
          emissiveMap={new THREE.TextureLoader().load(
            "/textures/earth_night.jpg"
          )}
          emissive={new THREE.Color("white")}
          emissiveIntensity={1.2}
          // 添加光泽效果
          shininess={15}
          specular={new THREE.Color(0x2d4ea0)}
        />

        {/* 添加城市标记 */}
        {CITIES.map((city) => (
          <CityMarker
            key={city.name}
            position={latLngToVector3(city.lat, city.lng, 1.01)}
            color={city.color}
            name={city.name}
            lat={city.lat}
            lng={city.lng}
            onClick={() => handleCityClick(city)}
            scale={city.scale || 1}
          />
        ))}
      </mesh>

      {/* 大气层效果 */}
      <mesh scale={1.02}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          color="#4db2ff"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 云层 */}
      <mesh ref={cloudsRef} scale={1.01}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial
          map={new THREE.TextureLoader().load("/textures/earth_clouds.jpg")}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 星空背景 */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          map={new THREE.TextureLoader().load("/textures/galaxy_starfield.png")}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 控制器 */}
      <OrbitControls
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4}
        enablePan={false}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function Home3D() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ 
          position: [0, 0, 2.5],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </Canvas>
    </div>
  );
} 