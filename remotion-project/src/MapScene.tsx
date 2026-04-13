import * as turf from "@turf/turf";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import {
  PHASE1_END,
  PHASE1_START,
  PHASE2_END,
  PHASE2_START,
  PHASE3_END,
  PHASE3_START,
} from "./constants";

// ── Coordinates [lng, lat] ────────────────────────────────────
const LA: [number, number] = [-118.2437, 34.0522];
const NY: [number, number] = [-74.006, 40.7128];
const PARIS: [number, number] = [2.3522, 48.8566];

// ── Pre-compute geodesic distances (km) ──────────────────────
const FULL_ROUTE = turf.lineString([LA, NY, PARIS]);
const LA_TO_NY_KM = turf.length(turf.lineString([LA, NY]));
const NY_TO_PARIS_KM = turf.length(turf.lineString([NY, PARIS]));

// ── Hide every visual layer from the Mapbox Standard style ───
const HIDE_FEATURES = [
  "showRoadsAndTransit",
  "showRoads",
  "showTransit",
  "showPedestrianRoads",
  "showRoadLabels",
  "showTransitLabels",
  "showPlaceLabels",
  "showPointOfInterestLabels",
  "showPointsOfInterest",
  "showAdminBoundaries",
  "showLandmarkIcons",
  "showLandmarkIconLabels",
  "show3dObjects",
  "show3dBuildings",
  "show3dTrees",
  "show3dLandmarks",
  "show3dFacades",
];

mapboxgl.accessToken = process.env.REMOTION_MAPBOX_TOKEN as string;

export const MapScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const { delayRender, continueRender } = useDelayRender();

  // Hold rendering until the map has fully loaded
  const [loadHandle] = useState(() => delayRender("Loading Mapbox map…"));

  // ── Initialise map (runs once) ───────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const _map = new mapboxgl.Map({
      container: containerRef.current,
      zoom: 12,
      center: LA,
      pitch: 0,
      bearing: 0,
      style: "mapbox://styles/mapbox/standard",
      interactive: false,
      fadeDuration: 0,
    });

    _map.on("style.load", () => {
      // Strip every visual layer
      for (const feat of HIDE_FEATURES) {
        _map.setConfigProperty("basemap", feat, false);
      }
      _map.setConfigProperty("basemap", "colorMotorways", "transparent");
      _map.setConfigProperty("basemap", "colorRoads", "transparent");
      _map.setConfigProperty("basemap", "colorTrunks", "transparent");

      // ── Route line (starts as a near-zero-length stub at LA) ──
      _map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [LA, [LA[0] + 0.0001, LA[1]]],
          },
        },
      });
      _map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": "#FF3B30", "line-width": 6 },
        layout: { "line-cap": "round", "line-join": "round" },
      });

      // ── City markers ──────────────────────────────────────────
      _map.addSource("cities", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Los Angeles" },
              geometry: { type: "Point", coordinates: LA },
            },
            {
              type: "Feature",
              properties: { name: "New York" },
              geometry: { type: "Point", coordinates: NY },
            },
            {
              type: "Feature",
              properties: { name: "Paris" },
              geometry: { type: "Point", coordinates: PARIS },
            },
          ],
        },
      });
      _map.addLayer({
        id: "city-dots",
        type: "circle",
        source: "cities",
        paint: {
          "circle-radius": 16,
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 4,
          "circle-stroke-color": "#FF3B30",
        },
      });
      _map.addLayer({
        id: "city-labels",
        type: "symbol",
        source: "cities",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 44,
          "text-offset": [0, 0.6],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#FFFFFF",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });
    });

    _map.on("load", () => {
      continueRender(loadHandle);
      setMap(_map);
    });
    // Do NOT call _map.remove() – Remotion re-renders each frame
  }, []);

  // ── Per-frame animation ───────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    const animHandle = delayRender("Animating map frame…");

    const routeSource = map.getSource("route") as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (frame <= PHASE1_END) {
      // ── Phase 1: zoom out of LA ────────────────────────────────
      const zoom = interpolate(frame, [PHASE1_START, PHASE1_END], [12, 3.5], {
        easing: Easing.inOut(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      map.jumpTo({ center: LA, zoom });

      // Keep the line as a stub (nothing drawn yet)
      routeSource?.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [LA, [LA[0] + 0.0001, LA[1]]],
        },
      });
    } else if (frame <= PHASE2_END) {
      // ── Phase 2: draw line LA → NY, camera follows tip ─────────
      const progress = interpolate(
        frame,
        [PHASE2_START, PHASE2_END],
        [0, 1],
        {
          easing: Easing.inOut(Easing.sin),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );

      const km = Math.max(0.001, LA_TO_NY_KM * progress);
      const sliced = turf.lineSliceAlong(FULL_ROUTE, 0, km);
      routeSource?.setData(sliced);

      const coords = sliced.geometry.coordinates;
      const tip = coords[coords.length - 1] as [number, number];

      const zoom = interpolate(
        frame,
        [PHASE2_START, PHASE2_END],
        [3.5, 3.5],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      );

      map.jumpTo({ center: tip, zoom });
    } else {
      // ── Phase 3: continue line NY → Paris, camera follows tip ──
      const progress = interpolate(
        frame,
        [PHASE3_START, PHASE3_END],
        [0, 1],
        {
          easing: Easing.inOut(Easing.sin),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );

      const km =
        LA_TO_NY_KM + Math.max(0.001, NY_TO_PARIS_KM * progress);
      const sliced = turf.lineSliceAlong(FULL_ROUTE, 0, km);
      routeSource?.setData(sliced);

      const coords = sliced.geometry.coordinates;
      const tip = coords[coords.length - 1] as [number, number];

      // Gently zoom out a little as we cross the Atlantic
      const zoom = interpolate(
        frame,
        [PHASE3_START, PHASE3_END],
        [3.5, 3.0],
        {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );

      map.jumpTo({ center: tip, zoom });
    }

    map.once("idle", () => continueRender(animHandle));
  }, [frame, map]);

  const containerStyle = useMemo<React.CSSProperties>(
    () => ({ width, height, position: "absolute" }),
    [width, height],
  );

  return <AbsoluteFill ref={containerRef} style={containerStyle} />;
};
