import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const DEFAULT_EARTH_TEXTURE =
  'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg';
const DEFAULT_BUMP_TEXTURE =
  'https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png';

const defaultConfig = {
  radius: 2,
  textureUrl: DEFAULT_EARTH_TEXTURE,
  bumpMapUrl: DEFAULT_BUMP_TEXTURE,
  showAtmosphere: true,
  atmosphereColor: '#4da6ff',
  atmosphereIntensity: 0.85,
  atmosphereBlur: 2,
  bumpScale: 5,
  autoRotateSpeed: 0.3,
  enableZoom: false,
  enablePan: false,
  minDistance: 5,
  maxDistance: 15,
  markerSize: 0.06,
  showWireframe: false,
  wireframeColor: '#9ed8ff',
  ambientIntensity: 0.9,
  pointLightIntensity: 1.8,
  backgroundColor: 'transparent',
};

function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/** WebGL plane + texture so the pin shares the same projection as the leader line (Html/CSS drifts). */
function MarkerIconPlane({
  marker,
  radius,
  defaultSize,
  hovered,
  onPointerEnter,
  onPointerLeave,
  onClick,
}) {
  const texture = useTexture(marker.src);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const markerSize = marker.size || defaultSize;
  // World units: keep planes a few % of globe radius (old formula topped out ~0.38*r → absurdly large).
  const sizeT = Math.min(1.45, Math.max(0.85, markerSize / defaultSize));
  const s = radius * (0.024 + 0.018 * sizeT);

  return (
    <mesh
      scale={hovered ? 1.1 : 1}
      onPointerOver={(event) => {
        event.stopPropagation();
        onPointerEnter();
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onPointerLeave();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <planeGeometry args={[s, s]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={hovered ? 1 : 0.92}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-0.5}
        polygonOffsetUnits={-0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Marker({ marker, radius, defaultSize, onClick, onHover }) {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const imageGroupRef = useRef(null);
  const { camera } = useThree();

  const surfacePosition = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.001),
    [marker.lat, marker.lng, radius]
  );

  const topPosition = useMemo(
    () => latLngToVector3(marker.lat, marker.lng, radius * 1.15),
    [marker.lat, marker.lng, radius]
  );

  const lineHeight = topPosition.distanceTo(surfacePosition);

  const { lineCenter, lineQuaternion } = useMemo(() => {
    const center = surfacePosition.clone().lerp(topPosition, 0.5);
    const direction = topPosition.clone().sub(surfacePosition).normalize();
    const quaternion = new THREE.Quaternion();

    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

    return { lineCenter: center, lineQuaternion: quaternion };
  }, [surfacePosition, topPosition]);

  // Tangent plane at the pin: same normal as the leader line so the rod meets the icon center.
  const labelQuaternion = useMemo(() => {
    const outward = topPosition.clone().normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), outward);
    return q;
  }, [topPosition]);

  useFrame(() => {
    if (!imageGroupRef.current) {
      return;
    }

    const worldPos = new THREE.Vector3();
    imageGroupRef.current.getWorldPosition(worldPos);

    const markerDirection = worldPos.clone().normalize();
    const cameraDirection = camera.position.clone().normalize();
    const dot = markerDirection.dot(cameraDirection);

    setIsVisible(dot > 0.08);
  });

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    onHover?.(marker);
  }, [marker, onHover]);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback(() => {
    onClick?.(marker);
  }, [marker, onClick]);

  return (
    <group visible={isVisible}>
      <mesh position={lineCenter} quaternion={lineQuaternion}>
        <cylinderGeometry args={[0.003, 0.003, lineHeight, 8]} />
        <meshBasicMaterial
          color={hovered ? '#f8fafc' : '#94a3b8'}
          transparent
          opacity={hovered ? 0.95 : 0.65}
        />
      </mesh>

      <mesh position={surfacePosition} quaternion={lineQuaternion}>
        <coneGeometry args={[0.018, 0.045, 8]} />
        <meshBasicMaterial color={hovered ? '#f59e0b' : '#ef4444'} />
      </mesh>

      <group ref={imageGroupRef} position={topPosition} quaternion={labelQuaternion}>
        <MarkerIconPlane
          marker={marker}
          radius={radius}
          defaultSize={defaultSize}
          hovered={hovered}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
        />
      </group>
    </group>
  );
}

