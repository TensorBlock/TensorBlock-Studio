![TensorBlock Logo Banner](https://img.kookapp.cn/assets/2025-04/11/VWFJZWKDAe1uo0c0.png)
# TensorBlock Studio

![TensorBlock Studio stars](https://img.shields.io/github/stars/TensorBlock/TensorBlock-Studio)
![TensorBlock Studio forks](https://img.shields.io/github/forks/TensorBlock/TensorBlock-Studio)

> A lightweight, open, and extensible multi-LLM interaction studio.  
> Part of the [TensorBlock](https://tensorblock.co) ecosystem — built to empower anyone to build with AI from anywhere, not just use it.

<br>

![TensorBlock Studio Banner](https://img.kookapp.cn/assets/2025-04/11/vUWcjF1fvQ1uo0rr.png)

<br>

## What Makes TensorBlock Studio Different?

Forget generic AI chat tools. **TensorBlock Studio** is a new kind of workspace — one that's lightweight, developer-friendly, and yet welcoming to beginners. It's designed around control, clarity, and creation.

<br>

## Features

- Multiple LLM provider
- Web search compatible
- Multi-language UI and prompt support
- Beginner-friendly experience
- Framer Motion UI transitions
- Local-first data storage for speed and privacy

<br>

![TensorBlock Studio Screenshot 01](https://img.kookapp.cn/assets/2025-04/11/JDdzXkmU7b1uo11f.png)

![TensorBlock Studio Screenshot 01](https://img.kookapp.cn/assets/2025-04/11/DcK9HjWQx71uo11f.png)

![TensorBlock Studio Screenshot 01](https://img.kookapp.cn/assets/2025-04/11/o8hDNKQybP1uo11f.png)

<br>

# 🎯Short-Term Roadmap

- [ ] Sharing and exports
- [ ] Collection of knowledge pieces
- [ ] Mobile-friendly UI (PWA or native shell)
- [ ] Plugin system for extensions and custom logic
- [ ] More themes

<br>

# 🔩Tech Stack

- Framework: Typescript + Node.js 18 + React + Vite + Electron
- UI: Tailwind CSS
- LLM Routing: @ai/sdk
- Storage: IndexedDB / localStorage
- i18n: i18next

<br>

![Getting Started](https://img.kookapp.cn/assets/2025-04/11/BfsbY3Pszp1uo0c0.png)
# ⭐Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/TensorBlock/TensorBlock-Studio.git
   cd tensorblock-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the application in development mode:

```bash
npm run dev
```

### Building for Production

Package the application for your current platform:

```bash
npm run electron:build:current_platform
```

<br>

# 📄 Documentation

Comprehensive documentation is available in the `docs` directory:

- [Documentation Index](docs/docs_index.md) - Main documentation entry point with links to all sections
- [Overview](docs/overview.md) - System architecture and high-level application design

<br>

# 🤝Contributing

We welcome contributions from the community!

### Contributing Steps
1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (git commit -m 'Add amazing feature')
6. Push to your branch (git push origin feature/amazing-feature)
7. Open a Pull Request

### Development Guidelines
- Follow the code style guide
- Write tests for new features
- Update documentation for any changes
- See CONTRIBUTING.md for detailed guidelines

<br>

# 📄License

MIT