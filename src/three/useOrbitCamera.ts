import { useRef } from "react";
import { PanResponder } from "react-native";

export interface OrbitState {
  azimuth: number; // ángulo horizontal, en radianes
  polar: number; // ángulo vertical, en radianes (clamp para no cruzar los polos)
  radius: number; // distancia de la cámara al centro
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanciaEntreToques(touches: { pageX: number; pageY: number }[]) {
  const [a, b] = touches;
  const dx = a.pageX - b.pageX;
  const dy = a.pageY - b.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Cámara orbitable 360°: un dedo (o el mouse en web) rota, dos dedos hacen zoom.
export function useOrbitCamera(initial: OrbitState) {
  const state = useRef<OrbitState>({ ...initial });
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const lastDistance = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          lastDistance.current = distanciaEntreToques(touches);
          lastTouch.current = null;
        } else if (touches.length === 1) {
          lastTouch.current = { x: touches[0].pageX, y: touches[0].pageY };
          lastDistance.current = null;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const distance = distanciaEntreToques(touches);
          if (lastDistance.current != null) {
            const delta = distance - lastDistance.current;
            state.current.radius = clamp(state.current.radius - delta * 0.02, 2.5, 12);
          }
          lastDistance.current = distance;
          lastTouch.current = null;
        } else if (touches.length === 1) {
          const t = touches[0];
          if (lastTouch.current) {
            const dx = t.pageX - lastTouch.current.x;
            const dy = t.pageY - lastTouch.current.y;
            state.current.azimuth -= dx * 0.005;
            state.current.polar = clamp(
              state.current.polar - dy * 0.005,
              0.15,
              Math.PI / 2 - 0.05
            );
          }
          lastTouch.current = { x: t.pageX, y: t.pageY };
          lastDistance.current = null;
        }
      },
      onPanResponderRelease: () => {
        lastTouch.current = null;
        lastDistance.current = null;
      },
    })
  ).current;

  return { orbitState: state, panHandlers: panResponder.panHandlers };
}
