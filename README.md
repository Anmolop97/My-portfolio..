# 🌌 Anmol Kumar — Creative Developer Portfolio

An interactive, high-performance 3D developer portfolio engineered with **Three.js**, hardware-accelerated **WebGL**, procedural Canvas 2D textures, and modern modular architecture.

![Portfolio Preview](modular_hero_verified.png)

---

## ✨ Features & Engineering Highlights

- **💻 3D Workstation Kinematics**:
  - Custom Three.js model with procedural brushed-aluminum chassis, beveled edges, illuminated Apple-style keyboard well, and realistic chiclet keys.
  - Interactive C code editor screen (`coditech_core.c`) with syntax highlighting generated on dynamic Canvas 2D texture.
  - Ultra-smooth trigonometric hinge unfold (`1.15s`) and glowing display power-on transition (`0.65s`) upon site load.
  - Ergonomic target viewing angle (`rotX: 0.35, rotY: -0.07`) matching high-end workstation photography.

- **🪐 Zero-Cost Celestial Space Orbits & Floating Physics**:
  - Multi-tier elliptical orbit rings with rotating telemetry stations, glowing nodes, and cyber radar sweeps.
  - Natural zero-G sinusoidal drifting physics (`Math.sin() / Math.cos()`) with damping interpolation (`lerp`) — zero physics engine overhead and 60 FPS performance.

- **🎵 Ambient Cyber Soundscape & Quantum Sound Core**:
  - Web Audio API integration with smooth exponential gain ramps (`AudioParam.exponentialRampToValueAtTime`).
  - Interactive 3D Quantum Orb widget with dual rotating orbital rings, pulse-reactive audio feedback, and HUD toast.

- **⚡ Zero-Jank Brand Intro Preloader**:
  - Cinematic dual-wing delta emblem with rotating orbital HUD gyro-ring.
  - Pre-warmed 3D shaders, geometries, and typography to eliminate first-frame drop rates.

---

## 📁 Repository Architecture & Division

The codebase is split into clean, modular, maintainable layers for GitHub, separating presentation, logic, styling, and assets:

```text
├── index.html                # Semantic HTML5 master document & Open Graph social metadata
├── css/
│   └── style.css             # Comprehensive CSS3 design system (typography, layout, glow effects)
├── js/
│   ├── space-rings.js        # Background celestial orbit canvas & zero-cost floating physics
│   ├── laptop.js             # 3D workstation geometry, keyboard generator & C editor screen
│   ├── quantum-orb.js        # 3D interactive quantum sound core & particle halo
│   ├── main.js               # Master 3D scene bootstrapper & preloader coordination
│   ├── audio.js              # Ambient soundscape controller & audio toast interactions
│   ├── nav.js                # Navigation drawer, clipboard email copy & form handlers
│   └── intro.js              # Cinematic intro preloader motion & smooth push transition
├── assets/
│   ├── images/
│   │   └── logo.png          # High-resolution vector brand emblem
│   └── audio/
│       └── ambient.mp3       # Ambient cyber soundscape audio track
├── .gitignore                # Clean Git ignore file for temp files, OS artifacts & logs
├── LICENSE                   # MIT License
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/portfolio.git
cd portfolio
```

### 2. Run Locally
You can run the project using any static file server:

- **Using VS Code Live Server**: Right click `index.html` → *Open with Live Server*.
- **Using Python**:
  ```bash
  python -m http.server 8000
  ```
- **Using Node.js (`npx serve`)**:
  ```bash
  npx serve .
  ```

Open your browser and navigate to `http://localhost:8000` (or `http://localhost:3000`).

---

## 🌐 Deployment to GitHub Pages

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: modular portfolio architecture with 3D workstation & celestial orbits"
   git branch -M main
   git remote add origin https://github.com/your-username/portfolio.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select `main` branch and `/ (root)` folder, then click **Save**.
3. Your portfolio will be live at `https://your-username.github.io/portfolio/` within minutes!

---

## 🛠️ Tech Stack

- **3D Engine**: Three.js (r128)
- **Graphics**: WebGL, HTML5 Canvas 2D Context
- **Audio**: Web Audio API
- **Styling**: Modern CSS3 (Grid, Flexbox, Custom Properties, Glassmorphism)
- **Typography**: Orbitron, JetBrains Mono, Plus Jakarta Sans, Space Grotesk

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use and adapt it for your own portfolio.
