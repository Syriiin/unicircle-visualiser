class UniCircleVisualiser extends HTMLElement {
    constructor() {
        super();

        // attach shadow dom
        this.attachShadow({mode: 'open'});

        // create our content element
        const content = document.createElement("div")
        content.innerHTML = `
            <svg width=100 height=100>
                <circle id="myCircle" cx=50 cy=50 r=20 />
            </svg>
        `;

        // create our style element
        const style = document.createElement("style");
        style.textContent = `
            svg circle {
                fill: green;
            }
        `;

        // attach out styles and content to our shadowroot
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(content);
    }

    setData(data: any) {
        console.log(data);
        this.shadowRoot.getElementById("myCircle").style.fill = data;
    }

    connectedCallback() {
        console.log("attached");
    }

    disconnectedCallback() {
        console.log("detached");
    }
}

window.customElements.define("unicircle-visualiser", UniCircleVisualiser);
