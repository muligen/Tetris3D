import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Board, BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE } from '../game/Board';
import { Piece } from '../game/Piece';
import { useTetrisStore } from '../stores/tetrisStore';
import { Easing } from '../utils/animation';

// Bomb indicator geometry (shared, small sphere)
const BOMB_GEOMETRY = new THREE.SphereGeometry(0.15, 8, 8);
const BOMB_FUSE_GEOMETRY = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 4);

interface GameBoardProps {
  board: Board;
  currentPiece: Piece | null;
}

// Squash animation duration in ms
const SQUASH_DURATION = 400;

// Maximum number of blocks that can be placed on the board
const MAX_BLOCKS = BOARD_WIDTH * BOARD_HEIGHT;

export function GameBoard({ board, currentPiece }: GameBoardProps) {
  const meshRef = useRef<THREE.Group>(null);
  const placedMeshRef = useRef<THREE.Group>(null);
  const lastVersionRef = useRef(0);

  // Ref to track the InstancedMesh for each color
  const placedPiecesRef = useRef<Map<number, {
    mesh: THREE.InstancedMesh;
    count: number;
    matrices: Float32Array;
  }>>(new Map());

  // Ref to track the current mapping of cells to their instance indices
  const cellToIndexRef = useRef<Map<string, number>>(new Map());

  // Reusable temporary objects for matrix calculations (avoid per-frame allocations)
  const tempMatrix = useRef(new THREE.Matrix4()).current;
  const tempQuaternion = useRef(new THREE.Quaternion()).current;
  const tempPosition = useRef(new THREE.Vector3()).current;
  const tempScale = useRef(new THREE.Vector3()).current;

  // Track squash animation for recently placed cells
  const squashAnimRef = useRef<{
    cells: Set<string>; // Set of "x,y" strings for cells to animate
    startTime: number;
    intensity: number;
  } | null>(null);

  // Material for current piece (reused across frames)
  const currentPieceMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Material for ghost piece (reused across frames)
  const ghostMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Get landing impact state from store
  const landingImpact = useTetrisStore((state) => state.landingImpact);
  // Subscribe to version to detect game state changes every frame
  const version = useTetrisStore((state) => state.version);
  // Bomb countdown state
  const bombCountdown = useTetrisStore((state) => state.bombCountdown);

  // Shared geometry for all blocks (cached as singleton)
  const blockGeometry = useMemo(() => new THREE.BoxGeometry(
    BLOCK_SIZE * 0.9,
    BLOCK_SIZE * 0.9,
    BLOCK_SIZE * 0.5
  ), []);

  // Material cache for placed pieces (keyed by color)
  const materialCache = useRef<Map<number, THREE.MeshStandardMaterial>>(new Map());

  // Get or create a material for a specific color
  const getMaterialForColor = (color: number, isCurrentPiece: boolean = false): THREE.MeshStandardMaterial => {
    const cache = materialCache.current;
    if (!cache.has(color)) {
      cache.set(color, new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.6,
        emissive: color,
        emissiveIntensity: isCurrentPiece ? 0.4 : 0.1,
      }));
    }
    return cache.get(color)!;
  };

  // Create board mesh (static elements)
  const boardMesh = useMemo(() => {
    const group = new THREE.Group();

    // Back panel
    const backGeometry = new THREE.BoxGeometry(
      BOARD_WIDTH * BLOCK_SIZE,
      BOARD_HEIGHT * BLOCK_SIZE,
      BLOCK_SIZE * 0.2
    );
    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.8,
      metalness: 0.2,
    });
    const backPanel = new THREE.Mesh(backGeometry, backMaterial);
    backPanel.position.set(
      (BOARD_WIDTH * BLOCK_SIZE) / 2 - BLOCK_SIZE / 2,
      (BOARD_HEIGHT * BLOCK_SIZE) / 2 - BLOCK_SIZE / 2,
      -BLOCK_SIZE * 0.1
    );
    group.add(backPanel);

    // Grid lines
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x4466aa,
      opacity: 0.5,
      transparent: true,
    });

    // Vertical lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      const points = [
        new THREE.Vector3(x * BLOCK_SIZE, 0, 0),
        new THREE.Vector3(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      group.add(line);
    }

    // Horizontal lines
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      const points = [
        new THREE.Vector3(0, y * BLOCK_SIZE, 0),
        new THREE.Vector3(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE, 0),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      group.add(line);
    }

    // Border material
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: 0x6688cc,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x334488,
      emissiveIntensity: 0.3,
    });

    // Left border
    const leftBorder = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.15, BOARD_HEIGHT * BLOCK_SIZE, BLOCK_SIZE * 0.5),
      borderMaterial
    );
    leftBorder.position.set(-BLOCK_SIZE * 0.075, (BOARD_HEIGHT * BLOCK_SIZE) / 2 - BLOCK_SIZE / 2, 0);
    group.add(leftBorder);

    // Right border
    const rightBorder = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK_SIZE * 0.15, BOARD_HEIGHT * BLOCK_SIZE, BLOCK_SIZE * 0.5),
      borderMaterial
    );
    rightBorder.position.set(BOARD_WIDTH * BLOCK_SIZE + BLOCK_SIZE * 0.075, (BOARD_HEIGHT * BLOCK_SIZE) / 2 - BLOCK_SIZE / 2, 0);
    group.add(rightBorder);

    // Bottom border
    const bottomBorder = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH * BLOCK_SIZE + BLOCK_SIZE * 0.3, BLOCK_SIZE * 0.15, BLOCK_SIZE * 0.5),
      borderMaterial
    );
    bottomBorder.position.set((BOARD_WIDTH * BLOCK_SIZE) / 2 - BLOCK_SIZE / 2, -BLOCK_SIZE * 0.075, 0);
    group.add(bottomBorder);

    return group;
  }, []);

  // Shared geometry for current piece cubes
  const pieceGeometry = useMemo(() => new THREE.BoxGeometry(
    BLOCK_SIZE * 0.9,
    BLOCK_SIZE * 0.9,
    BLOCK_SIZE * 0.5
  ), []);

  // Start squash animation when landing impact occurs
  useEffect(() => {
    if (landingImpact && landingImpact.cells.length > 0) {
      const cellSet = new Set<string>();
      landingImpact.cells.forEach(([x, y]) => {
        cellSet.add(`${x},${y}`);
      });
      squashAnimRef.current = {
        cells: cellSet,
        startTime: Date.now(),
        intensity: landingImpact.intensity,
      };
    }
  }, [landingImpact]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose board mesh and all its children
      boardMesh.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        } else if (object instanceof THREE.Line) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });

      // Dispose placed pieces meshes
      placedPiecesRef.current.forEach((data) => {
        data.mesh.geometry.dispose();
        if (Array.isArray(data.mesh.material)) {
          data.mesh.material.forEach(mat => mat.dispose());
        } else {
          data.mesh.material.dispose();
        }
        data.mesh.dispose();
      });
      placedPiecesRef.current.clear();

      // Dispose material cache
      materialCache.current.forEach((mat) => {
        mat.dispose();
      });
      materialCache.current.clear();

      // Dispose current piece material
      if (currentPieceMaterialRef.current) {
        currentPieceMaterialRef.current.dispose();
      }

      // Dispose ghost material
      if (ghostMaterialRef.current) {
        ghostMaterialRef.current.dispose();
      }

      // Dispose shared geometries
      blockGeometry.dispose();
      pieceGeometry.dispose();
    };
  }, [boardMesh, blockGeometry, pieceGeometry]);

  // Update placed pieces mesh - optimized to reuse InstancedMesh
  const updatePlacedPieces = () => {
    const occupiedCells = board.getOccupiedCells();

    // Group by color
    const cellsByColor = new Map<number, Array<[number, number, number]>>();
    occupiedCells.forEach(([x, y, color]) => {
      if (!cellsByColor.has(color)) {
        cellsByColor.set(color, []);
      }
      cellsByColor.get(color)!.push([x, y, color]);
    });

    const placedPieces = placedPiecesRef.current;
    const cellToIndex = cellToIndexRef.current;
    const group = placedMeshRef.current!;

    // Remove old meshes that are no longer needed
    const currentColors = new Set(cellsByColor.keys());
    for (const [color, data] of placedPieces.entries()) {
      if (!currentColors.has(color)) {
        group.remove(data.mesh);
        placedPieces.delete(color);
      }
    }

    // Update or create meshes for each color
    cellsByColor.forEach((cells, color) => {
      const cellCount = cells.length;

      if (!placedPieces.has(color)) {
        // Create new InstancedMesh for this color
        const material = getMaterialForColor(color);
        const mesh = new THREE.InstancedMesh(blockGeometry, material, MAX_BLOCKS);
        mesh.count = cellCount;
        group.add(mesh);

        // Initialize all matrices to identity (hide unused instances)
        for (let i = 0; i < MAX_BLOCKS; i++) {
          tempMatrix.makeScale(0, 0, 0); // Hide by scaling to zero
          mesh.setMatrixAt(i, tempMatrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        placedPieces.set(color, {
          mesh,
          count: cellCount,
          matrices: new Float32Array(MAX_BLOCKS * 16),
        });
      } else {
        const data = placedPieces.get(color)!;
        data.mesh.count = cellCount;
      }

      // Update cell-to-index mapping
      const data = placedPieces.get(color)!;
      cells.forEach(([x, y], index) => {
        const cellKey = `${x},${y}`;
        cellToIndex.set(cellKey, index);

        // Calculate base matrix (without squash)
        const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
        tempPosition.set(
          x * BLOCK_SIZE + BLOCK_SIZE / 2,
          flippedY,
          BLOCK_SIZE * 0.25
        );
        tempScale.set(1, 1, 1);
        tempQuaternion.identity();
        tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
        data.mesh.setMatrixAt(index, tempMatrix);
      });

      // Hide unused instances
      for (let i = cellCount; i < MAX_BLOCKS; i++) {
        tempMatrix.makeScale(0, 0, 0);
        data.mesh.setMatrixAt(i, tempMatrix);
      }

      data.mesh.instanceMatrix.needsUpdate = true;
    });

    // Clean up cell-to-index mapping for cells that no longer exist
    const allCurrentCells = new Set<string>();
    occupiedCells.forEach(([x, y]) => {
      allCurrentCells.add(`${x},${y}`);
    });
    for (const cellKey of cellToIndex.keys()) {
      if (!allCurrentCells.has(cellKey)) {
        cellToIndex.delete(cellKey);
      }
    }
  };

  // Update only the matrices for cells in squash animation
  const updateSquashAnimation = () => {
    const squashAnim = squashAnimRef.current;
    if (!squashAnim) return;

    const elapsed = Date.now() - squashAnim.startTime;
    const progress = Math.min(elapsed / SQUASH_DURATION, 1);

    if (progress >= 1) {
      squashAnimRef.current = null;
      // Reset all matrices to base state
      updatePlacedPieces();
      return;
    }

    const squashOffset = Easing.easeOutSquash(progress) * squashAnim.intensity;
    const occupiedCells = board.getOccupiedCells();

    // Update only cells that are in the squash animation
    occupiedCells.forEach(([x, y, color]) => {
      const cellKey = `${x},${y}`;
      if (!squashAnim.cells.has(cellKey)) return;

      const placedPieces = placedPiecesRef.current;
      if (!placedPieces.has(color)) return;

      const data = placedPieces.get(color)!;
      const cellToIndex = cellToIndexRef.current;
      const index = cellToIndex.get(cellKey);
      if (index === undefined) return;

      // Apply squash transformation
      const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
      tempPosition.set(
        x * BLOCK_SIZE + BLOCK_SIZE / 2,
        flippedY,
        BLOCK_SIZE * 0.25
      );

      // Apply squash and stretch
      const scaleY = 1 + squashOffset; // squashOffset is negative during compression
      const scaleX = 1 - squashOffset * 0.5; // Expand X
      const scaleZ = 1 - squashOffset * 0.5; // Expand Z
      tempScale.set(scaleX, scaleY, scaleZ);

      tempQuaternion.identity();
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      data.mesh.setMatrixAt(index, tempMatrix);
      data.mesh.instanceMatrix.needsUpdate = true;
    });
  };

  // Update bomb indicators on placed pieces + countdown bombs
  const updatePlacedBombs = () => {
    if (!meshRef.current) return;

    let bombGroup = meshRef.current.children.find(
      c => c.userData?.isPlacedBombIndicator
    ) as THREE.Group | undefined;

    // 棋盘上还存在的炸弹
    const boardBombs = board.getOccupiedCellsWithData().filter(
      ([, , cell]) => cell.bomb
    ).map(([x, y]) => [x, y] as [number, number]);

    // 倒计时中的炸弹（已被消行移除，但需要保持可见）
    const countdownBombs: Array<[number, number]> = bombCountdown
      ? bombCountdown.positions
      : [];

    const allBombPositions: Array<[number, number]> = [...boardBombs];

    // 添加倒计时炸弹（去重）
    const existingSet = new Set(boardBombs.map(([x, y]) => `${x},${y}`));
    for (const pos of countdownBombs) {
      if (!existingSet.has(`${pos[0]},${pos[1]}`)) {
        allBombPositions.push(pos);
      }
    }

    if (allBombPositions.length === 0) {
      if (bombGroup) {
        meshRef.current.remove(bombGroup);
      }
      return;
    }

    if (!bombGroup) {
      bombGroup = new THREE.Group();
      bombGroup.userData.isPlacedBombIndicator = true;
      meshRef.current.add(bombGroup);
    }

    // 倒计时闪烁：接近爆炸时加速闪烁
    const isCountdown = bombCountdown !== null;
    const flashIntensity = isCountdown
      ? Math.max(0.3, Math.sin(Date.now() * 0.015) * 0.5 + 0.5)
      : 0;

    const bombMaterial = new THREE.MeshStandardMaterial({
      color: isCountdown ? 0xff0000 : 0xff6600,
      emissive: isCountdown ? 0xff0000 : 0xff3300,
      emissiveIntensity: isCountdown ? flashIntensity : 0.4,
      roughness: 0.3,
      metalness: 0.7,
    });
    const fuseMaterial = new THREE.MeshStandardMaterial({
      color: isCountdown ? 0xff0000 : 0x654321,
      emissive: isCountdown ? 0xff3300 : 0x000000,
      emissiveIntensity: isCountdown ? flashIntensity * 0.5 : 0,
      roughness: 0.8,
    });

    // Rebuild bomb indicators
    while (bombGroup.children.length > 0) {
      bombGroup.remove(bombGroup.children[0]);
    }

    allBombPositions.forEach(([x, y]) => {
      const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;

      const sphere = new THREE.Mesh(BOMB_GEOMETRY, bombMaterial);
      sphere.position.set(
        x * BLOCK_SIZE + BLOCK_SIZE / 2,
        flippedY,
        BLOCK_SIZE * 0.5,
      );
      const scale = isCountdown ? 0.8 + flashIntensity * 0.4 : 1;
      sphere.scale.setScalar(scale);
      bombGroup!.add(sphere);

      const fuse = new THREE.Mesh(BOMB_FUSE_GEOMETRY, fuseMaterial);
      fuse.position.set(
        x * BLOCK_SIZE + BLOCK_SIZE / 2,
        flippedY + 0.15,
        BLOCK_SIZE * 0.5,
      );
      fuse.scale.setScalar(isCountdown ? 0.6 + flashIntensity * 0.4 : 1);
      bombGroup!.add(fuse);
    });
  };

  // Animation frame - update scene every frame
  useFrame(() => {
    if (!meshRef.current || !placedMeshRef.current) return;

    // 1. Update placed pieces when game state changes
    if (version !== lastVersionRef.current) {
      lastVersionRef.current = version;
      updatePlacedPieces();
      updatePlacedBombs();
    }

    // 2. Update squash animation (every frame)
    updateSquashAnimation();

    // 2.5 Update bomb countdown animation (every frame when active)
    if (bombCountdown) {
      updatePlacedBombs();
    }

    // 3. Update current piece positions
    // Find existing current piece group (tagged with userData)
    let pieceGroup = meshRef.current.children.find(
      c => c.userData?.isCurrentPiece
    ) as THREE.Group | undefined;

    if (currentPiece) {
      const cells = currentPiece.getCells();
      const color = currentPiece.getColor();

      if (!pieceGroup) {
        pieceGroup = new THREE.Group();
        pieceGroup.userData.isCurrentPiece = true;
        meshRef.current.add(pieceGroup);
      }

      // Get or create material for current piece
      let material = currentPieceMaterialRef.current;
      if (!material) {
        material = getMaterialForColor(color, true);
        currentPieceMaterialRef.current = material;
      } else {
        // Update color if piece type changed
        material.color.setHex(color);
        material.emissive.setHex(color);
      }

      // Ensure correct number of cubes
      while (pieceGroup.children.length > cells.length) {
        pieceGroup.remove(pieceGroup.children[pieceGroup.children.length - 1]);
      }
      while (pieceGroup.children.length < cells.length) {
        pieceGroup.add(new THREE.Mesh(pieceGeometry, material));
      }

      // Update positions and material
      cells.forEach(([x, y], i) => {
        const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
        const mesh = pieceGroup!.children[i] as THREE.Mesh;
        mesh.position.set(
          x * BLOCK_SIZE + BLOCK_SIZE / 2,
          flippedY,
          BLOCK_SIZE * 0.25
        );
        // Ensure all cubes use the shared material
        mesh.material = material;
      });

      // 5. Bomb indicators on current piece
      let bombGroup = meshRef.current.children.find(
        c => c.userData?.isBombIndicator
      ) as THREE.Group | undefined;

      if (currentPiece.getBombCount() > 0) {
        if (!bombGroup) {
          bombGroup = new THREE.Group();
          bombGroup.userData.isBombIndicator = true;
          meshRef.current.add(bombGroup);
        }

        const bombIndices = currentPiece.getBombCellIndices();
        const bombMaterial = new THREE.MeshStandardMaterial({
          color: 0xff4400,
          emissive: 0xff2200,
          emissiveIntensity: 0.6,
          roughness: 0.3,
          metalness: 0.7,
        });
        const fuseMaterial = new THREE.MeshStandardMaterial({
          color: 0x654321,
          roughness: 0.8,
        });

        // Remove excess bomb meshes
        while (bombGroup.children.length > bombIndices.length * 2) {
          bombGroup.remove(bombGroup.children[bombGroup.children.length - 1]);
        }

        bombIndices.forEach((cellIdx, i) => {
          const [x, y] = cells[cellIdx];
          const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
          const basePos: [number, number, number] = [
            x * BLOCK_SIZE + BLOCK_SIZE / 2,
            flippedY,
            BLOCK_SIZE * 0.5,
          ];

          // Bomb sphere
          let sphere: THREE.Mesh;
          let fuse: THREE.Mesh;
          if (i * 2 < bombGroup!.children.length) {
            sphere = bombGroup!.children[i * 2] as THREE.Mesh;
            fuse = bombGroup!.children[i * 2 + 1] as THREE.Mesh;
          } else {
            sphere = new THREE.Mesh(BOMB_GEOMETRY, bombMaterial);
            fuse = new THREE.Mesh(BOMB_FUSE_GEOMETRY, fuseMaterial);
            bombGroup!.add(sphere);
            bombGroup!.add(fuse);
          }

          sphere.position.set(...basePos);
          sphere.material = bombMaterial;

          // Pulsing animation
          const pulse = 0.9 + Math.sin(Date.now() * 0.005 + i) * 0.1;
          sphere.scale.setScalar(pulse);

          fuse.position.set(basePos[0], basePos[1] + 0.15, basePos[2]);
          fuse.material = fuseMaterial;
        });

        // Remove extra children if bomb count decreased
        while (bombGroup.children.length > bombIndices.length * 2) {
          bombGroup.remove(bombGroup.children[bombGroup.children.length - 1]);
        }
      } else if (bombGroup) {
        meshRef.current.remove(bombGroup);
      }
    } else if (pieceGroup) {
      // No current piece, remove group
      meshRef.current.remove(pieceGroup);
      currentPieceMaterialRef.current = null;
    }

    // 4. Update Ghost Piece - compute ghost cells directly in useFrame
    // (ensures real-time updates even when React doesn't re-render)
    let ghostGroup = meshRef.current.children.find(
      c => c.userData?.isGhostPiece
    ) as THREE.Group | undefined;

    if (currentPiece) {
      const cells = currentPiece.getCells();
      const color = currentPiece.getColor();

      // Compute ghost drop position: move cells down until invalid
      let ghostOffset = 0;
      while (true) {
        ghostOffset++;
        const testCells = cells.map(([cx, cy]) => [cx, cy + ghostOffset]);
        if (!board.isValidPosition(testCells)) {
          ghostOffset--;
          break;
        }
      }


      const ghostCells = ghostOffset > 0
        ? cells.map(([cx, cy]) => [cx, cy + ghostOffset])
        : [];

      if (ghostCells.length > 0) {
        if (!ghostGroup) {
          ghostGroup = new THREE.Group();
          ghostGroup.userData.isGhostPiece = true;
          meshRef.current.add(ghostGroup);
        }

        // Get or create material for ghost piece
        let ghostMaterial = ghostMaterialRef.current;
        if (!ghostMaterial) {
          ghostMaterial = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.35,
            roughness: 0.2,
            metalness: 0.3,
            emissive: color,
            emissiveIntensity: 0.15,
            wireframe: true,
          });
          ghostMaterialRef.current = ghostMaterial;
        } else {
          ghostMaterial.color.setHex(color);
          ghostMaterial.emissive.setHex(color);
        }

        // Ensure correct number of cubes
        while (ghostGroup.children.length > ghostCells.length) {
          ghostGroup.remove(ghostGroup.children[ghostGroup.children.length - 1]);
        }
        while (ghostGroup.children.length < ghostCells.length) {
          ghostGroup.add(new THREE.Mesh(pieceGeometry, ghostMaterial));
        }

        // Update positions
        ghostCells.forEach(([x, y], i) => {
          const flippedY = (BOARD_HEIGHT - 1 - y) * BLOCK_SIZE + BLOCK_SIZE / 2;
          const mesh = ghostGroup!.children[i] as THREE.Mesh;
          mesh.position.set(
            x * BLOCK_SIZE + BLOCK_SIZE / 2,
            flippedY,
            BLOCK_SIZE * 0.2
          );
          mesh.material = ghostMaterial;
        });
      } else if (ghostGroup) {
        meshRef.current.remove(ghostGroup);
        ghostMaterialRef.current = null;
      }
    } else if (ghostGroup) {
      meshRef.current.remove(ghostGroup);
      ghostMaterialRef.current = null;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Game board (static) */}
      <primitive object={boardMesh} />

      {/* Placed pieces - managed by useFrame */}
      <group ref={placedMeshRef} />
    </group>
  );
}
