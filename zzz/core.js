/**
 * Collection of utility functions for generating CSS mixins.
 *
 * @namespace mixins
 */
export const mixins = {
	/**
	 * Generates a breakpoint string based on the provided length.
	 *
	 * @param {string} length - The length sm, md or lg.
	 * @returns {string} The length.
	 */
	containerLength: (length) => config.getBreakpoint(length),

	/**
	 * Generates a media query string based on the provided range.
	 *
	 * @param {string} range - The range for the media query.
	 * @returns {string} The generated media query string.
	 */
	mediaQuery: (range) =>
		({
			smUp: `(width >= ${config.getBreakpoint("sm")})`,
			smDown: `(width < ${config.getBreakpoint("sm")})`,
			mdOnly: `(${config.getBreakpoint(
				"sm",
			)} <= width <= ${config.getBreakpoint("lg")})`,
			mdUp: `(width >= ${config.getBreakpoint("md")})`,
			mdDown: `(width < ${config.getBreakpoint("md")})`,
			lgUp: `(width >= 1${config.getBreakpoint("lg")})`,
			lgDown: `(width < 1${config.getBreakpoint("lg")})`,
		})[range],
};

/**
 * Configuration object for the application.
 * @typedef {Object} Config
 * @property {string} iconPath - The path to the icons directory.
 * @property {Object} breakpoints - The breakpoints for media queries.
 * @property {string} breakpoints.sm - The breakpoint for small screens.
 * @property {string} breakpoints.md - The breakpoint for medium screens.
 * @property {string} breakpoints.lg - The breakpoint for large screens.
 * @property {string} prefix - The prefix for CSS classes.
 */

/**
 * The configuration object for the application.
 * @type {Config}
 */
export const config = (() => {
	let config = {
		iconPath: "../icons",
		breakpoints: {
			sm: "640px",
			md: "768px",
			lg: "1024px",
		},
		prefix: "ui",
	};

	/**
	 * Updates the configuration object with new values.
	 * @param {Partial<Config>} newConfig - The new configuration values.
	 */
	function updateConfig(newConfig) {
		config = Object.assign(config, newConfig);
	}

	/**
	 * Retrieves the current configuration object.
	 * @returns {Config} The current configuration object.
	 */
	function getConfig() {
		return config;
	}

	return {
		updateConfig,
		getConfig,
	};
})();

const globalStyleCache = new Map();
const setGlobalAdoptedStyles = (cssText) => {
	if (globalStyleCache.get(cssText)) return false;
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(cssText);
	globalStyleCache.set(cssText, sheet).get(cssText);
	return true;
};

/**
 * Adds global CSS to the document.
 * This function ensures that the CSS is only added once.
 *
 * @param {string} css - The CSS to be added.
 */
export const addGlobalCss = (strings, ...values) => {
	const added = setGlobalAdoptedStyles(
		strings.reduce((acc, str, i) => acc + str + (values[i] || ""), ""),
	);
	if (added) {
		document.adoptedStyleSheets = [...globalStyleCache.values()];
	}
};

const styleCache = new Map();

const getAdoptedStyles = (cssText) =>
	styleCache.get(cssText) ||
	(() => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(cssText);
		return styleCache.set(cssText, sheet).get(cssText);
	})();

/**
 * Returns the adopted styles for a given CSS string.
 *
 * @param {TemplateStringsArray} strings - The template strings array.
 * @param {...any} values - The values to interpolate into the strings.
 * @returns {CSSStyleSheet} The adopted styles.
 */
export const css = (strings, ...values) =>
	getAdoptedStyles(
		strings.reduce((acc, str, i) => acc + str + (values[i] || ""), ""),
	);

const templateCache = new Map();

const createTemplate = (htmlString) => {
	let fragment = templateCache.get(htmlString);

	if (!fragment) {
		const template = document.createElement("template");
		template.innerHTML = htmlString;
		fragment = document.adoptNode(template.content);
		templateCache.set(htmlString, fragment);
	}

	return fragment;
};

/**
 * Creates a template from the given template strings and values.
 *
 * @param {TemplateStringsArray} strings - The template strings array.
 * @param {...any} values - The values to interpolate into the strings.
 * @returns {DocumentFragment} The created template.
 */
export const html = (strings, ...values) =>
	createTemplate(
		strings.reduce(
			(acc, str, i) =>
				acc +
				str +
				((Array.isArray(values[i]) ? values[i].join("") : values[i]) || ""),
			"",
		),
	);

/**
 * Converts a spinal-case string to camelCase.
 *
 * @param {string} string - The spinal-case string to convert.
 * @returns {string} The camelCase version of the input string.
 */
