import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// En web, un ScrollView horizontal de react-native-web no responde a la
// rueda normal del mouse (solo a shift+rueda o gestos de trackpad) ni se
// puede arrastrar con el mouse como si fuera táctil — en celular el touch
// ya funciona solo. Este hook agrega ambas cosas a mano: rueda vertical
// mueve el scroll horizontal (como cualquier carrusel web), y click+arrastre
// también. No hace nada en nativo (el touch ya anda).
export function useHorizontalDragScroll() {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node: HTMLElement | null = ref.current;
    if (!node || typeof node.addEventListener !== "function") return;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      node!.scrollLeft += e.deltaY;
      e.preventDefault();
    }

    let arrastrando = false;
    let inicioX = 0;
    let scrollInicial = 0;

    function onMouseDown(e: MouseEvent) {
      arrastrando = true;
      inicioX = e.pageX;
      scrollInicial = node!.scrollLeft;
    }
    function onMouseMove(e: MouseEvent) {
      if (!arrastrando) return;
      node!.scrollLeft = scrollInicial - (e.pageX - inicioX);
    }
    function terminarArrastre() {
      arrastrando = false;
    }

    node.style.cursor = "grab";
    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", terminarArrastre);

    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", terminarArrastre);
    };
  }, []);

  return ref;
}
