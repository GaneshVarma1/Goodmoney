import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { SpotLight, useDepthBuffer } from '@react-three/drei';
import * as THREE from 'three';
import React, { Suspense, useRef, useState, useEffect, forwardRef, useMemo, useCallback } from "react";
import { Vector3, Matrix4, Quaternion } from "three";
import { RoundedBox } from "@react-three/drei";

type Cube = {
  position: THREE.Vector3;
  rotationMatrix: THREE.Matrix4;
  id: string;
  originalCoords: { x: number; y: number; z: number };
};

type Move = {
  axis: 'x' | 'y' | 'z';
  layer: number;
  direction: number;
  rotationAngle: number;
};

const RubiksCubeModel = forwardRef((props, ref) => {
  const ANIMATION_DURATION = 1.2;
  const GAP = 0.01;
  const RADIUS = 0.075;
  
  const mainGroupRef = useRef<THREE.Group>(null);
  const isAnimatingRef = useRef(false);
  const currentRotationRef = useRef(0);
  const lastMoveAxisRef = useRef<string | null>(null);
  const currentMoveRef = useRef<Move | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true); 
  const viewportSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  
  const isResizingRef = useRef(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [size, setSize] = useState<number>(0.8);
  const [cubes, setCubes] = useState<Array<Cube>>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [deviceSettings, setDeviceSettings] = useState(() => {
    const isMobile = window.innerWidth < 768;
    return {
      smoothness: isMobile ? 2 : 4,
      castShadow: !isMobile,
      receiveShadow: !isMobile
    };
  });
  
  const reusableVec3 = useMemo(() => new Vector3(), []);
  const reusableMatrix4 = useMemo(() => new Matrix4(), []);
  const reusableQuaternion = useMemo(() => new Quaternion(), []);
  
  React.useImperativeHandle(ref, () => ({
    ...mainGroupRef.current,
    reset: resetCube
  }));

  const initializeCubes = useCallback(() => {
    const initial = [];
    const positions = [-1, 0, 1];
    
    for (const x of positions) {
      for (const y of positions) {
        for (const z of positions) {
          initial.push({
            position: new Vector3(x, y, z),
            rotationMatrix: new Matrix4().identity(),
            id: `cube-${x}-${y}-${z}`,
            originalCoords: { x, y, z }
          });
        }
      }
    }
    return initial;
  }, []);

  useEffect(() => {
    setCubes(initializeCubes());
    
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  }, [initializeCubes]);

  const resetCube = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setCubes(initializeCubes());
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.set(0, 0, 0);
    }
    isAnimatingRef.current = false;
    currentRotationRef.current = 0;
    lastMoveAxisRef.current = null;
    currentMoveRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [initializeCubes]);

  const handleResize = useCallback(() => {
    if (isResizingRef.current) return;
    isResizingRef.current = true;
    
    let throttleTimer: number | null = null;
    
    const updateSize = () => {
      if (!isMountedRef.current) return;
      
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      if (newWidth !== viewportSizeRef.current.width || 
          newHeight !== viewportSizeRef.current.height) {
        viewportSizeRef.current = { width: newWidth, height: newHeight };
        setDeviceSettings(prev => ({
          ...prev,
          smoothness: newWidth < 768 ? 2 : 4,
          castShadow: newWidth >= 768,
          receiveShadow: newWidth >= 768
        }));
      }
      
      isResizingRef.current = false;
      throttleTimer = null;
    };
    
    if (throttleTimer === null) {
      throttleTimer = window.setTimeout(updateSize, 100);
    }
  }, []);

  useEffect(() => {
    handleResize();
    
    let throttleTimer: number | null = null;
    const throttledHandler = () => {
      if (throttleTimer) return;
      throttleTimer = window.setTimeout(() => {
        handleResize();
        throttleTimer = null;
      }, 100);
    };
    
    window.addEventListener('resize', throttledHandler);
    window.addEventListener('orientationchange', throttledHandler);
    
    return () => {
      window.removeEventListener('resize', throttledHandler);
      window.removeEventListener('orientationchange', throttledHandler);
      if (throttleTimer) {
        window.clearTimeout(throttleTimer);
      }
    };
  }, [handleResize]);

  const handleVisibilityChange = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const timeoutId: number = window.setTimeout(() => {
      setIsVisible(!document.hidden);
      if (!document.hidden) {
        handleResize();
      }
    }, 100);
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [handleResize]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const possibleMoves = useMemo(() => {
    const moves: Array<{ axis: 'x' | 'y' | 'z'; layer: number; direction: number }> = [];
    for (const axis of ['x', 'y', 'z'] as const) {
      for (const layer of [-1, 0, 1]) {
        for (const direction of [1, -1]) {
          moves.push({ axis, layer, direction });
        }
      }
    }
    return moves;
  }, []);

  const isInLayer = useCallback((
    position: THREE.Vector3,
    axis: 'x' | 'y' | 'z',
    layer: number
  ) => {
    const coord = axis === "x" ? position.x : axis === "y" ? position.y : position.z;
    return Math.abs(coord - layer) < 0.1;
  }, []);

  const selectNextMove = useCallback(() => {
    if (!isAnimatingRef.current && isVisible && isMountedRef.current && !isResizingRef.current) {
      const availableMoves = possibleMoves.filter(
        (move) => move.axis !== lastMoveAxisRef.current
      );
      
      const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      const rotationAngle = Math.PI / 2;
            
      currentMoveRef.current = {
        axis: move.axis as 'x' | 'y' | 'z',
        layer: move.layer,
        direction: move.direction,
        rotationAngle
      };
      lastMoveAxisRef.current = move.axis;
      isAnimatingRef.current = true;
      currentRotationRef.current = 0;
    }
  }, [possibleMoves, isVisible]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    const scheduleNextMove = () => {
      if (isVisible && isMountedRef.current && !isResizingRef.current) {
        const delay = isAnimatingRef.current ? ANIMATION_DURATION * 1000 : 200;
        
        timeoutId = setTimeout(
          () => {
            selectNextMove();
            if (isMountedRef.current) {
              scheduleNextMove();
            }
          },
          delay
        );
      } else {
        
        if (isResizingRef.current && isVisible && isMountedRef.current) {
          setTimeout(() => {
            if (isMountedRef.current) {
              scheduleNextMove();
            }
          }, 500);
        }
      }
    };

    scheduleNextMove();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible, selectNextMove]);

  const createRotationMatrix = useCallback((
    axis: 'x' | 'y' | 'z',
    angle: number
  ) => {
    reusableMatrix4.identity();
    reusableQuaternion.identity();
    reusableVec3.set(0, 0, 0);
    
    reusableVec3.set(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    );
    reusableQuaternion.setFromAxisAngle(reusableVec3, angle);
    return reusableMatrix4.makeRotationFromQuaternion(reusableQuaternion);
  }, [reusableMatrix4, reusableQuaternion, reusableVec3]);

  const easeInOutQuad = useCallback((t: number) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }, []);

  const matrixToQuaternion = useCallback((matrix: THREE.Matrix4) => {
    reusableQuaternion.setFromRotationMatrix(matrix);
    return reusableQuaternion.clone();
  }, [reusableQuaternion]);

  const normalizePositions = useCallback((cubes: Cube[]) => {
    return cubes.map((cube: Cube) => {
      const x = Math.round(cube.position.x);
      const y = Math.round(cube.position.y);
      const z = Math.round(cube.position.z);
      
      const newPosition = 
        (Math.abs(cube.position.x - x) > 0.001 || 
         Math.abs(cube.position.y - y) > 0.001 || 
         Math.abs(cube.position.z - z) > 0.001) 
          ? new Vector3(x, y, z) 
          : cube.position;
      
      return {
        ...cube,
        position: newPosition
      };
    });
  }, []);

  const checkCubeIntegrity = useCallback((cubes: Cube[]) => {
    if (cubes.length !== 27) {
      console.warn("Incorrect number of cubes:", cubes.length);
      return false;
    }

    for (const cube of cubes) {
      const { x, y, z } = cube.position;
      if (Math.abs(x) > 1.1 || Math.abs(y) > 1.1 || Math.abs(z) > 1.1) {
        console.warn("Cube out of range:", cube.id, x, y, z);
        return false;
      }
    }
    
    return true;
  }, []);

  const updateCubes = useCallback((
    prevCubes: Cube[],
    move: Move,
    stepRotationMatrix: THREE.Matrix4
  ) => {
    return prevCubes.map((cube: Cube) => {
      if (isInLayer(cube.position, move.axis, move.layer)) {
        const tempVec3 = new Vector3(
          cube.position.x,
          cube.position.y,
          cube.position.z
        );

        tempVec3.applyMatrix4(stepRotationMatrix);

        const newRotationMatrix = new Matrix4().multiplyMatrices(
          stepRotationMatrix,
          cube.rotationMatrix
        );

        return {
          ...cube,
          position: tempVec3,
          rotationMatrix: newRotationMatrix,
        };
      }
      return cube;
    });
  }, [isInLayer]);

  useFrame((state, delta) => {
    if (!isVisible || !isMountedRef.current) return;

    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.x += delta * 0.3;
      mainGroupRef.current.rotation.y += delta * 0.5;
      mainGroupRef.current.rotation.z += delta * 0.2;
    }

    if (isResizingRef.current && isAnimatingRef.current) {
      resetCube();
      return;
    }

    if (isAnimatingRef.current && currentMoveRef.current) {
      const move = currentMoveRef.current;
      const targetRotation = move.rotationAngle;
      const rotation = delta / ANIMATION_DURATION;

      if (currentRotationRef.current < 1) {
        const newRotation = Math.min(currentRotationRef.current + rotation, 1);
        const prevRotation = currentRotationRef.current;
        currentRotationRef.current = newRotation;

        const easedProgress = easeInOutQuad(newRotation);
        const prevEasedProgress = easeInOutQuad(prevRotation);
        const currentAngle = easedProgress * targetRotation;
        const prevAngle = prevEasedProgress * targetRotation;
        const stepRotation = currentAngle - prevAngle;

        const stepRotationMatrix = createRotationMatrix(
          move.axis,
          stepRotation * move.direction
        );

        if (isMountedRef.current && !isResizingRef.current) {
          setCubes((prevCubes) => {
            const updatedCubes = updateCubes(prevCubes, move, stepRotationMatrix);
            
            if (newRotation >= 1) {
              const normalizedCubes = normalizePositions(updatedCubes);
              
              if (!checkCubeIntegrity(normalizedCubes)) {
                console.warn("Found a cube out of bounds");
                if (isMountedRef.current) {
                  setTimeout(() => resetCube(), 0);
                }
              }
              
              isAnimatingRef.current = false;
              currentRotationRef.current = 0;
              currentMoveRef.current = null;
              
              return normalizedCubes;
            }
            
            return updatedCubes;
          });
        }
      }
    }
  });

  const chromeMaterial = useMemo(() => ({
    color: '#000000',
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 0,
    clearcoatRoughness: 0,
    reflectivity: 0.5,
    iridescence: 0,
    iridescenceIOR: 0,
    iridescenceThicknessRange: [100, 400] as [number, number],
    envMapIntensity: 8
  }), []);

  const sharedMaterial = useMemo(() => (
    <meshPhysicalMaterial {...chromeMaterial} />
  ), [chromeMaterial]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rotateLayer = useCallback((
    position: THREE.Vector3,
    axis: 'x' | 'y' | 'z',
    layer: number,
    angle: number
  ) => {
    const timeoutId: number = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      const rotationMatrix = new THREE.Matrix4();
      const rotationAxis = new THREE.Vector3();
      switch (axis) {
        case 'x': rotationAxis.set(1, 0, 0); break;
        case 'y': rotationAxis.set(0, 1, 0); break;
        case 'z': rotationAxis.set(0, 0, 1); break;
      }
      rotationMatrix.makeRotationAxis(rotationAxis, angle);
      setCubes((prevCubes: Cube[]) =>
        prevCubes.map((cube: Cube) => {
          const pos = cube.position.clone();
          const axisIdx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
          if (Math.abs(pos.getComponent(axisIdx) - layer) < 0.1) {
            pos.applyMatrix4(rotationMatrix);
          }
          return { ...cube, position: pos };
        })
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rotateCube = useCallback((axis: 'x' | 'y' | 'z', angle: number) => {
    const timeoutId: number = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      const rotationMatrix = new THREE.Matrix4();
      const rotationAxis = new THREE.Vector3();
      switch (axis) {
        case 'x': rotationAxis.set(1, 0, 0); break;
        case 'y': rotationAxis.set(0, 1, 0); break;
        case 'z': rotationAxis.set(0, 0, 1); break;
      }
      rotationMatrix.makeRotationAxis(rotationAxis, angle);
      setCubes((prevCubes: Cube[]) =>
        prevCubes.map((cube: Cube) => {
          const pos = cube.position.clone();
          pos.applyMatrix4(rotationMatrix);
          return { ...cube, position: pos };
        })
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <group ref={mainGroupRef} {...props}>
      {cubes.map((cube) => (
        <group
          key={cube.id}
          position={[
            cube.position.x * (size + GAP),
            cube.position.y * (size + GAP),
            cube.position.z * (size + GAP),
          ]}
          quaternion={matrixToQuaternion(cube.rotationMatrix)}
        >
          <RoundedBox
            args={[size, size, size]}
            radius={RADIUS}
            smoothness={deviceSettings.smoothness}
            castShadow={deviceSettings.castShadow}
            receiveShadow={deviceSettings.receiveShadow}
          >
            {sharedMaterial}
          </RoundedBox>
        </group>
      ))}
    </group>
  );
});

RubiksCubeModel.displayName = 'RubiksCubeModel';

function CameraController() {
  const { camera } = useThree();
  
  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

interface SpotlightProps {
  depthBuffer: THREE.DepthTexture;
  color: string;
  position: [number, number, number];
  volumetric: boolean;
  opacity: number;
  penumbra: number;
  distance: number;
  angle: number;
  attenuation: number;
  anglePower: number;
  intensity: number;
  shadowMapSize: number;
  shadowBias: number;
  shadowAutoUpdate: boolean;
  castShadow: boolean;
}

function EnhancedSpotlight(props: SpotlightProps) {
  const light = useRef<THREE.SpotLight>(null);
  
  // Uncomment to see a visual helper for the spotlight
  //useHelper(spotlightRef, THREE.SpotLightHelper, 'red');
  
  useEffect(() => {
    if (light.current) {
      light.current.target.position.set(0, 0, 0);
      light.current.target.updateMatrixWorld();
    }
  }, []);
  
  return (
    <>
      <SpotLight 
        ref={light} 
        {...props}
        castShadow={false} 
      />
    </>
  );
}

function SceneContent() {

  const depthBuffer = useDepthBuffer({ 
    size: 2048,
    frames: 1
  });
  
  const [time, setTime] = useState(0);
  useFrame((state) => {
    setTime(state.clock.getElapsedTime());
  });
  
  const spotlightPosition = useMemo(() => {
    return [
      3 + Math.sin(time * 0.5) * 0.5,  // subtle x movement
      3 + Math.cos(time * 0.5) * 0.5,  // subtle y movement
      2
    ];
  }, [time]);
  
  return (
    <>
      <EnhancedSpotlight 
        depthBuffer={depthBuffer} 
        color="#aaaace" 
        position={spotlightPosition as [number, number, number]}
        volumetric={true}
        opacity={1}
        penumbra={1}
        distance={17}
        angle={0.8}
        attenuation={30}
        anglePower={6}
        intensity={1}
        shadowMapSize={2048}
        shadowBias={-0.0001}
        shadowAutoUpdate={true}
        castShadow={true}
      />
      
      <PerspectiveCamera
        makeDefault
        fov={50}
        position={[0, 0, 7]}
        near={0.1}
        far={1000}
      />

      <CameraController />

      <Suspense fallback={null}>
        <RubiksCubeModel ref={undefined} />
      </Suspense>
    </>
  );
}

export function Scene() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkIsDesktop();

    window.addEventListener("resize", checkIsDesktop);

    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  return (
    <div className="h-svh w-screen relative bg-black">
      <Canvas
        shadows
        gl={{
          antialias: isDesktop,
          preserveDrawingBuffer: isDesktop,
          powerPreference: isDesktop ? "high-performance" : "default",
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <SceneContent />
        {/* <Perf /> */}
      </Canvas>
    </div>
  );
}