function RotatingGlobe({ config, markers, onMarkerClick, onMarkerHover }) {
  const [earthTexture, bumpTexture] = useTexture([
    config.textureUrl,
    config.bumpMapUrl,
  ]);

  useMemo(() => {
    if (earthTexture) {
      earthTexture.colorSpace = THREE.SRGBColorSpace;
      earthTexture.anisotropy = 16;
    }

    if (bumpTexture) {
      bumpTexture.anisotropy = 8;
    }
  }, [earthTexture, bumpTexture]);

  const geometry = useMemo(() => new THREE.SphereGeometry(config.radius, 64, 64), [config.radius]);
  const wireframeGeometry = useMemo(
    () => new THREE.SphereGeometry(config.radius * 1.002, 32, 16),
    [config.radius]
  );

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={earthTexture}
          bumpMap={bumpTexture}
          bumpScale={config.bumpScale * 0.05}
          roughness={0.72}
          metalness={0}
        />
      </mesh>

      {config.showWireframe && (
        <mesh geometry={wireframeGeometry}>
          <meshBasicMaterial
            color={config.wireframeColor}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      )}

      {markers.map((marker, index) => (
        <Marker
          key={`marker-${index}-${marker.lat}-${marker.lng}`}
          marker={marker}
          radius={config.radius}
          defaultSize={config.markerSize}
          onClick={onMarkerClick}
          onHover={onMarkerHover}
        />
      ))}
    </group>
  );
}

function Atmosphere({ radius, color, intensity, blur }) {
  const fresnelPower = Math.max(0.5, 5 - blur);

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          atmosphereColor: { value: new THREE.Color(color) },
          intensity: { value: intensity },
          fresnelPower: { value: fresnelPower },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 atmosphereColor;
          uniform float intensity;
          uniform float fresnelPower;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, normalize(-vPosition))), fresnelPower);
            gl_FragColor = vec4(atmosphereColor, fresnel * intensity);
          }
        `,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [color, fresnelPower, intensity]
  );

  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[radius, 64, 32]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  );
}

function Scene({ markers, config, onMarkerClick, onMarkerHover }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, config.radius * 3.5);
    camera.lookAt(0, 0, 0);
  }, [camera, config.radius]);

  return (
    <>
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight
        position={[config.radius * 5, config.radius * 2, config.radius * 5]}
        intensity={config.pointLightIntensity}
        color="#ffffff"
      />
      <directionalLight
        position={[-config.radius * 3, config.radius, -config.radius * 2]}
        intensity={config.pointLightIntensity * 0.3}
        color="#88ccff"
      />

      <RotatingGlobe
        config={config}
        markers={markers}
        onMarkerClick={onMarkerClick}
        onMarkerHover={onMarkerHover}
      />

      {config.showAtmosphere && (
        <Atmosphere
          radius={config.radius}
          color={config.atmosphereColor}
          intensity={config.atmosphereIntensity}
          blur={config.atmosphereBlur}
        />
      )}

      <OrbitControls
        makeDefault
        enablePan={config.enablePan}
        enableZoom={config.enableZoom}
        minDistance={config.minDistance}
        maxDistance={config.maxDistance}
        rotateSpeed={0.4}
        autoRotate={config.autoRotateSpeed > 0}
        autoRotateSpeed={config.autoRotateSpeed}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="globe-loading">Loading globe...</div>
    </Html>
  );
}

function GlobeFallback({ markers, className }) {
  return (
    <div className={`globe-fallback${className ? ` ${className}` : ''}`} data-testid="globe-fallback">
      <p>3D globe preview</p>
      <span>{markers.length} plotted markers</span>
    </div>
  );
}

export default function Globe3D({
  markers = [],
  config = {},
  className = '',
  onMarkerClick,
  onMarkerHover,
}) {
  const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  if (process.env.NODE_ENV === 'test') {
    return <GlobeFallback markers={markers} className={className} />;
  }

  return (
    <div className={`globe-canvas-shell${className ? ` ${className}` : ''}`}>
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        camera={{
          fov: 45,
          near: 0.1,
          far: 1000,
          position: [0, 0, mergedConfig.radius * 3.5],
        }}
        style={{ background: mergedConfig.backgroundColor || 'transparent' }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene
            markers={markers}
            config={mergedConfig}
            onMarkerClick={onMarkerClick}
            onMarkerHover={onMarkerHover}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
