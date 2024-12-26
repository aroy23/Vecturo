import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

const ThreeScene = ({ width = "100%", height = "50vh", className = "" }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const pivotRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5); // Sky blue background
    sceneRef.current = scene;

    // Create pivot group
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotRef.current = pivot;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      40,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20);
    const targetPosition = new THREE.Vector3(0, 5, 0); // Point at (0, 0, 0)
    camera.lookAt(targetPosition);
    camera.zoom = 0.4; // Zoom out by 2x
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const containerWidth = mountRef.current.clientWidth;
    const containerHeight = mountRef.current.clientHeight;
    renderer.setSize(containerWidth, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x87ceeb, 1); // Set clear color to match background
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add supplementary lights
    const frontLight = new THREE.DirectionalLight(0xffffff, 1);
    frontLight.position.set(0, 10, 20);
    scene.add(frontLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 10, -20);
    scene.add(backLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false; // Disable all controls
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Mouse event handlers
    const handleMouseDown = (event) => {
      isDraggingRef.current = true;
      const rect = mountRef.current.getBoundingClientRect();
      lastMousePosRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleMouseMove = (event) => {
      if (!isDraggingRef.current) return;

      const rect = mountRef.current.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;

      const deltaX = (currentX - lastMousePosRef.current.x) * 0.01;
      
      if (pivotRef.current) {
        pivotRef.current.rotation.y += deltaX;
      }

      lastMousePosRef.current = {
        x: currentX,
        y: currentY
      };
    };

    // Add mouse event listeners
    mountRef.current.addEventListener('mousedown', handleMouseDown);
    mountRef.current.addEventListener('mouseup', handleMouseUp);
    mountRef.current.addEventListener('mouseleave', handleMouseUp);
    mountRef.current.addEventListener('mousemove', handleMouseMove);

    // Load City Model
    const fbxLoader = new FBXLoader();
    fbxLoader.load(
      "/models/city.fbx",
      (object) => {
        // Adjust model scale if needed
        object.scale.set(0.02, 0.02, 0.02);

        // Center the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());

        pivot.position.copy(center).add(new THREE.Vector3(10, 5, 0));
        object.position.sub(center);

        pivot.add(object);
        modelRef.current = object;
      },
      (progress) => {
        console.log(
          "Loading progress:",
          (progress.loaded / progress.total) * 100,
          "%"
        );
      },
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    // Animation loop
    const animate = () => {
      timeRef.current += 0.02;

      // Apply constant rotation when not dragging
      if (pivotRef.current && !isDraggingRef.current) {
        pivotRef.current.rotation.y += 0.001;
      }

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight, true);
    };
    
    // Create a ResizeObserver to watch the container size
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener('mousedown', handleMouseDown);
        mountRef.current.removeEventListener('mouseup', handleMouseUp);
        mountRef.current.removeEventListener('mouseleave', handleMouseUp);
        mountRef.current.removeEventListener('mousemove', handleMouseMove);
        
        // Only try to remove child if both renderer and its DOM element exist
        if (rendererRef.current && rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: height,
        border: "3px solid rgba(68,68,255,0.6)",
        boxShadow: "0 0 15px -2px rgba(68,68,255,0.3)",
        animation: "borderGlow 3s ease-in-out infinite",
        borderRadius: "16px",
        position: "relative",
        overflow: "hidden",
        background: "transparent",
        minHeight: "300px",
        maxHeight: "60vh"
      }}
      className={`${className} relative`}
    >
      <style>
        {`
          @keyframes borderGlow {
            0% {
              box-shadow: 0 0 15px -2px rgba(68,68,255,0.3);
              border-color: rgba(68,68,255,0.6);
            }
            50% {
              box-shadow: 0 0 25px -2px rgba(68,68,255,0.5);
              border-color: rgba(68,68,255,0.9);
            }
            100% {
              box-shadow: 0 0 15px -2px rgba(68,68,255,0.3);
              border-color: rgba(68,68,255,0.6);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ThreeScene;
