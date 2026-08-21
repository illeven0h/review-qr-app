"use client";

import { useEffect, useRef } from "react";

interface GooglePlace {
  place_id?: string;
  name?: string;
}

interface GoogleAutocomplete {
  addListener: (
    event: "place_changed",
    callback: () => void
  ) => void;
  getPlace: () => GooglePlace;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: { fields: string[] }
          ) => GoogleAutocomplete;
        };
      };
    };
    initAutocomplete?: () => void;
  }
}

export default function AutocompleteInput({
  onPlaceSelected,
}: {
  onPlaceSelected: (placeId: string, name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const initAutocomplete = () => {
      if (!inputRef.current) return;

      // Make sure Google Maps Places is actually loaded
      if (
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places
      ) {
        console.error("Google Maps Places API is not loaded.");
        return;
      }

      const autocomplete =
        new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            fields: [
              "place_id",
              "name",
              "formatted_address",
            ],
          }
        );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (place.place_id) {
          onPlaceSelected(
            place.place_id,
            place.name ?? ""
          );
        }
      });
    };

    // Google Maps already loaded
    if (
      window.google &&
      window.google.maps &&
      window.google.maps.places
    ) {
      initAutocomplete();
      return;
    }

    // Otherwise load Google Maps
    const script = document.createElement("script");

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=` +
      `${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` +
      `&libraries=places`;

    script.async = true;
    script.defer = true;

    script.onload = initAutocomplete;

    script.onerror = () => {
      console.error(
        "Failed to load Google Maps JavaScript API."
      );
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the Google Maps script here.
      // Other components may still need it.
    };
  }, [onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Start typing the business name..."
      className="
        w-full
        rounded-xl2
        border
        border-sage
        px-4
        py-3
        bg-white/70
        focus:outline-none
        focus:ring-2
        focus:ring-lavender
        text-ink
        placeholder:text-ink/40
      "
    />
  );
}