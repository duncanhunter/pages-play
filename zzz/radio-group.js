import {
	addAttributeProperties,
	createAttributes,
	createEventHandlerName,
	css,
	getRefs,
	html,
	mixins,
} from "./core.js";

const fragmentRadioGroup = html`
<fieldset role="radiogroup" aria-labelledby="label" aria-describedby="label error">
    <label id="label" part="label">
		<slot name="label"></slot>
	</label>
	<div id="help" part="help">
		<slot name="help"></slot>
	</div>	
    <div part="radios-container">
		<slot></slot>
    </div>
	<div id="error" part="error">
		<slot name="error"></slot>
	</div>	
</fieldset>
`;

const stylesRadioGroup = css`
:host {
	display: block;
}

:host([orientation=vertical]) [part=radios-container] {
	flex-direction: column;
}

[part=radios-container] {
	display: flex;
	gap: var(--ui-space-3);
}

fieldset {
	border: none;
	margin: 0;
	padding: 0;
	outline: none;
}
`;

const attributesRadioGroup = createAttributes({
	boolean: ["disabled"],
	property: ["value", "name", "error", "label", "help", "orientation"],
});

class RadioGroup extends HTMLElement {
	static formAssociated = true;
	static get observedAttributes() {
		return Array.from(attributesRadioGroup.keys());
	}

	internals;

	get radios() {
		return Array.from(this.querySelectorAll("ui-radio"));
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.appendChild(fragmentRadioGroup.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [stylesRadioGroup];
		addAttributeProperties(attributesRadioGroup, this);
		this.refs = getRefs(this.shadowRoot);
		this.internals = this.attachInternals();
	}

	connectedCallback() {
		this.addEventListener("ui-change", this);
		this.addEventListener("keydown", this);
		this.initRadios();
	}

	disconnectedCallback() {
		this.removeEventListener("ui-change", this);
		this.removeEventListener("keydown", this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const { callbackName } = attributesRadioGroup.get(name);
		if (callbackName) {
			this[callbackName]?.(oldValue, newValue);
		}
	}

	handleEvent(event) {
		this[createEventHandlerName(event.type)](event);
	}

	labelChanged(_oldValue, newValue) {
		const label = this.shadowRoot.querySelector('[name="label"]');
		label.textContent = newValue;
	}

	helpChanged(_oldValue, newValue) {
		const help = this.shadowRoot.querySelector('[name="help"]');
		help.textContent = newValue;
	}

	errorChanged(_oldValue, newValue) {
		const error = this.shadowRoot.querySelector('[name="error"]');
		error.textContent = newValue;
	}

	onUiChange({ target }) {
		this.updateRadio(target);
		this.updateValidity();
	}

	onKeydown({ target, key }) {
		const radios = this.radios;
		const length = radios.length;
		const currentIndex = radios.findIndex((radio) => radio === target);
		const keyDirection = {
			ArrowDown: 1,
			ArrowRight: 1,
			ArrowUp: -1,
			ArrowLeft: -1,
		}[key];
		if (!keyDirection || currentIndex === -1) return;
		const nextIndex = (currentIndex + keyDirection + length) % length;
		this.updateRadio(radios[nextIndex]);
	}

	initRadios() {
		const selectedRadio = this.radios.find((radio) => radio.checked);

		this.radios.forEach((radio, i) => {
			radio.setAttribute(
				"tabindex",
				selectedRadio === radio || (!selectedRadio && i === 0) ? "0" : "-1",
			);
		});
	}

	updateRadio(targetRadio) {
		for (const radio of this.radios) {
			if (radio !== targetRadio) {
				radio.removeAttribute("checked");
				radio.setAttribute("tabindex", "-1");
			} else {
				this.value = targetRadio.value;
				this.internals.setFormValue(targetRadio.value);
				radio.setAttribute("checked", "");
				radio.setAttribute("tabindex", "0");
				radio.focus();
			}
		}
	}

	updateValidity() {
		const isValid = this.radios.some((radio) => radio.hasAttribute("checked"));
		const error = this.shadowRoot.querySelector('[name="error"]');
		const firstRadio = this.radios[0];

		if (!isValid) {
			this.internals.setValidity({ customError: true }, " ", firstRadio);
			this.error = "Please select an option.";
			error.textContent = this.error;
			this.refs.ids.error.setAttribute("role", "alert");
			this.refs.ids.error.setAttribute("aria-live", "polite");
			firstRadio.setAttribute("aria-invalid", "true");
			firstRadio.setAttribute("aria-required", "true");
			firstRadio.focus();
		} else {
			firstRadio.removeAttribute("aria-invalid");
			firstRadio.removeAttribute("aria-required");
			error.textContent = "";
			this.internals.setValidity({});
		}

		return isValid;
	}

	focus() {
		const focusableRadio = this.querySelector('ui-radio[tabindex="0"]');
		if (focusableRadio) {
			focusableRadio.focus();
		}
	}
}

const fragmentRadio = html`
	<span part="circle"></span>
	<slot part="label"></slot>
`;

const stylesRadio = css`
:host {
    display: inline-flex;
	align-items: center;
	gap: var(--ui-space-3);
	outline: none;
	cursor: pointer;
}

:host(:focus) [part=circle] {
	outline: var(--ui-focus-ring);
	outline-offset: var(--ui-focus-ring-offset);
}

:host([checked]) [part=circle] {
	width: var(--ui-space-6);
	height: var(--ui-space-6);
	background-color: transparent;
	border-radius: 50%;
	box-shadow: inset 0 0 0 5px var(--ui-color-primary-500);
}

:host(:not([checked])) [part=circle] {
	width: var(--ui-space-6);
	height: var(--ui-space-6);
	background-color: transparent;
	box-shadow: inset 0 0 0 1px var(--ui-border-color-2);
	border-radius: 50%;
}
`;

const attributesRadio = createAttributes({
	boolean: ["checked"],
	property: ["value"],
});

class Radio extends HTMLElement {
	static get observedAttributes() {
		return Array.from(attributesRadio.keys());
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.appendChild(fragmentRadio.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [stylesRadio];
		addAttributeProperties(attributesRadio, this);
		this.attachInternals().role = "radio";
	}

	connectedCallback() {
		this.addEventListener("click", this);
		this.addEventListener("keydown", this);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		const { callbackName } = attributesRadio.get(name);
		if (callbackName) {
			this[callbackName]?.(oldValue, newValue);
		}
	}

	disconnectedCallback() {
		this.removeEventListener("click", this);
		this.removeEventListener("keydown", this);
	}

	handleEvent(event) {
		this[createEventHandlerName(event.type)](event);
	}

	onClick(event) {
		event.preventDefault();
		this.dispatchEvent(new CustomEvent("ui-change", { bubbles: true }));
	}

	onKeydown(event) {
		if (event.key === " ") {
			event.preventDefault();
			this.dispatchEvent(new CustomEvent("ui-change", { bubbles: true }));
		}
	}
}

customElements.define("ui-radio", Radio);
customElements.define("ui-radio-group", RadioGroup);
