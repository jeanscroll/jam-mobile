import React, {
	useEffect,
	useRef,
	useState,
	useCallback,
	useMemo,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MarkerData {
	id?: string;
	latitude: number;
	longitude: number;
	state?: string;
	title?: string;
	location?: string;
	logo_file?: string;
	company_name?: string;
	website?: string;
	contract_type?: string;
	start_date?: string;
	working_time?: number;
	created_at?: string;
	salary?: number;
	work_mode?: string;
	annonce?: boolean;
	sector_activity?: string;
	is_last_minute?: boolean;
	is_applied?: boolean;
	is_liked?: boolean;
	postal_code?: string;
   employer_name?: string; 
   employer_email?: string;
}

interface MapboxProps {
	mapStyle?: string;
	latitude?: number;
	longitude?: number;
	zoom?: number;
	markers?: MarkerData[];
	className?: string;
	// onPopupClick?: () => void;
	onPopupClick?: (markerData: MarkerData) => void;
	showLogoInPopup?: boolean;
}

const Mapbox: React.FC<MapboxProps> = ({
	mapStyle = "mapbox://styles/mapbox/streets-v11",
	latitude = 48.8566,
	longitude = 2.3522,
	zoom = 15,
	markers = [],
	className = "",
	onPopupClick,
	showLogoInPopup = true,
}) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
	const [mapLoaded, setMapLoaded] = useState(false);

	const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

	const calculateMarkerSize = useCallback((zoomLevel: number) => {
		const minZoom = 5,
			maxZoom = 15;
		const minSize = 20,
			maxSize = 40;
		const clamped = Math.min(Math.max(zoomLevel, minZoom), maxZoom);
		return (
			minSize +
			((clamped - minZoom) / (maxZoom - minZoom)) * (maxSize - minSize)
		);
	}, []);

	const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

	// === 1. Initialisation de la carte ===
	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current || !accessToken) return;

		mapboxgl.accessToken = accessToken;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: mapStyle,
			center: [longitude, latitude],
			zoom,
			projection: { name: "mercator" },
		});

		map.addControl(new mapboxgl.NavigationControl(), "top-right");

		map.on("load", () => {
			setMapLoaded(true);
			map.on("zoom", () => {
				const newSize = calculateMarkerSize(map.getZoom());
				document
					.querySelectorAll<HTMLElement>(".custom-marker")
					.forEach((el) => {
						el.style.width = `${newSize}px`;
						el.style.height = `${newSize}px`;
					});
			});
		});

		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, [accessToken, mapStyle, calculateMarkerSize]);

	// === 2. Recentrage si lat/lng changent ===
	useEffect(() => {
		if (mapRef.current && mapLoaded) {
			mapRef.current.flyTo({ center: [longitude, latitude], essential: true });
		}
	}, [latitude, longitude, mapLoaded]);

	// === 3. Affichage des marqueurs ===
	useEffect(() => {
		if (!mapRef.current || !mapLoaded) return;

		// Supprimer les marqueurs précédents
		Object.values(markersRef.current).forEach((m) => m.remove());
		markersRef.current = {};

		// Ajouter les nouveaux marqueurs uniquement si markers est non vide
		if (markers.length === 0) return;

		markers.forEach((data) => {
			const {
				id,
				latitude,
				longitude,
				title,
				logo_file,
				location,
				company_name,
				contract_type,
				working_time,
				salary,
				work_mode,
				created_at,
				sector_activity,
				is_applied,
				is_last_minute,
				is_liked,
				postal_code,
            employer_name,
            employer_email
			} = data;

			const createdDate = created_at?.slice(0, 10);
			const markerState = is_last_minute
				? "last_minute"
				: createdDate === today
				? "new"
				: is_applied
				? "applied"
				: is_liked
				? "liked"
				: "base";
			const size = calculateMarkerSize(
				mapRef.current ? mapRef.current.getZoom() : zoom
			);
			const wrapper = document.createElement("div");

			// Wrapper pour le marqueur & badge salaire
			wrapper.className = "marker-wrapper";

			// Marqueur
			const el = document.createElement("div");
			el.className = `custom-marker ${markerState}`;
			Object.assign(el.style, {
				width: `${size}px`,
				height: `${size}px`,
				backgroundSize: "cover",
			});
			wrapper.appendChild(el);

			if (
				salary &&
				["base", "last_minute", "new", "liked"].includes(markerState)
			) {
				// Nettoyer le salaire pour l'affichage
				const cleanSalary = String(salary)
					.replace(/€\s*\/\s*mois/i, "")
					.trim();

				// Badge salaire
				const salaryBadge = document.createElement("div");
				salaryBadge.className = "salary-badge";
				salaryBadge.textContent = `${cleanSalary}€`;

				Object.assign(salaryBadge.style, {
					fontSize: `${size * 0.35}px`,
					padding: `${size * 0.08}px ${size * 0.25}px ${size * 0.08}px ${
						size * 0.5
					}px`,
					minHeight: `${size * 0.5}px`,
					borderRadius: `${size * 0.3}px`,
				});

				wrapper.appendChild(salaryBadge);
			}

			const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
         ${
						markerState === "applied"
							? `
            <div class="applied-job">
               <img src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//Vector.svg"/>
               <span class="state-job-title">POSTULÉ</span>
            </div>
         `
							: ""
					}
         ${markerState === "new" ? '<div class="new-job">NOUVEAU</div>' : ""}
         ${
						is_last_minute
							? `
            <div class="state-job">
               <img src="//idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/ph_clock-countdown-fill.svg" alt="Countdown Icon" />
               <span class="state-job-title">LAST MINUTE</span>
            </div>
         `
							: ""
					}
         ${
						showLogoInPopup && logo_file
							? `<img class="company_logo" src="${logo_file}" alt="${title}" />`
							: ""
					}
         <h3>${title || "Titre non défini"}</h3>
         <div class="location">
            <img src="//idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/ph_map-pin.svg" class="w-4 h-4" />
            <p>${location || "Non définie"}${
				postal_code ? ` (${postal_code.slice(0, 2)})` : ""
			}${company_name ? `, ${company_name}` : ""}</p>
         </div>
         <div class="popup-info">
            <div><img src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//ph_briefcase.svg"> ${
							sector_activity || "N/A"
						}</div>
            <div><img src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//ph_file-text.svg"> ${
							contract_type || "N/A"
						}</div>
            <div><img src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//ph_clock.svg"> ${
							working_time || "N/A"
						}</div>
            <div><img src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//ph_coins-light.svg"> ${
							salary || "N/A"
						}</div>
            <div><img src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//ph_office-chair.svg"> ${
							work_mode || "N/A"
						}</div>
         </div>
         `);

			popup.on("open", () => {
				const content = popup.getElement();
				if (content) {
					content.classList.add(`${markerState.replace("_", "-")}-border`);

					// Éviter d'ajouter plusieurs fois le même listener au clic
					const handleClick = () => {
						/*if (id) {
							const url = new URL(window.location.href);
							url.searchParams.set("job_id", id);
							window.history.pushState({}, "", url.toString());
						}*/
						if (onPopupClick) {
							onPopupClick(data); // data = l'objet du pin/job sélectionné
						}
					};

					// Pour éviter la duplication d'écouteurs, on peut retirer avant d'ajouter
					content.removeEventListener("click", handleClick);
					content.addEventListener("click", handleClick);
				}
			});

			const marker = new mapboxgl.Marker({ element: wrapper })
				.setLngLat([longitude, latitude])
				.setPopup(popup)
				.addTo(mapRef.current!);

			markersRef.current[title || `${latitude}-${longitude}`] = marker;
		});
	}, [markers, mapLoaded, calculateMarkerSize, today]);

	return (
		<>
			<style>
				{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap');

            * {
               font-family: 'DM Sans', sans-serif;
            }



            .custom-marker {
               border: none;
               cursor: pointer;
               position: relative;
               z-index: 1000;
            }



            .custom-marker.base {
               background-image: url('https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/Marker/State=PinNew,%20ShowSalary=False.svg');
            }
            
            .custom-marker.liked {
               background-image: url('https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/Marker/State=PinLiked,%20ShowSalary=False.svg');
            }
            
            .custom-marker.new {
               background-image: url('https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/Marker/State=PinNew,%20ShowSalary=False.svg');
            }
            
            .custom-marker.last_minute {
               background-image: url('https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/Marker/State=PinLastMin,%20ShowSalary=False.svg');
            }

            .custom-marker.applied {
               background-image: url('https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img/Marker/State=PinApplied,%20ShowSalary=False.svg');
            }


            .salary-badge {
               position: absolute;
               top: 0px;
               left: 10px;
               z-index: 0;
               color: white;
               font-size: 11px;
               font-weight: bold;
               padding: 2px 10px 2px 25px !important;
               border-radius: 12px;
               box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
               white-space: nowrap;
               display: flex;
               align-items: center;
               gap: 3px;
               min-height: 20px;
               z-index: 0;
            }


            .marker-wrapper .custom-marker.base + .salary-badge,
            .marker-wrapper .custom-marker.new + .salary-badge,
            .marker-wrapper .custom-marker.last_minute + .salary-badge,
            .marker-wrapper .custom-marker.liked + .salary-badge,
            .marker-wrapper .custom-marker.applied + .salary-badge {
               font-family: 'DM Sans';
               font-style: normal;
               font-weight: 400;
               font-size: 17.201px;
               line-height: 22px;
               letter-spacing: 0.02em;
            }

            .marker-wrapper .custom-marker.base + .salary-badge,
            .marker-wrapper .custom-marker.new + .salary-badge {
               background: #BAFE68; /* Vert lime */
               color: #000; /* Texte noir pour meilleur contraste */
            }

            .marker-wrapper .custom-marker.last_minute + .salary-badge {
               background: linear-gradient(180deg, #F6165B 0%, #F36320 63.5%); /* Gradient rouge-orange */
            }

            .marker-wrapper .custom-marker.liked + .salary-badge {
               background: #FF4D84; /* Rose pour aimé */
            }

            .marker-wrapper .custom-marker.applied + .salary-badge {
               background: #002400; /* Vert très foncé pour postulé */
            }

            /* Adaptation responsive selon la taille du marqueur */
            .custom-marker .salary-badge {
               font-size: calc(10px + 0.1vw);
               padding: 2px 6px;
            }



            .mapboxgl-popup-content {
               width: 350px;
               font-family: 'Arial', sans-serif;
               background: #fff;
               border-radius: 16px;
               box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
               padding: 30px 16px;
               display: flex;
               flex-direction: column;
               gap: 8px;
               z-index: 9999;
               overflow: hidden;
               cursor: pointer;
            }

            .mapboxgl-popup-content.last-minute-border::before {
               content: '';
               position: absolute;
               inset: 0;
               border-radius: 16px;
               padding: 2px;
               background: linear-gradient(180deg, #F6165B 0%, #F36320 63.5%);
               -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
               -webkit-mask-composite: xor;
               mask-composite: exclude;
               z-index: -1;
            }

           .mapboxgl-popup-content.last-minute-border {
               position: relative;
               border-radius: 16px;
               background: #fff;
               z-index: 0;
            }

            .mapboxgl-popup-content.border-new {
               position: relative;
               border-radius: 16px;
               background: #fff;
               z-index: 0;
            }

            .mapboxgl-popup-content.border-new::before {
               content: '';
               position: absolute;
               inset: 0;
               border-radius: 16px;
               padding: 2px;
               background: #BAFE68;
               -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
               -webkit-mask-composite: xor;
               mask-composite: exclude;
               z-index: -1;
            }

            .mapboxgl-popup-content.applied-border {
               position: relative;
               border-radius: 16px;
               background: #fff;
               z-index: 0;
            }

            .mapboxgl-popup-content.applied-border::before {
               content: '';
               position: absolute;
               inset: 0;
               border-radius: 16px;
               padding: 2px;
               background: #002400;
               -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
               -webkit-mask-composite: xor;
               mask-composite: exclude;
               z-index: -1;
            }

            .mapboxgl-popup-content.liked-border {
               position: relative;
               border-radius: 16px;
               background: #fff;
               z-index: 0;
            }

            .mapboxgl-popup-content.liked-border::before {
               content: '';
               position: absolute;
               inset: 0;
               border-radius: 16px;
               padding: 2px;
               background: #FF4D84;
               -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
               -webkit-mask-composite: xor;
               mask-composite: exclude;
               z-index: -1;
            }

            .mapboxgl-popup-close-button {
               display: none; 
            }


            .location {
               display: flex;
               align-items: center;
               justify-content: flex-start;
               gap: 4px;
               color: #000000;
            }


            .state-job {
               position: absolute;
               top: 0;
               left: 0;
               display: flex;
               gap: 10px;
               flex-direction: row;
               justify-content: center;
               align-items: center; 
               background: linear-gradient(180deg, #F6165B 0%, #F36320 63.5%);
               border-radius: 16px 0px 8px;
               padding: 4px 12px 4px 8px;
               color: #ffffff;
            }

            .state-job-title {
               font-weight: normal;
               font-family: 'DM Sans';
               font-size: 14px
            }

            .mapboxgl-popup-content h3 {
               line-height: 1.2;
               font-size: 18px;
               font-weight: bold;
               color: #333;
               width: 70%;
            }
            
            .mapboxgl-popup-content p {
               font-size: 14px;
            }

            .mapboxgl-popup-content a {
               color:rgb(0, 0, 0);
               text-decoration: none;
               font-weight: bold;
            }
            
            .company_logo {
               width: 100px!important;
               border-radius: 8px;
            }
            
            .popup-info {
               display: flex;
               flex-wrap: wrap;
               gap: 6px;
               padding-left:2.5%;
               padding-right:2.5%;
            }


            .popup-info div {
               background: #F4F4F4;
               padding: 6px 10px;
               border-radius: 16px;
               font-size: 12px;
               font-weight: bold;
               color: #000;
               display: flex;
               align-items: center;
               gap: 4px;
            }
            
            .popup-info div img {
               width: 14px;
               height: 14px;
            }


            .new-job {
               position: absolute;
               top: 0;
               left: 0;
               display: flex;
               align-items: center; 
               background: #BAFE68;
               border-radius: 16px 0px 8px;
               padding: 4px 12px 4px 16px;
               color: #000000;
               margin-bottom: 10px;
            }

            .applied-job {
               position: absolute;
               top: 0;
               left: 0;
               display: flex;
               gap: 10px;
               flex-direction: row;
               align-items: center; 
               background: #002400;
               border-radius: 16px 0px 8px;
               padding: 4px 12px 4px 8px;
               color: #ffffff; 
               width: fit-content;
            }   

        `}
			</style>
			<div
				ref={mapContainerRef}
				className={`mapbox-map ${className}`}
				style={{
					width: "100%",
					height: "100%",
					borderRadius: "16px",
					position: "relative",
				}}
			/>
		</>
	);
};

export default Mapbox;
