# Gabarita Open Edu Kit — 3D STEM Models & PDF Exam Generator

An open-source, zero-dependency, browser-based educational toolkit built for high school teachers and students in Brazil:

1. **30 Interactive 3D STEM Models (`modelos/`)** — WebGL/Three.js interactive simulations for Biology, Chemistry, Physics, Geography, and Mathematics.
2. **Client-Side PDF Exam & Question List Generator (`gerador-pdf/`)** — Upload question files (`JSON`, `TXT`, `MD`, `CSV`) or cropped question images (`PNG`, `JPG`), customize the school header, and export print-ready A4 PDF exams in 1- or 2-column layout with an automatic bubble answer sheet and a separate answer key.

Both tools run **100% locally in the browser** with zero backend, zero API costs, and no installation required—making them accessible to public high schools with limited hardware.

## Modules

### 1. Interactive 3D STEM Models (`modelos/`)
- **Biology:** Human Body Dissection (`corpo.html`), Heart (`coracao.html`), Human Eye (`olho.html`), DNA (`dna.html`), Animal & Plant Cells (`celula-animal.html`, `celula-vegetal.html`), Mitosis (`mitose.html`), Photosynthesis (`fotossintese.html`), Cellular Respiration (`respiracao.html`), Neuron (`neuronio.html`), Microorganisms (`microbios.html`), Leaf Structure (`folha.html`).
- **Chemistry:** Atomic Models (`atomo.html`, `atomo-dalton.html`, `atomo-thomson.html`, `atomo-rutherford.html`, `atomo-atual.html`), Chemical Bonds (`ligacoes.html`), Molecular Geometry (`moleculas.html`), Isomerism (`isomeria.html`), Interactive Periodic Table (`tabela-periodica.html`), States of Matter (`estados.html`).
- **Physics & Math:** Waves (`ondas.html`), Optics (`optica.html`), Geometric Solids (`solidos.html`).
- **Geography & Astronomy:** Earth Structure (`terra.html`), Seasons (`estacoes.html`), Moon Phases (`lua.html`), Relief (`relevo.html`), Plate Tectonics (`tectonica.html`).

### 2. PDF Exam & Question List Generator (`gerador-pdf/`)
- **Multi-format import:** Drag and drop `.json`, `.txt`, `.md`, `.csv`, or question screenshots (`.png`, `.jpg`, `.webp`).
- **Exam formats:** Supports True/False (Cebraspe/PAS style), Multiple Choice (A–E), and Open/Numeric items.
- **Print-ready A4 output:** 1-column or 2-column exam layout, customizable school/teacher header, student info block, automatic bubble sheet (Cartão-Resposta), and separate Answer Key page.
- **Reusable banks:** Save and reload any question list as JSON.

## How to Run Locally

No build step or server installation is required.

1. Clone or download this repository.
2. Open `index.html` in any modern desktop or mobile browser (or serve locally with `python3 -m http.server`).
3. Choose either **30 Modelos 3D Interativos** or **Gerador de Listas e Provas em PDF**.

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