export const spinalToCamel = (string) =>
	string.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

/**
 * Creates an event handler name by converting a string to camel case.
 * @param {string} string - The input string.
 * @returns {string} The event handler name in camel case.
 */
export const createEventHandlerName = (string) =>
	string.replace(
		/(^|-)([a-z])/g,
		(_match, prefix, letter) =>
			`${prefix === "-" ? "" : "on"}${letter.toUpperCase()}`,
	);

/**
 * Creates a map of attributes based on the provided object.
 *
 * @param {Object} attributes - The object containing attribute types and values.
 * @returns {Map} - A map of attributes with their corresponding properties, types, and callback names.
 */
export const createAttributes = (attributes) => {
	const attributeMap = new Map();
	for (const [type, values] of Object.entries(attributes)) {
		for (const attribute of values) {
			const property = spinalToCamel(attribute);
			const callbackName = `${property}Changed`;
			attributeMap.set(attribute, { type, property, attribute, callbackName });
		}
	}
	return attributeMap;
};

/**
 * Adds attribute properties to an instance.
 *
 * @param {Array} attributes - An array of attribute objects.
 * @param {Object} instance - The instance to add the attribute properties to.
 */
export const addAttributeProperties = (attributes, instance) => {
	for (const [property, { attribute, type }] of attributes) {
		Reflect.defineProperty(instance, property, {
			get() {
				if (type === "boolean") {
					return this.hasAttribute(attribute);
				}
				return this.getAttribute(attribute);
			},
			set(value) {
				if (type === "boolean") {
					this.toggleAttribute(attribute, value);
				} else {
					this.setAttribute(attribute, value);
				}
			},
		});
	}
};

/**
 * Removes falsy values from an object.
 *
 * @param {Object} options - The object containing key-value pairs.
 * @returns {Object} - The object with falsy values removed.
 */
export const stripFalsy = (options) =>
	Object.entries(options).reduce((acc, [key, value]) => {
		if (value) {
			acc[key] = value;
		}
		return acc;
	}, {});

/**
 * Generates a unique ID.
 * @returns {string} The generated ID.
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Retrieves references to elements with id, part, or name attributes.
 *
 * @param {HTMLElement} html - The root element to search within.
 * @returns {Object} - An object containing references to elements grouped by ids, parts, and slots.
 */
export function getRefs(html) {
	return Array.from(html.querySelectorAll("[id], [part], [name]")).reduce(
		(acc, element) => {
			const camelCase = (attribute) =>
				attribute.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
			const { id, part, name } = element;
			if (part) {
				const parts = [...part];
				for (const part of parts) {
					acc.parts[camelCase(part)] = element;
				}
			}
			if (id) acc.ids[camelCase(id)] = element;
			if (name) acc.slots[camelCase(name)] = element;
			return acc;
		},
		{ ids: {}, parts: {}, slots: {} },
	);
}

