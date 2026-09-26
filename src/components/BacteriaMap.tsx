import { useEffect, useRef } from "react";
import { mountBacteriaMap } from "../lib/bacteria-map";

/** Circle → squares → triangles. Fills its parent; drag any node. Draws in the current text colour. */
export function BacteriaMap() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => mountBacteriaMap(host.current!), []);
  return <div ref={host} className="absolute inset-0 text-fg-2" aria-label="Juicy nodes: draggable node map" role="img" />;
}
