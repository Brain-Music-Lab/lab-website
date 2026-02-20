// Create a custom HTML Element
class BMLHeaderComponent extends HTMLElement {

    constructor() {
        super();  // Call the HTMLElement constructor
    }

    // Runs when the element is inserted into the DOM
    connectedCallback() {
        const message = this.getAttribute('message') || 'Brain Music Lab';
        // Clear any existing content
        this.textContent = '';

        // Header
        const header = document.createElement('header');
        const h1 = document.createElement('h1');
        h1.textContent = message;
        header.appendChild(h1);
        this.appendChild(header);

        // Navigation
        const nav = document.createElement('nav');
        const links = [
            { text: 'Home', href: '/' },
            { text: 'About', href: '/' },
            { text: 'Resources', href: '/' }
        ];
        
        // Iterate over each link and append to the nav element
        links.forEach(linkInfo => {
            const a = document.createElement('a');
            a.className = 'white-link';
            a.href = linkInfo.href;
            a.textContent = linkInfo.text;
            nav.appendChild(a);
        });

        // Append the nav element to the element
        this.appendChild(nav);
    }
}

// Define the element to be able to use it in HTML
customElements.define('bml-header', BMLHeaderComponent);