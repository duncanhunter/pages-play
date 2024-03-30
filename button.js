import {
	addGlobalCss,
	css,
	getRefs,
	html,
} from "./core.js";

const fragmentButton = html`
  <button id="button" part="button">
    <slot name="start"></slot>
    <div part="label"><slot></slot></div>
    <slot name="end"></slot>
    <svg id="loading-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"/><path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"><animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/></path></svg>
  </button>
`;

const stylesButton = css`
	:host {
		display: inline-block;
	}
	
	:host([loading])::part(button) {
		background-color: lightgray;
		color: rgba(0, 0, 0, 0.5);
	}

	:host([variant])::part(button):focus {
		outline: var(--ui-focus-ring);
		outline-offset: var(--ui-focus-ring-offset);
	}

	:host([size="small"])::part(button) {
		font-size: var(--ui-font-size-0);
		line-height: var(--ui-line-height);
		min-height: var(--ui-space-8);
	}

	:host(:not([size]))::part(button),
	:host([size="medium"])::part(button) {
		min-height: var(--ui-space-9);
		font-size: var(--ui-font-size-1);
		line-height: var(--ui-line-height);
	}

	:host([size="large"])::part(button) {
		font-size: var(--ui-font-size-2);
		line-height: var(--ui-line-height);
	}

	:host([variant="primary"])::part(button) {
		background-color: var(--ui-color-primary-500);
		color: white;
	}
	
	:host([variant="success"])::part(button) {
		background-color: var(--ui-color-green-600);
		color: white;
	}

	:host([variant="success"])::part(button):focus {
		outline-color: var(--ui-color-green-600);
	}
	
	:host([variant="danger"])::part(button) {
		background-color: var(--ui-color-red-600);
		color: white;
	}

	:host([variant="danger"])::part(button):focus {
		outline-color: var(--ui-color-red-600);
	}

	:host([variant="info"])::part(button) {
		background-color: var(--ui-color-blue-600);
		color: white;
	}

	:host([variant="info"])::part(button):focus {
		outline-color: var(--ui-color-blue-600);
	}

	:host([variant="warning"])::part(button) {
		background-color: var(--ui-color-orange-600);
		color: white;
	}

	:host([variant="warning"])::part(button):focus {
		outline-color: var(--ui-color-orange-600);
	}

	:host([variant])::part(button) {
		display: inline-flex;
		align-items: center;
		border: none;
		padding-block: 0.55ch;
		padding-inline: 1.2ch;
		border-radius: var(--ui-border-radius-1);
		cursor: pointer;
	}

	:host([variant])::part(label) {
		display: contents;
	}

	:host([icon-only])::part(button) {
		padding-inline: 0.8ch;
	}
	
	:host([variant])::part(button):hover {
		filter: brightness(90%);
	}
	
	:host([variant])::part(button):hover:focus {
		 filter: brightness(90%);
	}

  	:host([disabled])::part(button) {
		background-color: #ccc;
		color: rgba(0, 0, 0, 0.5);
		cursor: not-allowed;
	}

	[name="end"]::slotted(*) {
		margin-inline-start: 0.5ch;
	}

	[name="start"]::slotted(*) {
		margin-inline-end: 0.5ch;
	}

	#loading-icon {
		position: absolute;
		display: none;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
`;

export class Button extends HTMLElement {
	static get observedAttributes() {
		return [
			"type",
			"loading",
			"disabled",
			"button-aria-label",
		];
	}
	static formAssociated = true;
	#internals;