export const createPopover = (
	triggerContainerElement,
	popoverElement,
	options = {},
) => {
	const {
		placement = "bottom",
		flip = true,
		autoUpdate = true,
		offset = 0,
		popoverWidth = "trigger-width",
	} = options;

	// console.log({ placement, flip, autoUpdate, offset, popoverWidth, trigger });

	const hoverBridge = document.createElement("div");
	hoverBridge.style.position = "absolute";
	hoverBridge.style.background = "blue";
	triggerContainerElement.appendChild(hoverBridge);

	const updatePosition = () => {
		const triggerRect = triggerContainerElement.getBoundingClientRect();
		const shadowRoot = popoverElement.getRootNode();
		const parentElement = shadowRoot
			? shadowRoot.host?.parentElement
			: undefined;
		const enoughRoomBelow =
			window.innerHeight - triggerRect.bottom >= popoverElement.offsetHeight;
		const enoughRoomAbove = () =>
			triggerRect.top >= popoverElement.offsetHeight;
		const enoughRoomRight =
			window.innerWidth - triggerRect.right - offset >=
			popoverElement.offsetWidth;
		const enoughRoomLeft = triggerRect.left >= popoverElement.offsetWidth;

		// console.log("updatePosition", {
		// 	rect: triggerRect,
		// 	enoughRoomBelow,
		// 	enoughRoomAbove: enoughRoomAbove(),
		// 	enoughRoomRight,
		// 	enoughRoomLeft,
		// });

		switch (placement) {
			case "top":
				popoverElement.style.top =
					enoughRoomAbove() || !enoughRoomBelow
						? `-${popoverElement.offsetHeight}px`
						: `${triggerRect.height}px`;
				break;
			case "right":
				popoverElement.style.top = `${0}px`;
				popoverElement.style.left =
					enoughRoomRight || !enoughRoomLeft
						? `${triggerRect.width + offset}px`
						: `-${popoverElement.offsetWidth + offset}px`;
				break;
			case "bottom":
				popoverElement.style.top =
					enoughRoomBelow || !enoughRoomAbove()
						? `${triggerRect.height + offset}px`
						: `-${popoverElement.offsetHeight + offset}px`;
				break;
			case "bottom-end":
				if (
					popoverWidth === "include-previous-sibling" &&
					shadowRoot.host.previousElementSibling
				) {
					let parentElementGap = 0;
					if (parentElement?.hasAttribute("separated")) {
						const gap = getComputedStyle(parentElement)?.gap;
						parentElementGap = gap ? +gap.replace("px", "") : 0;
					}
					const previousSiblingWidth =
						shadowRoot.host.previousElementSibling.offsetWidth +
						parentElementGap;
					popoverElement.style.width = `${
						triggerRect.width + previousSiblingWidth
					}px`;
					popoverElement.style.left = `-${previousSiblingWidth}px`;
				}
				popoverElement.style.top =
					enoughRoomBelow || !enoughRoomAbove()
						? `${triggerRect.height + offset}px`
						: `-${popoverElement.offsetHeight + offset}px`;

				hoverBridge.style.width = `${popoverElement.offsetWidth}px`;
				hoverBridge.style.height = `${offset}px`;
				hoverBridge.style.top = `-${offset}px`;
				hoverBridge.style.left = popoverElement.style.left;
				hoverBridge.style.clipPath = `polygon(0 0, 100% 0, 100% 100%, ${
					(triggerRect.width / popoverElement.offsetWidth) * 100
				}% 100%)`;

				break;
			case "left": {
				popoverElement.style.top = `${0}px`;
				popoverElement.style.right =
					enoughRoomLeft || !enoughRoomRight
						? `${triggerRect.width + offset}px`
						: `-${popoverElement.offsetWidth + offset}px`;
				hoverBridge.style.width = `${offset}px`;
				hoverBridge.style.height = `${popoverElement.offsetHeight}px`;
				hoverBridge.style.top = `${popoverElement.offsetTop}px`;
				hoverBridge.style.left = `${
					popoverElement.offsetLeft + popoverElement.offsetWidth
				}px`;
				hoverBridge.style.clipPath = `polygon(0 0, 100% 0, 100% ${
					(triggerRect.height / popoverElement.offsetHeight) * 100
				}%, 0 100%)`;
				// const topRight = [offset, 0];
				// const bottomRight = [offset, popover.offsetHeight];
				// const bottomLeft = [0, popover.offsetHeight];
				// const topLeft = [0, 0];

				// Set the clip-path property
				// debugger;
				break;
			}
		}

		if (popoverWidth === "trigger-width") {
			popoverElement.style.width = `${triggerRect.width}px`;
		} else if (
			popoverWidth === "include-previous-sibling" &&
			shadowRoot.host.previousElementSibling
		) {
			const previousSibling = shadowRoot.host.previousElementSibling;
			const siblingWidth = previousSibling.offsetWidth;
			popoverElement.style.width = `${triggerRect.width + siblingWidth}px`;
		}
		// else if (
		// 	popoverWidth === "include-next-sibling" &&
		// 	shadowRoot.host.nextElementSibling
		// ) {
		// 	const nextSibling = shadowRoot.host.nextElementSibling;
		// 	const siblingWidth = nextSibling.offsetWidth;
		// 	popover.style.width = `${triggerRect.width + siblingWidth}px`;
		// 	popover.style.width = `${triggerRect.width + shadowRoot.host.nextElementSibling.offsetWidth}px`;
		// }
	};

	const show = () => {
		popoverElement.style.display = "block";
		updatePosition();
		if (autoUpdate) {
			window.addEventListener("scroll", updatePosition);
			window.addEventListener("resize", updatePosition);
			window.addEventListener("click", handleClickOutside);
		}
	};

	const hide = () => {
		popoverElement.style.display = "none";
		if (autoUpdate) {
			window.removeEventListener("scroll", updatePosition);
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("click", handleClickOutside);
		}
	};

	const handleClickOutside = (event) => {
		if (
			!event.composedPath().includes(popoverElement) &&
			event.target !== triggerContainerElement
		) {
			hide();
		}
	};

	const isOpen = () =>
		popoverElement.style.display === "block" ? true : false;

	const toggle = (event) => {
		event.preventDefault();
		event.stopPropagation();
		popoverElement.style.display === "block" ? hide() : show();
	};

	return {
		show,
		hide,
		updatePosition,
		toggle,
		destroy,
		isOpen,
	};
};
