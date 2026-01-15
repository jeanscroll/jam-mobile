import React, { useEffect, useMemo, useState, useRef } from "react";

export interface WeglotSelectorProps {
	// Langues disponibles (codes ISO: ex 'fr', 'en')
	languages?: string[];
	// Libellés à afficher pour chaque langue; si absent, on n'affiche rien
	labels?: Record<string, string>;
	// Langue par défaut si Weglot n'est pas dispo
	defaultLanguage?: string;
	// Style simple
	className?: string;
	// Direction du dropdown: 'up' (vers le haut) ou 'down' (vers le bas)
	dropdownDirection?: "up" | "down" | "auto";
	// Event: renvoie { code, label }
	onLanguageChange?: (lang: { code: string; label: string }) => void;
}

const FLAG_SVG_URLS: Record<string, string | undefined> = {
	fr: "/plasmic/weglot/flags/fr.svg",
	en: "/plasmic/weglot/flags/en.svg",
};

function persistLang(code: string) {
	try {
		window.localStorage.setItem("weglot_language", code);
		document.cookie = `weglot_language=${encodeURIComponent(
			code
		)}; path=/; max-age=${60 * 60 * 24 * 365}`;
	} catch {}
}

const WeglotSelector: React.FC<WeglotSelectorProps> = ({
	languages = ["fr", "en"],
	labels = {},
	defaultLanguage = "fr",
	className = "",
	dropdownDirection = "down",
	onLanguageChange,
}) => {
	const weglot =
		(typeof window !== "undefined" && (window as any).Weglot) || null;

	const getLabel = (code: string): string => {
		return Object.prototype.hasOwnProperty.call(labels, code)
			? labels[code] ?? ""
			: "";
	};

	const normalizedOptions = useMemo(() => {
		return languages.map((code) => ({
			code,
			label: getLabel(code),
			flagSvg: FLAG_SVG_URLS[code],
		}));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [languages, labels]);

	const getWeglotLanguage = (): string | null => {
		try {
			if (!weglot) return null;
			// Compat: certaines versions exposent getLanguage, d'autres _getCurrentLang
			return (
				weglot.getLanguage?.() ||
				weglot.getCurrentLang?.() ||
				weglot._getCurrentLang?.() ||
				null
			);
		} catch {
			return null;
		}
	};

	const [selected, setSelected] = useState<string>(defaultLanguage);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [autoOpenUp, setAutoOpenUp] = useState<boolean>(false);

	// Synchronise l'état local avec Weglot au montage (LS puis Weglot si dispo)
	useEffect(() => {
		try {
			const ls = window.localStorage.getItem("weglot_language");
			if (ls) setSelected(ls);
		} catch {}
		const current = getWeglotLanguage();
		if (current && current !== selected) setSelected(current);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Poll court pour attendre l'initialisation réelle de Weglot et resynchroniser
	useEffect(() => {
		let tries = 0;
		const maxTries = 25; // ~2.5s à 100ms
		const id = window.setInterval(() => {
			tries += 1;
			const current = getWeglotLanguage();
			if (current) {
				setSelected((prev) => (prev !== current ? current : prev));
				window.clearInterval(id);
			}
			if (tries >= maxTries) window.clearInterval(id);
		}, 100);
		return () => window.clearInterval(id);
	}, []);

	// Quand Weglot change en dehors (ex: widget natif), on écoute l'évènement si dispo
	useEffect(() => {
		if (!weglot?.on) return;
		const handler = () => {
			const current = getWeglotLanguage();
			if (current) setSelected(current);
		};
		try {
			weglot.on("languageChanged", handler);
			return () => weglot.off?.("languageChanged", handler);
		} catch {
			return;
		}
	}, [weglot]);

	// Resynchronise lorsqu'on revient sur l'onglet (visibility change)
	useEffect(() => {
		const onVis = () => {
			if (document.visibilityState === "visible") {
				const current = getWeglotLanguage();
				if (current) setSelected(current);
			}
		};
		document.addEventListener("visibilitychange", onVis);
		return () => document.removeEventListener("visibilitychange", onVis);
	}, []);

	// Fermer au clic extérieur
	useEffect(() => {
		if (!isOpen) return;
		const onDocClick = (e: MouseEvent | TouchEvent) => {
			const target = e.target as Node | null;
			if (!target) return;
			const inButton = buttonRef.current?.contains(target);
			const inMenu = menuRef.current?.contains(target);
			if (!inButton && !inMenu) setIsOpen(false);
		};
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("touchstart", onDocClick, { passive: true });
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("touchstart", onDocClick);
		};
	}, [isOpen]);

	// Fermer avec Échap
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen]);

	// Decide direction en mode auto (à l'ouverture + resize/scroll)
	const decideAutoDirection = () => {
		try {
			const btn = buttonRef.current;
			if (!btn) return;
			const rect = btn.getBoundingClientRect();
			const viewportH =
				window.innerHeight || document.documentElement.clientHeight;
			const spaceBelow = Math.max(0, viewportH - rect.bottom);
			const spaceAbove = Math.max(0, rect.top);
			// Estimation de la hauteur du menu
			const estimatedItemH = 36; // px
			const estimatedMenuH = Math.min(
				240,
				normalizedOptions.length * estimatedItemH
			);
			// Ouvre vers le haut si dessous insuffisant mais au-dessus suffisant
			if (spaceBelow < estimatedMenuH && spaceAbove > spaceBelow) {
				setAutoOpenUp(true);
			} else {
				setAutoOpenUp(false);
			}
		} catch {}
	};

	useEffect(() => {
		if (!isOpen || dropdownDirection !== "auto") return;
		decideAutoDirection();
		const onWinChange = () => decideAutoDirection();
		window.addEventListener("resize", onWinChange);
		window.addEventListener("scroll", onWinChange, true);
		return () => {
			window.removeEventListener("resize", onWinChange);
			window.removeEventListener("scroll", onWinChange, true);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, dropdownDirection]);

	const switchLanguage = (code: string) => {
		setSelected(code);
		persistLang(code);
		// Notifie Plasmic avec le libellé tel que fourni (éventuellement vide)
		onLanguageChange?.({ code, label: getLabel(code) });
		// Demande à Weglot si présent
		try {
			weglot?.switchTo?.(code);
			weglot?.setLanguage?.(code);
		} catch {}
		setIsOpen(false);
	};

	const isUp =
		dropdownDirection === "up" ||
		(dropdownDirection === "auto" ? autoOpenUp : false);

	return (
		<div
			className={className}
			style={{ position: "relative", display: "inline-block" }}
		>
			<button
				ref={buttonRef}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				onClick={() => {
					setIsOpen((v) => {
						const next = !v;
						if (next && dropdownDirection === "auto") decideAutoDirection();
						return next;
					});
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsOpen((v) => {
							const next = !v;
							if (next && dropdownDirection === "auto") decideAutoDirection();
							return next;
						});
					}
				}}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					padding: "8px 12px",
					borderRadius: 8,
					border: "1px solid #e2e2e2",
					background: "#fff",
					fontSize: 14,
					cursor: "pointer",
					whiteSpace: "nowrap",
				}}
			>
				{FLAG_SVG_URLS[selected] && (
					<img
						src={FLAG_SVG_URLS[selected]!}
						alt=""
						aria-hidden
						style={{
							width: 16,
							height: 12,
							objectFit: "cover",
							borderRadius: 2,
						}}
					/>
				)}
				{getLabel(selected) ? <span>{getLabel(selected)}</span> : null}
				<span aria-hidden style={{ marginLeft: "auto", opacity: 0.6 }}>
					{isOpen ? "▴" : "▾"}
				</span>
			</button>
			{isOpen && (
				<div
					ref={menuRef}
					role="listbox"
					aria-activedescendant={`weglot-opt-${selected}`}
					style={{
						position: "absolute",
						...(isUp
							? { bottom: "100%", marginBottom: 6 }
							: { top: "100%", marginTop: 6 }),
						left: 0,
						zIndex: 1000,
						width: "max-content",
						minWidth: "auto",
						maxHeight: 240,
						overflowY: "auto",
						maxWidth: "90vw",
						overflowX: "auto",
						background: "#fff",
						border: "1px solid #e2e2e2",
						borderRadius: 8,
						boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
					}}
				>
					{normalizedOptions.map((opt) => {
						const isActive = opt.code === selected;
						return (
							<div
								id={`weglot-opt-${opt.code}`}
								key={opt.code}
								role="option"
								aria-selected={isActive}
								onClick={() => switchLanguage(opt.code)}
								onKeyDown={(e) => {
									if (e.key === "Enter") switchLanguage(opt.code);
								}}
								tabIndex={0}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									padding: "8px 12px",
									fontSize: 14,
									background: isActive ? "#f5f5f5" : "#fff",
									cursor: "pointer",
								}}
							>
								{opt.flagSvg && (
									<img
										src={opt.flagSvg}
										alt=""
										aria-hidden
										style={{
											width: 16,
											height: 12,
											objectFit: "cover",
											borderRadius: 2,
										}}
									/>
								)}
								{opt.label ? <span>{opt.label}</span> : null}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default WeglotSelector;
