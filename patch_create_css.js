const fs = require('fs');

let css = fs.readFileSync('D:/03_MEDIA_CONTENT/App/style.css', 'utf8');

// 1. Label font weight
css = css.replace(/\.field label \{[\s\S]*?\}/, `.field label {
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 600;
}`);

// 2. Input / Select / Textarea
css = css.replace(/border-radius: 18px;/g, `border-radius: var(--radius-md);`);
css = css.replace(/height: 48px;/g, `height: 44px;`);

// 3. Add Custom Select styles at the end
const customSelectCss = `
/* Custom Select */
.custom-select-wrapper {
  position: relative;
  user-select: none;
  width: 100%;
}

.custom-select {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel-strong);
  color: var(--text);
  cursor: pointer;
  transition: border 180ms ease, box-shadow 180ms ease;
}

.custom-select:focus,
.custom-select-wrapper.open .custom-select {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.custom-select-trigger {
  font-size: 14px;
  color: var(--text);
}

.custom-select-arrow {
  width: 16px;
  height: 16px;
  stroke: var(--muted);
  transition: transform 180ms ease;
}

.custom-select-wrapper.open .custom-select-arrow {
  transform: rotate(180deg);
}

.custom-options {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-hover);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: all 180ms ease;
}

.custom-select-wrapper.open .custom-options {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.custom-option {
  padding: 10px 14px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: background 150ms ease;
}

.custom-option:hover {
  background: var(--panel-strong);
}

.custom-option.selected {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
`;

if (!css.includes("custom-select-wrapper")) {
  css += customSelectCss;
}

fs.writeFileSync('D:/03_MEDIA_CONTENT/App/style.css', css);
console.log("Create SEO CSS patched successfully!");