	constructor() {
		super();
		this.attachShadow({ mode: "open", delegatesFocus: true });
		this.shadowRoot.appendChild(fragmentButton.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [stylesButton];
		this.refs = getRefs(this.shadowRoot);
		this.#internals = this.attachInternals();
	}

	// get refs() {
	// 	return Array.from(this.shadowRoot.querySelectorAll("[id]")).reduce(
	// 		(acc, element) => {
	// 			acc[element.id] = element;
	// 			return acc;
	// 		},
	// 		{},
	// 	);
	// }
	get type() {
		return this.getAttribute("type");
	}
	get loading() {
		return this.getAttribute("loading");
	}
	set loading(value) {
		value ? this.setAttribute("loading", "") : this.removeAttribute("loading");
	}

	connectedCallback() {
		this.addEventListener("click", this);
		if (!this.type) {
			this.refs.ids.button.setAttribute("button", "button");
		} else if (this.type === "submit") {
			this.refs.ids.button.type = "submit";
		} else if (this.type === "reset") {
			this.refs.ids.button.type = "reset";
		}
	}

	handleEvent(event) {
		if (this.hasAttribute("disabled")) return;
		if (!this.contains(event.srcElement)) return;
		if (event.type === "click") this.onClick(event);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (newValue === oldValue) return;
		if (name.startsWith("fetch-trigger") && oldValue !== newValue)
			addFetchTriggerEventListener(this, newValue);
		if (name === "loading") this.loadingAttributeChanged(newValue);
		if (name === "type") this.typeChanged(oldValue, newValue);
		if (name === "button-aria-label") {
			this.refs.ids.button.setAttribute("aria-label", newValue);
		}
	}

	onClick() {
		if (this.hasAttribute("loading") || this.hasAttribute("disabled")) return;
		this.dispatchEvent(new CustomEvent("ui-click"));
	}

	loadingAttributeChanged(newValue) {
		// const loadingIcon = this.shadowRoot.querySelector("loading-icon");

		if (newValue === null) {
			this.refs.ids.loadingIcon.style.display = "none";
		} else {
			this.refs.ids.loadingIcon.style.display = "block";
			if (!this.refs.ids.loadingIcon?.getAttribute("name")) {
				this.refs.ids.loadingIcon.setAttribute("name", "loading");
			}
		}
	}

	typeChanged(oldValue, newValue) {
		if (oldValue === "submit") {
			this.removeEventListener("click", this.#onSubmit);
		} else if (oldValue === "reset") {
			this.removeEventListener("click", this.#onReset);
		}

		if (newValue === "submit") {
			this.addEventListener("click", this.#onSubmit);
		} else if (newValue === "reset") {
			this.addEventListener("click", this.#onReset);
		}
	}

	#onSubmit() {
		if (this.#internals.form) {
			this.dispatchEvent(
				new CustomEvent("submitted", { bubbles: true, composed: true }),
			);
			if (this.#internals.form.checkValidity()) {
				const button = document.createElement("button");
				button.type = "submit";
				this.#internals.form.appendChild(button);
				button.click();
				button.remove();
				this.focus();
			} else {
				this.#internals.form.reportValidity();
			}
		}
	}

	#onReset = () => {
		this.#internals.form?.reset();
	};
}

const fragmentButtonGroup = html`
	<slot></slot>
`;

const stylesButtonGroup = css`
	:host {
		display: inline-flex;
	}


	:host([separated]) {
		gap: 2px;
	}
`;

addGlobalCss /*css */`
	ui-button-group:not([separated]) {
		> ui-dropdown:not(:first-child, :last-child) > ui-button::part(button),
		> ui-button:not(:first-child, :last-child)::part(button) {
			border-right: 1px solid var(--ui-color-primary-300);
			border-left: 1px solid var(--ui-color-primary-300);
		}

		> ui-dropdown:first-child > ui-button::part(button),
		> ui-button:first-child::part(button) {
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}

		> ui-dropdown:last-child > ui-button::part(button),
		> ui-button:last-child::part(button) {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}

		> ui-dropdown:not(:first-child,:last-child) > ui-button::part(button),
		> ui-button:not(:first-child,:last-child)::part(button) {
			border-radius: 0;
		}
	}
`;

class ButtonGroup extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.appendChild(fragmentButtonGroup.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [stylesButtonGroup];
	}
}

customElements.define("ui-button-group", ButtonGroup);

customElements.define("ui-button", Button);
